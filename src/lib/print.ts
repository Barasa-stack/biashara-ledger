function fmtDate(d: string) {
  if (!d) return '';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function cssVar(s: any, key: string, fallback: string): string {
  const v = s?.[key];
  if (!v || v === '#000000' || v === '') return fallback;
  return v;
}

function statusColor(status: string, theme: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'active') return '#059669';
  if (s === 'sent' || s === 'pending') return '#2563eb';
  if (s === 'overdue' || s === 'declined') return '#dc2626';
  if (s === 'draft') return '#6b7280';
  if (s === 'partially_paid') return '#d97706';
  return theme;
}

export function buildHtml(type: string, item: any, s?: any): string {
  s = s || {};
  const logo = s.invoice_logo_base64 || s.logo_base64 || '';
  const companyName = s.company_name || 'Your Company Name';
  const address = s.address || '';
  const location = s.location || '';
  const country = s.country || 'Kenya';
  const phone = s.phone || '';
  const email = s.email || '';
  const kraPin = s.kra_pin || '';
  const paybill = s.paybill_number || '';
  const bankName = s.bank_name || '';
  const accountNumber = s.account_number || '';
  const bankBranch = s.bank_branch || '';
  const branchCode = s.branch_code || '';
  const bankCode = s.bank_code || '';
  const swiftCode = s.swift_code || '';
  const termsConds = s.terms_conditions || '';
  const invoiceFooterText = s.invoice_footer_text || '';
  const paymentInstructions = s.payment_instructions || '';
  const themeColor = cssVar(s, 'theme_color', '#df1c1c');
  const vatRate = item.vat_rate ?? s.vat_rate ?? 16;

  const docNumber = item.invoice_number || item.quotation_number || item.credit_note_number || `#${item.id}`;
  const isInvoice = type === 'Invoice';
  const quoteRef = item.quotation_number || (item.quotation_id ? `#${item.quotation_id}` : '');
  const customerName = item.customer_name || '';
  const customerAddress = item.billing_address || item.address || '';

  const subtotal = item.subtotal ?? item.amount ?? 0;
  const taxVat = item.tax_vat ?? 0;
  const discounts = item.discounts ?? 0;
  const total = item.amount ?? 0;
  const paidAmount = item.paid_amount ?? 0;
  const isPartiallyPaid = (item.status || '').toLowerCase() === 'partially_paid';
  const customerCountry = item.customer_country || '';
  const docStatus = item.status || '';

  const initials = companyName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('');

  const fmt = (v: number) => `KSh ${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  let lineItems: any[];
  try {
    lineItems = typeof item.items === 'string' ? JSON.parse(item.items) : (Array.isArray(item.items) ? item.items : []);
  } catch { lineItems = []; }

  const renderItems = (rows: string) => `
    <table class="items">
      <thead>
        <tr>
          <th class="col-desc">Item</th>
          <th class="col-qty">Qty</th>
          <th class="col-price">Unit Price</th>
          <th class="col-total">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;

  let itemsHtml: string;
  if (!lineItems.length) {
    lineItems = [item];
    itemsHtml = renderItems(`
      <tr>
        <td><div class="desc">${item.description || 'N/A'}</div></td>
        <td class="c">${fmt(item.quantity || 1)}</td>
        <td class="r">${fmt(item.unit_price || 0)}</td>
        <td class="r amt">${fmt(subtotal)}</td>
      </tr>`);
  } else {
    const rows = lineItems.map((row: any, idx: number) => {
      const qty = Number(row.quantity) || 1;
      const unitPrice = Number(row.unit_price) || 0;
      const lineTotal = qty * unitPrice;
      return `<tr>
        <td><div class="desc">${row.description || 'N/A'}</div></td>
        <td class="c">${fmt(qty)}</td>
        <td class="r">${fmt(unitPrice)}</td>
        <td class="r amt">${fmt(lineTotal)}</td>
      </tr>`;
    }).join('');
    itemsHtml = renderItems(rows);
  }

  const primary = themeColor;

  const accountName = s.account_name || companyName;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${type} ${docNumber}</title>
<style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  body { font-family: 'Inter', -apple-system, 'Helvetica Neue', sans-serif; color: #1e293b; font-size: 10px; line-height: 1.5; -webkit-font-smoothing: antialiased; background: #f5f5f5; }

  .no-print { text-align: center; padding: 14px 0; background: #fff; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #e2e8f0; }
  .no-print button { background: ${primary}; color: #fff; border: none; padding: 10px 28px; cursor: pointer; font-size: 14px; font-weight: 600; margin: 0 5px; border-radius: 6px; }
  .no-print button:hover { opacity: 0.9; }
  .no-print button:last-child { background: #fff; color: ${primary}; border: 1px solid ${primary}; }
  .no-print button:last-child:hover { background: #fef2f2; }

  .page { max-width: 210mm; margin: 28px auto; background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,0.06); overflow: hidden; }

  /* ACCENT TOP */
  .accent-bar { height: 5px; background: ${primary}; }

  /* HEADER */
  .header { padding: 30px 48px 20px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header .brand img { max-height: 50px; max-width: 180px; object-fit: contain; }
  .header .brand .logo-fallback { font-size: 26px; font-weight: 900; color: ${primary}; letter-spacing: 0.5px; }
  .header .doc-info { text-align: right; }
  .header .doc-info .type { font-size: 14px; font-weight: 800; color: ${primary}; letter-spacing: 1.5px; line-height: 1; }
  .header .doc-info .num { font-size: 12px; color: #475569; font-weight: 600; margin-top: 4px; }

  /* DIVIDER */
  .divider { height: 1px; background: #e5e7eb; margin: 0 48px; }

  /* META ROW — invoice details left, bill to right */
  /* COMPANY ADDRESS below letterhead */
  .company-address { padding: 12px 48px 0; text-align: left; }
  .company-address .ca-name { font-size: 13.5px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
  .company-address .ca-line { font-size: 10px; color: #64748b; line-height: 1.6; }
  .company-address .ca-sep { margin: 0 6px; opacity: 0.4; }

  .meta-row { padding: 20px 48px 0; display: flex; justify-content: space-between; }
  .meta-row .col { width: 48%; }
  .meta-row .col-label { font-size: 13.5px; font-weight: 700; color: ${primary}; text-transform: uppercase; letter-spacing: 1.8px; margin-bottom: 8px; }
  .meta-row .detail { font-size: 10px; color: #475569; line-height: 1.8; }
  .meta-row .detail strong { color: #1e293b; font-weight: 600; }
  .meta-row .customer-name { font-size: 13.5px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
  .meta-row .addr { font-size: 10px; color: #64748b; line-height: 1.6; }

  /* TABLE */
  .table-wrap { padding: 20px 48px 8px; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items thead th { padding: 10px 12px; font-size: 8px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 1.2px; text-align: left; background: ${primary}; }
  table.items thead th.col-desc { width: 48%; }
  table.items thead th.col-qty { width: 12%; text-align: center; }
  table.items thead th.col-price { width: 20%; text-align: right; }
  table.items thead th.col-total { width: 20%; text-align: right; }
  table.items td { padding: 10px 12px; border-bottom: 1px solid #f1f4f8; font-size: 10px; color: #334155; vertical-align: top; }
  table.items td .desc { color: #64748b; font-size: 9.5px; }
  table.items td.r { text-align: right; }
  table.items td.c { text-align: center; }
  table.items td.amt { font-weight: 400; color: #0f172a; }

  /* TOTALS */
  .totals-section { padding: 12px 48px 24px; display: flex; justify-content: flex-end; }
  .totals { width: 280px; }
  .tl { display: flex; justify-content: space-between; padding: 5px 0; font-size: 10.5px; }
  .tl span:first-child { color: #64748b; }
  .tl span:last-child { color: #334155; }
  .tl.total { border-top: 3px double ${primary}; border-bottom: 3px double ${primary}; margin-top: 8px; padding: 10px 0; }
  .tl.total span:first-child { font-weight: 800; color: ${primary}; font-size: 12px; }
  .tl.total span:last-child { font-size: 18px; font-weight: 900; color: #1e2938; }
  .tl-discount span:last-child { color: #dc2626; }
  .tl-paid span:first-child { color: #059669; }
  .tl-paid span:last-child { color: #059669; }
  .tl-balance span:first-child { color: #b45309; }
  .tl-balance span:last-child { color: #b45309; }

  /* STATUS STAMP */
  .status-stamp { text-align: center; padding: 0 48px 20px; }
  .status-stamp .stamp { display: inline-block; padding: 5px 20px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.5px; border-radius: 4px; }
  .status-stamp .stamp.overdue { color: #dc2626; border: 1.5px solid #dc2626; background: #fef2f2; }
  .status-stamp .stamp.paid { color: #059669; border: 1.5px solid #059669; background: #f0fdf4; }
  .status-stamp .stamp.partial { color: #b45309; border: 1.5px solid #b45309; background: #fffbeb; }
  .status-stamp .stamp.draft { color: #6b7280; border: 1.5px solid #6b7280; background: #f9fafb; }

  /* PAYMENT SECTION */
  .payment-wrap { padding: 0 48px 20px; }
  .payment-card { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
  .payment-card .head { background: ${primary}; padding: 10px 16px; font-size: 8px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 1.5px; }
  .payment-card .body { padding: 14px 16px; }
  .payment-card .body .pf { display: flex; padding: 4px 0; font-size: 10px; }
  .payment-card .body .pl { color: #64748b; width: 120px; flex-shrink: 0; }
  .payment-card .body .pv { color: #1e293b; font-weight: 600; }
  .payment-card .body .pf-full { padding-top: 8px; border-top: 1px dashed #e5e7eb; margin-top: 8px; }
  .payment-card .body .pf-full .pv { color: #475569; font-size: 10px; line-height: 1.6; display: block; }

  /* TERMS */
  .terms-wrap { padding: 0 48px 16px; }
  .terms { padding: 14px 0; border-top: 1px solid #e5e7eb; }
  .terms .head { font-size: 7.5px; font-weight: 700; color: ${primary}; text-transform: uppercase; letter-spacing: 1.8px; margin-bottom: 6px; }
  .terms .text { font-size: 9.5px; color: #64748b; line-height: 1.6; }

  /* THANKS */
  .thanks-wrap { padding: 0 48px; }
  .thanks { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; }
  .thanks .text { font-size: 12px; color: ${primary}; font-weight: 700; letter-spacing: 0.5px; }

  /* WAVE FOOTER — curved banner */
  .wave-footer { margin: 0 48px; background: ${primary}; position: relative; border-radius: 8px; overflow: hidden; }
  .wave-footer::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 40%, transparent 100%); pointer-events: none; border-radius: 8px; }
  .wave-footer svg { display: block; width: 100%; height: 20px; }
  .wave-content { padding: 4px 20px 20px; text-align: center; color: #fff; }
  .wave-content .fname { font-weight: 700; font-size: 13px; color: #fff; }
  .wave-content .contact { font-size: 9.5px; color: rgba(255,255,255,0.8); margin-top: 4px; line-height: 1.6; }
  .wave-content .contact .sep { margin: 0 6px; opacity: 0.4; }

  @media print {
    .no-print { display: none; }
    body { background: #fff; }
    .page { margin: 0; box-shadow: none; border-radius: 0; }
    * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="no-print">
  <button onclick="window.print()">Save as PDF</button>
  <button onclick="window.close()">Close</button>
</div>

<div class="page">
  <div class="accent-bar"></div>

  <div class="header">
    <div class="brand">
      ${logo ? `<img src="${logo}" alt="Logo">` : `<div class="logo-fallback">${initials}</div>`}
    </div>
    <div class="doc-info">
      <div class="type">${type.toUpperCase()}</div>
      <div class="num">${docNumber}</div>
    </div>
  </div>

  <div class="company-address">
    <div class="ca-name">${companyName}</div>
    ${address ? `<div class="ca-line">${address}</div>` : ''}
    ${(location || country) ? `<div class="ca-line">${[location, country].filter(Boolean).join(', ')}</div>` : ''}
    ${email ? `<div class="ca-line">${email}</div>` : ''}
    ${phone ? `<div class="ca-line">${phone}</div>` : ''}
  </div>

  <div class="divider"></div>

  <div class="meta-row">
    <div class="col">
      <div class="col-label">Invoice Details</div>
      <div class="detail">
        <div><strong>Invoice Number:</strong> ${docNumber}</div>
        ${item.issue_date ? `<div><strong>Invoice Date:</strong> ${fmtDate(item.issue_date)}</div>` : ''}
        ${item.due_date ? `<div><strong>Due Date:</strong> ${fmtDate(item.due_date)}</div>` : ''}
        ${item.payment_terms ? `<div><strong>Terms:</strong> ${item.payment_terms}</div>` : ''}
        ${kraPin ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #e5e7eb"><strong>KRA PIN:</strong> ${kraPin}</div>` : ''}
      </div>
    </div>
    <div class="col" style="text-align:right">
      <div class="col-label">Bill To</div>
      <div class="customer-name">${customerName || 'N/A'}</div>
      ${customerAddress ? `<div class="addr">${customerAddress}</div>` : ''}
      ${item.email_address ? `<div class="addr">${item.email_address}</div>` : ''}
      ${item.phone_number ? `<div class="addr">${item.phone_number}</div>` : ''}
      ${customerCountry ? `<div class="addr" style="color:${primary};font-weight:600;margin-top:4px">${customerCountry}</div>` : ''}
    </div>
  </div>

  ${lineItems.length || item.description ? `
  <div class="table-wrap">
    ${itemsHtml}
  </div>
  ` : ''}

  <div class="totals-section">
    <div class="totals">
      <div class="tl"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
      ${discounts > 0 ? `<div class="tl tl-discount"><span>Discount</span><span>-${fmt(discounts)}</span></div>` : ''}
      <div class="tl"><span>VAT (${vatRate}%)</span><span>${fmt(taxVat)}</span></div>
      ${isPartiallyPaid && paidAmount > 0 ? `
      <div class="tl tl-paid"><span>Amount Paid</span><span>${fmt(paidAmount)}</span></div>
      <div class="tl tl-balance"><span>Balance Due</span><span>${fmt(total - paidAmount)}</span></div>
      ` : ''}
      <div class="tl total">
        <span>${isPartiallyPaid ? 'Original Total' : 'Total'}</span>
        <span>${fmt(total)}</span>
      </div>
    </div>
  </div>

  ${(() => {
    const s = (item.status || '').toLowerCase();
    if (s === 'overdue' || s === 'declined') return `<div class="status-stamp"><div class="stamp overdue">${s === 'declined' ? 'Declined' : 'Overdue'}</div></div>`;
    if (s === 'paid') return `<div class="status-stamp"><div class="stamp paid">Paid in Full</div></div>`;
    if (isPartiallyPaid) return `<div class="status-stamp"><div class="stamp partial">Partially Paid</div></div>`;
    if (s === 'draft') return `<div class="status-stamp"><div class="stamp draft">Draft</div></div>`;
    return '';
  })()}

  <div class="payment-wrap">
    <div class="payment-card">
      <div class="head">Payment Information</div>
      <div class="body">
        ${bankName ? `<div class="pf"><span class="pl">Bank Transfer:</span><span class="pv">${bankName}${accountNumber ? ` - ${accountNumber}` : ''}</span></div>` : ''}
        ${accountName ? `<div class="pf"><span class="pl">Account Name:</span><span class="pv">${accountName}</span></div>` : ''}
        ${bankBranch ? `<div class="pf"><span class="pl">Branch:</span><span class="pv">${bankBranch}${branchCode ? ` (${branchCode})` : ''}</span></div>` : ''}
        ${swiftCode ? `<div class="pf"><span class="pl">SWIFT Code:</span><span class="pv">${swiftCode}</span></div>` : ''}
        ${paybill ? `<div class="pf"><span class="pl">M-PESA Paybill:</span><span class="pv">${paybill}</span></div>` : ''}
        ${paymentInstructions ? `<div class="pf-full"><span class="pv">${paymentInstructions}</span></div>` : ''}
      </div>
    </div>
  </div>

  ${termsConds ? `
  <div class="terms-wrap">
    <div class="terms">
      <div class="head">Terms &amp; Conditions</div>
      <div class="text">${termsConds}</div>
    </div>
  </div>` : ''}

  <div class="thanks-wrap">
    <div class="thanks">
      <div class="text">Thank You for Your Payment!</div>
    </div>
  </div>

  <div class="wave-footer">
    <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
      <path d="M0,75 Q 720,25 1440,75 L 1440,100 L 0,100 Z" fill="${primary}" style="fill:${primary};print-color-adjust:exact;-webkit-print-color-adjust:exact;" />
    </svg>
    <div class="wave-content">
      <div class="contact">
        ${address ? `<span>${address}</span>` : ''}
        ${phone ? `<span class="sep">|</span><span>${phone}</span>` : ''}
        ${email ? `<span class="sep">|</span><span>${email}</span>` : ''}
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

export function buildReceiptHtml(
  invoice: any,
  payment: { amount: number; payment_method: string; payment_date: string; payment_type: string; remaining: number },
  company: any,
): string {
  const s = { vat_rate: 0, ...company };
  const companyName = s.company_name || 'Your Company Name';
  const address = s.address || '';
  const location = s.location || '';
  const country = s.country || 'Kenya';
  const phone = s.phone || '';
  const email = s.email || '';
  const logo = s.logo_base64 || '';
  const themeColor = cssVar(s, 'theme_color', '#df1c1c');
  const initials = companyName.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('');
  const isPartial = payment.payment_type === 'partial';
  const today = payment.payment_date || new Date().toISOString().split('T')[0];
  const receiptNumber = `RCP-${String(invoice.id).padStart(4, '0')}-${today.replace(/-/g, '')}`;
  const fmt = (v: number) => `KSh ${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Payment Receipt ${receiptNumber}</title>
<style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, 'Helvetica Neue', sans-serif; color: #1e293b; font-size: 11px; line-height: 1.5; background: #f1f4f8; -webkit-font-smoothing: antialiased; }
  .page { max-width: 210mm; margin: 24px auto; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
  .header-bar { background: ${themeColor}; padding: 20px 48px; display: flex; justify-content: space-between; align-items: center; }
  .header-bar h1 { font-size: 16px; font-weight: 700; color: #fff; letter-spacing: 1px; }
  .header-bar .rcp { font-size: 11px; color: rgba(255,255,255,0.75); }
  .header-bar .status { padding: 5px 14px; border-radius: 6px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; ${isPartial ? 'background: #fef3c7; color: #b45309;' : 'background: #d1fae5; color: #065f46;'} }
  .section { padding: 24px 48px 8px; }
  .section-title { font-size: 9px; font-weight: 700; color: ${themeColor}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; }
  .info-grid { display: flex; gap: 32px; }
  .info-grid .col { flex: 1; }
  .info-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #eef2f6; font-size: 11px; }
  .info-row .label { color: #64748b; }
  .info-row .value { font-weight: 600; color: #0f172a; }
  .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-top: 12px; }
  .amount-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11.5px; }
  .amount-row .label { color: #64748b; }
  .amount-row .value { font-weight: 400; }
  .amount-row.total { border-top: 1.5px solid ${themeColor}; margin-top: 8px; padding-top: 10px; font-size: 14px; }
  .amount-row.total .label { font-weight: 700; color: #0f172a; }
  .amount-row.total .value { font-size: 16px; color: #1e2938; font-weight: 800; }
  .amount-row.remaining { color: #b45309; }
  .divider { border: none; border-top: 1px solid #eef2f6; margin: 10px 48px; }
  .thanks { padding: 20px 48px; text-align: center; border-top: 1px solid #eef2f6; margin-top: 8px; }
  .thanks .check { font-size: 22px; margin-bottom: 4px; }
  .thanks h2 { font-size: 15px; color: ${themeColor}; font-weight: 700; }
  .thanks p { font-size: 10.5px; color: #64748b; margin-top: 4px; line-height: 1.6; }
  .footer { padding: 12px 48px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eef2f6; }
  .footer span { color: #94a3b8; font-size: 9.5px; }
  .footer .fname { color: ${themeColor}; font-weight: 700; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px; }
  @media print { body { background: #fff; } .page { margin: 0; box-shadow: none; border-radius: 0; } }
</style>
</head>
<body>
<div class="page">
  <div class="header-bar">
    <div>
      <h1>Payment Receipt</h1>
      <p class="rcp">${receiptNumber}</p>
    </div>
    <div class="status">${isPartial ? 'Partially Paid' : 'Paid in Full'}</div>
  </div>

  <hr class="divider">

  <div class="section">
    <div class="info-grid">
      <div class="col">
        <div class="section-title">Company</div>
        ${logo ? `<img src="${logo}" style="max-height:32px;margin-bottom:6px;">` : `<div style="font-size:16px;font-weight:800;color:${themeColor};margin-bottom:2px;">${initials}</div>`}
        <div style="font-size:12px;font-weight:700;margin-top:2px">${companyName}</div>
        ${address ? `<div style="font-size:10.5px;color:#64748b;line-height:1.5;margin-top:2px">${address}</div>` : ''}
        ${location ? `<div style="font-size:10.5px;color:#64748b;">${location}${country ? `, ${country}` : ''}</div>` : ''}
        ${phone ? `<div style="font-size:10.5px;color:#64748b;">${phone}</div>` : ''}
        ${email ? `<div style="font-size:10.5px;color:#64748b;">${email}</div>` : ''}
      </div>
      <div class="col">
        <div class="section-title">Customer</div>
        <div style="font-size:12px;font-weight:700;">${invoice.customer_name || 'N/A'}</div>
        <div style="font-size:10.5px;color:#64748b;margin-top:2px">Invoice: ${invoice.invoice_number || `#${invoice.id}`}</div>
      </div>
    </div>
  </div>

  <hr class="divider">

  <div class="section">
    <div class="section-title">Payment Details</div>
    <div class="info-row"><span class="label">Payment Date</span><span class="value">${today}</span></div>
    <div class="info-row"><span class="label">Payment Method</span><span class="value" style="text-transform:capitalize">${payment.payment_method}</span></div>
    <div class="info-row"><span class="label">Invoice Amount</span><span class="value">${fmt(invoice.amount)}</span></div>

    <div class="amount-box">
      <div class="amount-row"><span class="label">Amount Paid</span><span class="value">${fmt(payment.amount)}</span></div>
      ${isPartial ? `<div class="amount-row remaining"><span class="label">Balance Remaining</span><span class="value">${fmt(payment.remaining)}</span></div>` : ''}
      <div class="amount-row total"><span class="label">${isPartial ? 'Total Paid To Date' : 'Total Paid'}</span><span class="value">${fmt(payment.amount)}</span></div>
    </div>
  </div>

  <div class="thanks">
    <div class="check">&#10003;</div>
    <h2>Thank you for your payment!</h2>
    <p>${isPartial
      ? `We have received your partial payment of ${fmt(payment.amount)}. Your remaining balance of ${fmt(payment.remaining)} is due. We appreciate your business.`
      : 'We have received your payment in full. Thank you for your prompt settlement. We truly appreciate your trust.'}
    </p>
  </div>

  <div class="footer">
    <div><span class="fname">${companyName}</span></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${address ? `<span>${address}</span>` : ''}
      ${phone ? `<span>${phone}</span>` : ''}
      ${email ? `<span>${email}</span>` : ''}
    </div>
    <span>BiasharaLedger Receipt</span>
  </div>
</div>
</body>
</html>`;
}
