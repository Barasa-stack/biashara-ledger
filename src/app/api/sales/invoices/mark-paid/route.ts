import { NextResponse } from 'next/server';
import { get, run, withTenantContext, transaction } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { buildReceiptHtml } from '@/lib/print';
import { createTransporter, getSmtpConfig } from '@/lib/email';
import { generatePdfBuffer } from '@/lib/pdf';

const ALLOWED_PAYMENT_METHODS = ['cash', 'mpesa', 'card', 'bank_transfer', 'cheque', 'other'];

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');

    const body = await request.json();
    const invoice_id = body.invoice_id || body.id;
    const payment_method = body.payment_method || 'cash';
    const payment_type = body.payment_type || 'full';
    const idempotencyKey = body.idempotency_key; // optional, for duplicate prevention
    if (!invoice_id) return NextResponse.json({ error: 'Missing invoice_id' }, { status: 400 });
    if (!ALLOWED_PAYMENT_METHODS.includes(payment_method)) {
      return NextResponse.json({ error: 'Invalid payment_method' }, { status: 400 });
    }

    const ctx = await withTenantContext(session.tenant_id!, async () => {
      return await transaction(async (client) => {
        // Lock the invoice row for the duration of the transaction
        const invoiceRes = await client.query(
          'SELECT * FROM sales_invoices WHERE id=$1 FOR UPDATE',
          [invoice_id]
        );
        const invoice = invoiceRes.rows[0] as any;
        if (!invoice) return { error: 'Invoice not found' };
        if (invoice.status === 'paid') return { error: 'Invoice already paid' };

        const customerRes = await client.query('SELECT * FROM customers WHERE id=$1', [invoice.customer_id]);
        const customer = customerRes.rows[0] as any;
        const companyRes = await client.query('SELECT * FROM company_settings LIMIT 1');
        const company = companyRes.rows[0] as any;

        const today = new Date().toISOString().split('T')[0];
        const paidAmount = payment_type === 'partial' ? Math.min(Number(body.partial_amount) || 0, invoice.amount) : invoice.amount;
        const totalPaid = (Number(invoice.paid_amount) || 0) + paidAmount;
        const newRemaining = Number(invoice.amount) - totalPaid;
        const newStatus = newRemaining <= 0 ? 'paid' : 'partially_paid';

        // Check for idempotency key if provided
        if (idempotencyKey) {
          const existing = await client.query(
            'SELECT id FROM payments WHERE notes ILIKE $1 LIMIT 1',
            [`%idempotency:${idempotencyKey}%`]
          );
          if (existing.rows.length > 0) {
            return { error: 'Duplicate payment (idempotency key already processed)' };
          }
        }

        // Record the payment
        const notes = payment_type === 'partial'
          ? `Partial payment for ${invoice.invoice_number}. KES ${paidAmount.toLocaleString('en-US')} received. Total paid: KES ${totalPaid.toLocaleString('en-US')}. Remaining: KES ${newRemaining.toLocaleString('en-US')}${idempotencyKey ? ` [idempotency:${idempotencyKey}]` : ''}`
          : `Full payment for ${invoice.invoice_number}. KES ${paidAmount.toLocaleString('en-US')} received.${idempotencyKey ? ` [idempotency:${idempotencyKey}]` : ''}`;

        await client.query(
          `INSERT INTO payments (tenant_id, invoice_id, customer_id, customer_name, amount, payment_date, payment_method, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [session.tenant_id, invoice.id, invoice.customer_id, invoice.customer_name, paidAmount, today, payment_method, notes]
        );

        // Update invoice: only paid_amount and status — amount stays at original total
        await client.query('UPDATE sales_invoices SET paid_amount=$1, status=$2 WHERE id=$3', [totalPaid, newStatus, invoice.id]);

        return { invoice, customer, company, today, paidAmount, remaining: newRemaining, newStatus };
      });
    });

    if ('error' in ctx) {
      const statusCode = ctx.error === 'Invoice not found' ? 404 : 400;
      return NextResponse.json({ error: ctx.error }, { status: statusCode });
    }

    const { invoice, customer, company, today, paidAmount, remaining, newStatus } = ctx;

    let emailSent = false;
    let emailError: string | null = null;
    const customerEmail = customer?.email_address;

    if (customerEmail) {
      try {
        const receiptHtml = buildReceiptHtml(invoice, {
          amount: paidAmount,
          payment_method,
          payment_date: today,
          payment_type,
          remaining,
        }, company);

        const transporter = await createTransporter(session.tenant_id!);
        if (transporter) {
          let pdfBuffer: Uint8Array | null = null;
          try {
            pdfBuffer = await generatePdfBuffer(receiptHtml);
          } catch (err: any) {
            console.error('Receipt PDF generation failed:', err.message);
          }

          const companyName = company?.company_name || 'BiasharaLedger';
          const smtpConfig = await getSmtpConfig(session.tenant_id!);
          const smtpUser = smtpConfig?.fromAddr || company?.smtp_user || '';

          const emailHtml = `
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;">
              <div style="background:#dc2626;padding:24px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:20px;letter-spacing:0.5px;">${companyName}</h1>
              </div>
              <div style="padding:30px;background:#fff;">
                <p style="font-size:15px;color:#333;">Dear ${invoice.customer_name || 'Valued Customer'},</p>
                <p style="font-size:14px;color:#444;line-height:1.6;">
                  ${payment_type === 'partial'
                    ? `We have received your partial payment of <strong>KES ${paidAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong> for invoice <strong>${invoice.invoice_number}</strong>. Your remaining balance is <strong>KES ${remaining.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>.`
                    : `We have received your full payment of <strong>KES ${paidAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong> for invoice <strong>${invoice.invoice_number}</strong>. Your invoice has been settled in full.`}
                </p>
                <p style="font-size:14px;color:#444;line-height:1.6;">Thank you for your business and prompt payment. We truly appreciate your trust.</p>
                <p style="font-size:14px;color:#444;line-height:1.6;">A receipt is attached to this email for your records.</p>
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
                <p style="font-size:12px;color:#888;">Invoice: ${invoice.invoice_number} | Status: ${newStatus.replace('_', ' ')} | Date: ${today}</p>
              </div>
              <div style="padding:16px 30px;text-align:center;background:#f9f9f9;border-top:1px solid #eee;">
                <p style="margin:0;font-size:11px;color:#999;">${companyName} ${company?.address ? `| ${company.address}` : ''}</p>
              </div>
            </div>`;

          const mailOptions: any = {
            from: `"${companyName}" <${smtpUser}>`,
            to: customerEmail,
            subject: `Payment Receipt - ${invoice.invoice_number} - ${companyName}`,
            html: emailHtml,
          };
          if (pdfBuffer) {
            const pdfName = `Receipt-${invoice.invoice_number?.replace(/\s+/g, '_')}.pdf`;
            mailOptions.attachments = [{ filename: pdfName, content: pdfBuffer, contentType: 'application/pdf' }];
          }
          await transporter.sendMail(mailOptions);
          emailSent = true;
        }
      } catch (err: any) {
        emailError = err.message;
        console.error('Receipt email failed:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      paidAmount,
      remaining,
      emailSent,
      emailError,
    });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[error] ' + msg);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
