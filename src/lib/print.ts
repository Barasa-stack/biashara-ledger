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
  const baseCurrency = s.base_currency || 'KES';
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

  const fmt = (v: number) => `${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  let lineItems: any[];
  try {
    lineItems = typeof item.items === 'string' ? JSON.parse(item.items) : (Array.isArray(item.items) ? item.items : []);
  } catch { lineItems = []; }

  const renderItems = (rows: string) => `
    <table class="items">
      <thead>
        <tr>
          <th class="col-num">#</th>
          <th class="col-desc">Description</th>
          <th class="col-qty">Qty</th>
          <th class="col-price">Unit Price</th>
          <th class="col-total">Amount</th>
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
        <td class="c">1</td>
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
        <td class="c">${idx + 1}</td>
        <td><div class="desc">${row.description || 'N/A'}</div></td>
        <td class="c">${fmt(qty)}</td>
        <td class="r">${fmt(unitPrice)}</td>
        <td class="r amt">${fmt(lineTotal)}</td>
      </tr>`;
    }).join('');
    itemsHtml = renderItems(rows);
  }

  const paymentFields: string[] = [];
  if (paybill) paymentFields.push(`<div class="pf"><span class="pl">M-Pesa Paybill :</span><span class="pv">${paybill}</span></div>`);
  if (bankName) paymentFields.push(`<div class="pf"><span class="pl">Bank :</span><span class="pv">${bankName}</span></div>`);
  if (accountNumber) paymentFields.push(`<div class="pf"><span class="pl">Account :</span><span class="pv">${accountNumber}</span></div>`);
  if (bankBranch) paymentFields.push(`<div class="pf"><span class="pl">Branch :</span><span class="pv">${bankBranch}</span></div>`);
  if (branchCode) paymentFields.push(`<div class="pf"><span class="pl">Branch Code :</span><span class="pv">${branchCode}</span></div>`);
  if (bankCode) paymentFields.push(`<div class="pf"><span class="pl">Bank Code :</span><span class="pv">${bankCode}</span></div>`);
  if (swiftCode) paymentFields.push(`<div class="pf"><span class="pl">SWIFT :</span><span class="pv">${swiftCode}</span></div>`);

  const hasPayment = paymentFields.length > 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${type} ${docNumber}</title>
<style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, 'Helvetica Neue', sans-serif; color: #1e293b; font-size: 11px; line-height: 1.5; -webkit-font-smoothing: antialiased; background: #e8ecf2; }

  .no-print { text-align: center; padding: 14px 0; background: #fff; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #e2e8f0; }
  .no-print button { background: ${themeColor}; color: #fff; border: none; padding: 10px 28px; cursor: pointer; font-size: 14px; font-weight: 600; margin: 0 5px; border-radius: 6px; transition: opacity 0.15s; }
  .no-print button:hover { opacity: 0.9; }
  .no-print button:last-child { background: #fff; color: ${themeColor}; border: 1px solid ${themeColor}; }
  .no-print button:last-child:hover { background: #f8fafc; }

  .page { max-width: 210mm; margin: 28px auto; background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.07); overflow: hidden; }

  /* HEADER BAR — with diagonal pattern overlay */
  .header-bar { background: linear-gradient(135deg, ${themeColor}, ${themeColor}dd); padding: 24px 48px; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden; }
  .header-bar::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.04) 8px, rgba(255,255,255,0.04) 16px); pointer-events: none; }
  .header-bar::after { content: ''; position: absolute; bottom: -2px; left: 48px; right: 48px; height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px; }
  .header-bar .brand { display: flex; align-items: center; gap: 14px; position: relative; z-index: 1; }
  .header-bar .brand img { max-height: 38px; max-width: 140px; object-fit: contain; filter: brightness(0) invert(1); }
  .header-bar .brand .logo-fallback { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: 1.5px; }
  .header-bar .doc-badge { position: relative; z-index: 1; background: rgba(255,255,255,0.12); padding: 8px 22px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); }
  .header-bar .doc-badge .type { font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 2.5px; text-transform: uppercase; }
  .header-bar .doc-badge .num { font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 3px; text-align: right; letter-spacing: 0.5px; }

  /* INFO ROW */
  .info-row { padding: 28px 48px 18px; display: flex; justify-content: space-between; position: relative; }
  .info-row::after { content: ''; position: absolute; bottom: 0; left: 48px; right: 48px; height: 2px; border-bottom: 1px solid #e8ecf2; }
  .info-row .col { width: 48%; }
  .info-row .col-label { font-size: 8px; font-weight: 700; color: ${themeColor}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; position: relative; display: inline-block; }
  .info-row .col-label::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 24px; height: 2px; background: ${themeColor}; border-radius: 1px; }
  .info-row .company-name { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
  .info-row .addr { font-size: 10.5px; color: #64748b; line-height: 1.7; }
  .info-row .addr .lbl { color: #475569; font-weight: 600; }
  .info-row .kra { font-size: 10px; color: ${themeColor}; font-weight: 600; margin-top: 5px; letter-spacing: 0.3px; background: ${themeColor}0d; padding: 2px 8px; border-radius: 3px; display: inline-block; }
  .info-row .meta-grid { display: grid; grid-template-columns: 80px 1fr; gap: 5px 0; font-size: 10.5px; }
  .info-row .meta-grid .ml { color: #64748b; text-align: left; }
  .info-row .meta-grid .mv { color: #0f172a; font-weight: 600; text-align: left; }

  /* TABLE */
  .table-wrap { padding: 20px 48px 10px; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items thead th { padding: 10px 10px; font-size: 8.5px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 1.5px; text-align: left; background: ${themeColor}; }
  table.items thead th:first-child { border-radius: 6px 0 0 0; }
  table.items thead th:last-child { border-radius: 0 6px 0 0; }
  table.items thead th.col-num { width: 4%; text-align: center; }
  table.items thead th.col-desc { width: 48%; }
  table.items thead th.col-qty { width: 10%; text-align: center; }
  table.items thead th.col-price { width: 17%; text-align: right; }
  table.items thead th.col-total { width: 21%; text-align: right; }
  table.items td { padding: 12px 10px; border-bottom: 1px solid #eef2f6; font-size: 11px; color: #334155; vertical-align: top; }
  table.items td .desc { max-width: 280px; word-wrap: break-word; color: #64748b; font-size: 10.5px; }
  table.items td.r { text-align: right; }
  table.items td.c { text-align: center; }
  table.items td.amt { font-weight: 600; color: #0f172a; }
  table.items tbody tr:last-child td { border-bottom: none; }
  table.items tbody tr:hover { background: #f8fafc; }

  /* TOTALS — with double-line style */
  .totals-section { padding: 10px 48px 28px; display: flex; justify-content: flex-end; }
  .totals { width: 300px; }
  .tl { display: flex; justify-content: space-between; align-items: baseline; padding: 6px 12px; font-size: 11.5px; }
  .tl span:first-child { color: #64748b; }
  .tl span:last-child { color: #334155; font-weight: 600; }
  .tl-vat { border-bottom: 1px solid #eef2f6; padding-bottom: 8px; margin-bottom: 4px; }
  .tl-discount span:last-child { color: #dc2626; }
  .tl-subtotal { background: #f8fafc; border-radius: 6px 6px 0 0; }
  .total-box { margin-top: 8px; background: #f8fafc; border: 2px solid ${themeColor}; border-radius: 8px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; position: relative; }
  .total-box::before { content: ''; position: absolute; top: -1px; left: 10px; right: 10px; height: 2px; background: ${themeColor}; border-radius: 1px; }
  .total-box .label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; }
  .total-box .amount { font-size: 22px; font-weight: 800; color: ${themeColor}; letter-spacing: 0.5px; }

  /* PAYMENT */
  .payment-wrap { padding: 0 48px 16px; }
  .payment-card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .payment-card .head { background: linear-gradient(135deg, ${themeColor}0d, ${themeColor}04); padding: 10px 16px; font-size: 9px; font-weight: 700; color: ${themeColor}; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #e2e8f0; }
  .payment-card .body { padding: 12px 16px; display: grid; grid-template-columns: 140px 1fr; gap: 4px 0; }
  .payment-card .body .pl { font-size: 10.5px; color: ${themeColor}; font-weight: 600; text-align: right; padding-right: 6px; white-space: nowrap; }
  .payment-card .body .pv { font-size: 11px; color: #1e293b; text-align: left; }
  .payment-card .body .pv { font-size: 11px; color: #1e293b; }
  .payment-card .body .pf-full { grid-column: span 2; padding-top: 6px; border-top: 1px dashed #e2e8f0; margin-top: 6px; }
  .payment-card .body .pf-full .pv { color: #475569; font-size: 11px; line-height: 1.6; display: block; }

  /* TERMS */
  .terms-wrap { padding: 0 48px 12px; }
  .terms { padding: 14px 0; border-top: 1px solid #e8ecf2; }
  .terms .head { font-size: 8px; font-weight: 700; color: ${themeColor}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; }
  .terms .text { font-size: 10.5px; color: #64748b; line-height: 1.7; }

  /* THANKS — with decorative elements */
  .thanks-wrap { padding: 0 48px; }
  .thanks { text-align: center; padding: 22px 0 18px; border-top: 1px solid #e8ecf2; position: relative; }
  .thanks::before, .thanks::after { content: '✦'; position: absolute; top: -8px; font-size: 10px; color: ${themeColor}; }
  .thanks::before { left: 48px; }
  .thanks::after { right: 48px; }
  .thanks .text { font-size: 14px; color: ${themeColor}; font-weight: 600; letter-spacing: 0.5px; }
  .thanks .sub { font-size: 10.5px; color: #94a3b8; margin-top: 3px; }

  ${invoiceFooterText ? `
  .footer-note-wrap { padding: 0 48px 10px; }
  .footer-note { font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.6; font-style: italic; }
  ` : ''}

  /* FOOTER — with top pattern */
  .footer { padding: 16px 48px; display: flex; justify-content: space-between; align-items: center; border-top: 3px solid ${themeColor}; position: relative; background: linear-gradient(to bottom, ${themeColor}04, transparent 12px); }
  .footer::before { content: ''; position: absolute; top: -2px; left: 0; right: 0; height: 2px; background: repeating-linear-gradient(90deg, ${themeColor}22, ${themeColor}22 6px, transparent 6px, transparent 10px); }
  .footer .left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .footer .left span { color: #94a3b8; font-size: 9.5px; }
  .footer .left .fname { color: ${themeColor}; font-weight: 700; font-size: 10px; letter-spacing: 0.8px; text-transform: uppercase; }
  .footer .right { color: #cbd5e1; font-size: 8.5px; text-transform: uppercase; letter-spacing: 2px; }

  @media print {
    .no-print { display: none; }
    body { background: #fff; }
    .page { margin: 0; box-shadow: none; border-radius: 0; }
    .header-bar { border-radius: 0; }
  }
</style>
</head>
<body>
<div class="no-print">
  <button onclick="window.print()">Save as PDF</button>
  <button onclick="window.close()">Close</button>
</div>

<div class="page">
  <div class="header-bar">
    <div class="brand">
      ${logo ? `<img src="${logo}" alt="Logo">` : `<div class="logo-fallback">${initials}</div>`}
    </div>
    <div class="doc-badge">
      <div class="type">${type}</div>
      <div class="num">${docNumber}</div>
      ${isPartiallyPaid ? `<div style="margin-top:5px;padding:2px 8px;background:rgba(255,255,255,0.1);border-radius:3px;font-size:8px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:1px;text-align:center">Partially Paid</div>` : ''}
    </div>
  </div>

  <div class="info-row">
    <div class="col">
      <div class="col-label">From</div>
      <div class="company-name">${companyName}</div>
      ${address ? `<div class="addr">${address}</div>` : ''}
      ${location ? `<div class="addr">${location}${country ? `, ${country}` : ''}</div>` : ''}
      ${phone ? `<div class="addr">${phone}</div>` : ''}
      ${email ? `<div class="addr">${email}</div>` : ''}
      ${kraPin ? `<div class="kra">KRA PIN: ${kraPin}</div>` : ''}
    </div>
    <div class="col">
      <div class="col-label">Bill To</div>
      <div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:2px">${customerName || 'N/A'}</div>
      ${customerAddress ? `<div class="addr">${customerAddress}</div>` : ''}
      ${customerCountry ? `<div class="addr" style="color:${themeColor};font-weight:600;margin-top:4px">${customerCountry}</div>` : ''}
      <div style="margin-top:16px">
        <div class="meta-grid">
          ${item.issue_date || item.payment_date ? `<span class="ml">Date</span><span class="mv">${fmtDate(item.issue_date || item.payment_date)}</span>` : ''}
          ${item.due_date ? `<span class="ml">Due Date</span><span class="mv">${fmtDate(item.due_date)}</span>` : ''}
          ${item.valid_until ? `<span class="ml">Valid Until</span><span class="mv">${fmtDate(item.valid_until)}</span>` : ''}
          ${isInvoice && quoteRef ? `<span class="ml">Quote Ref</span><span class="mv">${quoteRef}</span>` : ''}
          ${item.payment_terms ? `<span class="ml">Terms</span><span class="mv">${item.payment_terms}</span>` : ''}
        </div>
      </div>
    </div>
  </div>

  ${lineItems.length || item.description ? `
  <div class="table-wrap">
    ${itemsHtml}
  </div>
  ` : ''}

  <div class="totals-section">
    <div class="totals">
      <div class="tl tl-subtotal"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
      ${discounts > 0 ? `<div class="tl tl-discount"><span>Discount</span><span>-${fmt(discounts)}</span></div>` : ''}
      <div class="tl tl-vat"><span>VAT (${vatRate}%)</span><span>${fmt(taxVat)}</span></div>
      ${isPartiallyPaid && paidAmount > 0 ? `
      <div class="tl" style="border-top:1px solid #eef2f6;padding-top:8px;margin-top:4px"><span style="color:#059669;font-weight:600">Amount Paid</span><span style="color:#059669;font-weight:600">${fmt(paidAmount)}</span></div>
      <div class="tl" style="color:#b45309;font-weight:700;font-size:13px;padding-bottom:8px"><span>Balance Due</span><span>${fmt(total - paidAmount)}</span></div>
      ` : ''}
      <div class="total-box">
        <span class="label">${isPartiallyPaid ? 'Original Total' : 'Total'} (${baseCurrency})</span>
        <span class="amount">${fmt(total)}</span>
      </div>
    </div>
  </div>

  ${hasPayment ? `
  <div class="payment-wrap">
    <div class="payment-card">
      <div class="head">Payment Details</div>
      <div class="body">
        ${paymentFields.join('')}
        ${paymentInstructions ? `<div class="pf-full"><span class="pl" style="text-align:left;color:#475569">Instructions</span><span class="pv">${paymentInstructions}</span></div>` : ''}
      </div>
    </div>
  </div>` : ''}

  ${termsConds ? `
  <div class="terms-wrap">
    <div class="terms">
      <div class="head">Terms &amp; Conditions</div>
      <div class="text">${termsConds}</div>
    </div>
  </div>` : ''}

  <div class="thanks-wrap">
    <div class="thanks">
      <div class="text">Thank you for your business!</div>
      <div class="sub">We appreciate your trust in ${companyName}.</div>
    </div>
  </div>

  ${invoiceFooterText ? `
  <div class="footer-note-wrap">
    <div class="footer-note">${invoiceFooterText}</div>
  </div>` : ''}

  <div class="footer">
    <div class="left">
      <span class="fname">${companyName}</span>
      ${address ? `<span>${address}</span>` : ''}
      ${phone ? `<span>${phone}</span>` : ''}
      ${email ? `<span>${email}</span>` : ''}
    </div>
    <div class="right">BiasharaLedger</div>
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
  const fmt = (v: number) => `${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

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
  .amount-row .value { font-weight: 600; }
  .amount-row.total { border-top: 1.5px solid ${themeColor}; margin-top: 8px; padding-top: 10px; font-size: 14px; }
  .amount-row.total .label { font-weight: 700; color: #0f172a; }
  .amount-row.total .value { font-size: 16px; color: ${themeColor}; font-weight: 800; }
  .amount-row.remaining { color: #b45309; }
  .amount-row.remaining .value { font-weight: 700; }
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
    <div class="info-row"><span class="label">Invoice Amount</span><span class="value">KES ${fmt(invoice.amount)}</span></div>

    <div class="amount-box">
      <div class="amount-row"><span class="label">Amount Paid</span><span class="value">KES ${fmt(payment.amount)}</span></div>
      ${isPartial ? `<div class="amount-row remaining"><span class="label">Balance Remaining</span><span class="value">KES ${fmt(payment.remaining)}</span></div>` : ''}
      <div class="amount-row total"><span class="label">${isPartial ? 'Total Paid To Date' : 'Total Paid'}</span><span class="value">KES ${fmt(payment.amount)}</span></div>
    </div>
  </div>

  <div class="thanks">
    <div class="check">&#10003;</div>
    <h2>Thank you for your payment!</h2>
    <p>${isPartial
      ? `We have received your partial payment of KES ${fmt(payment.amount)}. Your remaining balance of KES ${fmt(payment.remaining)} is due. We appreciate your business.`
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
