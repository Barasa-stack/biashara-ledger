import { NextResponse } from 'next/server';
import { adminGet, withTenantContext } from '@/lib/db';
import { buildHtml } from '@/lib/print';
import { createTransporter, getSmtpConfig } from '@/lib/email';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');

    const { to, subject, message, item, type } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    const transporter = await createTransporter(session.tenant_id!);
    if (!transporter) {
      return NextResponse.json({ error: 'Email not sent. Configure your SMTP in Tenant Company Settings first.' }, { status: 400 });
    }

    const company = await withTenantContext(session.tenant_id!, async () => {
      return await adminGet('SELECT * FROM company_settings LIMIT 1') as any;
    });

    const docNumber = item?.invoice_number || item?.quotation_number || item?.credit_note_number || `#${item?.id || ''}`;
    const amount = Number(item?.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const companyName = company?.company_name || 'BiasharaLedger';
    const isType = type === 'Invoice' ? 'Invoice' : type === 'Quotation' ? 'Quotation' : 'Credit_Note';
    const pdfName = `${isType}-${docNumber.replace(/\s+/g, '_')}.pdf`;

    let pdfBuffer: Uint8Array | null = null;
    let pdfError: string | null = null;
    try {
      const fullHtml = buildHtml(isType, item, company);
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
      await page.setContent(fullHtml, { waitUntil: 'load' });
      pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '0mm', bottom: '8mm' }, printBackground: true });
      await browser.close();
    } catch (err: any) {
      pdfError = err.message;
      console.error('PDF generation failed:', pdfError);
    }

    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f4f4f4;">
        <div style="background: #df1c1c; padding: 24px 30px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 0.5px;">${companyName}</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p style="font-size: 15px; color: #333;">Dear ${item?.customer_name || 'Valued Customer'},</p>
          <p style="font-size: 14px; color: #444; line-height: 1.6;">${message || `Please find the ${type.toLowerCase()} attached.`}</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888; width: 40%;">Document</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-weight: 600; color: #df1c1c;">${type} ${docNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888;">Amount</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-weight: 600;">$${amount}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888;">Status</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-transform: capitalize;">${(item?.status || '').replace('_', ' ')}</td>
            </tr>
            ${item?.issue_date ? `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888;">Date</td><td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${item.issue_date}</td></tr>` : ''}
            ${item?.due_date ? `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888;">Due Date</td><td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${item.due_date}</td></tr>` : ''}
            ${item?.valid_until ? `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888;">Valid Until</td><td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${item.valid_until}</td></tr>` : ''}
          </table>
          ${item?.description ? `<p style="font-size: 13px; color: #555;"><strong>Details:</strong> ${item.description}</p>` : ''}
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="font-size: 13px; color: #666;">This ${type.toLowerCase()} is attached as a PDF. Please review and let us know if you have any questions.</p>
        </div>
        <div style="padding: 16px 30px; text-align: center; background: #f9f9f9; border-top: 1px solid #eee;">
          <p style="margin: 0; font-size: 11px; color: #999;">
            ${companyName}
            ${company?.address ? `&bull; ${company.address}` : ''}
            ${company?.email ? `&bull; ${company.email}` : ''}
            ${company?.phone ? `&bull; ${company.phone}` : ''}
          </p>
        </div>
      </div>`;

    const smtpConfig = await getSmtpConfig(session.tenant_id!);
    const smtpUser = smtpConfig?.fromAddr || company?.smtp_user || '';
    const mailOptions: any = {
      from: `"${companyName}" <${smtpUser}>`,
      to,
      subject,
      html,
    };

    if (pdfBuffer) {
      mailOptions.attachments = [{ filename: pdfName, content: pdfBuffer, contentType: 'application/pdf' }];
    }

    try {
      await transporter.sendMail(mailOptions);
      return NextResponse.json({ success: true, pdfAttached: !!pdfBuffer, pdfError });
    } catch (err: any) {
      return NextResponse.json({ error: 'Email sending failed' }, { status: 500 });
    }
  } catch (e: any) {
    if (e?.message === 'Unauthorized' || !e?.message) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    // error already logged above
    const __eMsg = e instanceof Error ? e.message : String(e);
    console.error('[api]', __eMsg);
    return NextResponse.json({ error: __eMsg }, { status: 500 });
  }
}
