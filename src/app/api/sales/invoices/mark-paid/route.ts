import { NextResponse } from 'next/server';
import { get, run, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';
import { buildReceiptHtml } from '@/lib/print';
import { createTransporter, getSmtpConfig } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');

    const body = await request.json();
    const invoice_id = body.invoice_id || body.id;
    const payment_method = body.payment_method || 'cash';
    const payment_type = body.payment_type || 'full';
    if (!invoice_id) return NextResponse.json({ error: 'Missing invoice_id' }, { status: 400 });

    const ctx = await withTenantContext(session.tenant_id!, async () => {
      const invoice = await get(
        'SELECT * FROM sales_invoices WHERE id=$1',
        [invoice_id]
      ) as any;
      if (!invoice) return { error: 'Invoice not found' };
      if (invoice.status === 'paid') return { error: 'Invoice already paid' };

      const customer = await get('SELECT * FROM customers WHERE id=$1', [invoice.customer_id]) as any;
      const company = await get('SELECT * FROM company_settings') as any;

      const today = new Date().toISOString().split('T')[0];
      const paidAmount = payment_type === 'partial' ? Math.min(Number(body.partial_amount) || 0, invoice.amount) : invoice.amount;
      const newStatus = paidAmount >= invoice.amount ? 'paid' : 'partially_paid';
      const remaining = Number(invoice.amount) - paidAmount;

      await run(
        `INSERT INTO payments (tenant_id, invoice_id, customer_id, customer_name, amount, payment_date, payment_method, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [session.tenant_id, invoice.id, invoice.customer_id, invoice.customer_name, paidAmount, today, payment_method,
         payment_type === 'partial' ? `Partial payment of $${paidAmount.toLocaleString('en-US')}. Remaining: $${remaining.toLocaleString('en-US')}` : 'Auto-recorded from Mark as Paid']
      );

      await run('UPDATE sales_invoices SET status=$1 WHERE id=$2', [newStatus, invoice.id]);

      return { invoice, customer, company, today, paidAmount, remaining, newStatus };
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

        const transporter = await createTransporter();
        if (transporter) {
          let pdfBuffer: Uint8Array | null = null;
          try {
            let puppeteer: any;
            try {
              puppeteer = await import('puppeteer').then(m => m.default);
            } catch {
              return NextResponse.json({ error: 'PDF generation is not available' }, { status: 500 });
            }
            const browser = await puppeteer.launch({
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            });
            const page = await browser.newPage();
            await page.setContent(receiptHtml, { waitUntil: 'load' });
            pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '0mm', bottom: '8mm' }, printBackground: true });
            await browser.close();
          } catch (err: any) {
            console.error('Receipt PDF generation failed:', err.message);
          }

          const companyName = company?.company_name || 'BiasharaLedger';
          const smtpConfig = await getSmtpConfig();
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
                    ? `We have received your partial payment of <strong>$${paidAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong> for invoice <strong>${invoice.invoice_number}</strong>. Your remaining balance is <strong>$${remaining.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>.`
                    : `We have received your full payment of <strong>$${paidAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong> for invoice <strong>${invoice.invoice_number}</strong>. Your invoice has been settled in full.`}
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
