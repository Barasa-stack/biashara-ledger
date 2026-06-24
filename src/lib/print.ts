function fmtDate(d: string) {
  if (!d) return '';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function buildHtml(type: string, item: any, s?: any): string {
  s = s || {};
  const logo = s.logo_base64 || '';
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
  const vatRate = s.vat_rate ?? 16;

  const docNumber = item.invoice_number || item.quotation_number || item.credit_note_number || `#${item.id}`;
  const isInvoice = type === 'Invoice';
  const quoteRef = item.quotation_number || (item.quotation_id ? `#${item.quotation_id}` : '');
  const customerName = item.customer_name || '';
  const customerAddress = item.billing_address || item.address || '';

  const subtotal = item.subtotal ?? item.amount ?? 0;
  const taxVat = item.tax_vat ?? 0;
  const discounts = item.discounts ?? 0;
  const total = item.amount ?? 0;

  const initials = companyName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('');

  const kes = (v: number) => `KES ${Number(v).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  const num = (v: number) => Number(v).toLocaleString('en-KE', { minimumFractionDigits: 2 });

  let lineItems: any[];
  try {
    lineItems = typeof item.items === 'string' ? JSON.parse(item.items) : (Array.isArray(item.items) ? item.items : []);
  } catch { lineItems = []; }

  let itemsHtml: string;
  if (!lineItems.length) {
    lineItems = [item];
    itemsHtml = `
    <div class="row-items">
      <table class="items">
        <thead>
          <tr>
            <th style="width:5%;text-align:center">#</th>
            <th style="width:41%">Item / Service</th>
            <th style="width:12%;text-align:center">Qty</th>
            <th style="width:18%;text-align:right">Unit Price</th>
            <th style="width:24%;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align:center;padding:10px 8px">1</td>
            <td style="padding:10px 14px">${item.description || 'N/A'}</td>
            <td style="text-align:center;padding:10px 14px">${num(item.quantity || 1)}</td>
            <td style="text-align:right;padding:10px 14px">${num(item.unit_price || 0)}</td>
            <td style="text-align:right;padding:10px 14px;font-weight:600;color:#1a1a1a">${num(subtotal)}</td>
          </tr>
        </tbody>
      </table>
      <div class="breaker"></div>
      <div class="totals-wrap">
        <div class="totals">
          <div class="row label"><span>Subtotal</span><span>${kes(subtotal)}</span></div>
          <div class="row label vat-line"><span>VAT (${vatRate}%)</span><span>${kes(taxVat)}</span></div>
          ${discounts > 0 ? `<div class="row label"><span>Discounts</span><span>-${kes(discounts)}</span></div>` : ''}
          <div class="row total"><span>Grand Total</span><span>${kes(total)}</span></div>
        </div>
      </div>
    </div>`;
  } else {
    const rows = lineItems.map((row: any, idx: number) => {
      const qty = Number(row.quantity) || 1;
      const unitPrice = Number(row.unit_price) || 0;
      const lineTotal = qty * unitPrice;
      return `<tr style="page-break-inside:avoid">
        <td style="text-align:center;padding:10px 8px">${idx + 1}</td>
        <td style="padding:10px 14px">${row.description || 'N/A'}</td>
        <td style="text-align:center;padding:10px 14px">${num(qty)}</td>
        <td style="text-align:right;padding:10px 14px">${num(unitPrice)}</td>
        <td style="text-align:right;padding:10px 14px;font-weight:600;color:#1a1a1a">${num(lineTotal)}</td>
      </tr>`;
    }).join('');
    itemsHtml = `
    <div class="row-items">
      <table class="items">
        <thead>
          <tr>
            <th style="width:5%;text-align:center">#</th>
            <th style="width:41%">Item / Service</th>
            <th style="width:12%;text-align:center">Qty</th>
            <th style="width:18%;text-align:right">Unit Price</th>
            <th style="width:24%;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div class="totals-wrap" style="page-break-inside:avoid">
        <div class="totals">
          <div class="row label"><span>Subtotal</span><span>${kes(subtotal)}</span></div>
          <div class="row label vat-line"><span>VAT (${vatRate}%)</span><span>${kes(taxVat)}</span></div>
          ${discounts > 0 ? `<div class="row label"><span>Discounts</span><span>-${kes(discounts)}</span></div>` : ''}
          <div class="row total"><span>Grand Total</span><span>${kes(total)}</span></div>
        </div>
      </div>
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${type} ${docNumber}</title>
<style>
  @page { margin: 0 0 8mm 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; font-size: 12.5px; line-height: 1.7; -webkit-font-smoothing: antialiased; background: #e8e4de; }
  .no-print { text-align: center; padding: 12px 0; background: #fff; position: sticky; top: 0; z-index: 100; border-bottom: 2px solid #df1c1c; }
  .no-print button { background: #df1c1c; color: #fff; border: none; padding: 10px 28px; cursor: pointer; font-size: 15px; font-weight: 600; margin: 0 5px; letter-spacing: 0.3px; }
  .no-print button:hover { background: #c01515; }
  .no-print button:last-child { background: #fff; color: #df1c1c; border: 1px solid #df1c1c; }
  .no-print button:last-child:hover { background: #f5f3f0; }
  .page { max-width: 210mm; margin: 16px auto; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.06); position: relative; }
  .top-bar { height: 4px; background: #df1c1c; }
  .letterhead { padding: 28px 40px 16px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #d4cfc8; }
  .letterhead .logo-wrap { flex-shrink: 0; }
  .letterhead .logo-wrap img { max-height: 72px; max-width: 160px; object-fit: contain; display: block; }
  .letterhead .logo-wrap .logo-fallback { font-size: 32px; font-weight: 800; color: #df1c1c; letter-spacing: 2px; line-height: 1; }
  .letterhead .doc-tag { text-align: right; }
  .letterhead .doc-tag .type { font-size: 24px; font-weight: 800; color: #df1c1c; letter-spacing: 3px; text-transform: uppercase; line-height: 1.1; }
  .letterhead .doc-tag .num { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-top: 4px; letter-spacing: 0.3px; }
  .letterhead .doc-tag .meta-line { font-size: 11px; color: #555; margin-top: 2px; line-height: 1.7; display: flex; justify-content: flex-end; gap: 6px; }
  .letterhead .doc-tag .meta-line strong { color: #1a1a1a; font-weight: 600; min-width: 72px; text-align: left; }
  .letterhead .doc-tag .meta-line .mv { text-align: right; }
  .letterhead .doc-tag .status { display: inline-block; padding: 2px 12px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; background: #df1c1c; color: #fff; margin-top: 6px; }
  .row-company { margin: 14px 40px 0; padding-bottom: 12px; border-bottom: 1px solid #d4cfc8; }
  .row-company .info .name { font-size: 17px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
  .row-company .info .cline { font-size: 12.5px; color: #444; line-height: 1.65; }
  .row-company .info .kra { font-size: 12px; color: #df1c1c; font-weight: 600; margin-top: 5px; }
  .row-billto { margin: 14px 40px 0; display: flex; justify-content: space-between; }
  .row-billto .left { border-left: 3px solid #df1c1c; padding-left: 14px; }
  .row-billto .left .label { font-size: 9px; font-weight: 700; color: #df1c1c; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3px; }
  .row-billto .left .name { font-size: 15px; font-weight: 700; color: #1a1a1a; }
  .row-billto .left .addr { font-size: 12.5px; color: #444; line-height: 1.5; margin-top: 2px; }
  .row-items { padding: 18px 40px 10px; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items thead { background: #df1c1c; }
  table.items th { color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; padding: 10px 14px; text-align: left; }
  table.items th:last-child { text-align: right; }
  table.items td { padding: 10px 14px; border-bottom: 1px solid #e5e2dd; font-size: 12.5px; color: #333; }
  table.items td:last-child { text-align: right; font-weight: 600; color: #1a1a1a; }
  table.items tbody tr:nth-child(even) { background: #faf9f7; }
  table.items tbody tr:last-child td { border-bottom: none; }
  .breaker { border-top: 3px double #df1c1c; margin: 14px 0 10px; }
  .totals-wrap { display: flex; justify-content: flex-end; }
  .totals { width: 280px; padding: 4px 0; }
  .totals .row { display: flex; justify-content: space-between; align-items: baseline; padding: 5px 0; font-size: 12.5px; }
  .totals .row.label span:first-child { color: #555; }
  .totals .row.label span:last-child { color: #1a1a1a; font-weight: 600; }
  .totals .row.vat-line { border-bottom: 1px dashed #d4cfc8; padding-bottom: 8px; margin-bottom: 2px; }
  .totals .row.total { font-size: 15px; font-weight: 800; color: #df1c1c; border-top: 3px double #1a1a1a; border-bottom: 3px double #1a1a1a; padding: 10px 0; margin-top: 6px; }
  .totals .row.total span:last-child { font-size: 17px; letter-spacing: 0.3px; }
  .row-terms { padding: 0 40px 14px; }
  .row-terms .head { font-size: 9px; font-weight: 700; color: #df1c1c; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }
  .row-terms .text { font-size: 11.5px; color: #555; line-height: 1.7; font-style: italic; }
  .row-payment { margin: 0 40px 14px; border: 1px solid #d4cfc8; border-radius: 6px; padding: 14px 18px; }
  .row-payment .head { font-size: 10px; font-weight: 800; color: #df1c1c; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
  .row-payment .box { display: grid; grid-template-columns: auto 1fr; gap: 3px 18px; }
  .row-payment .box .pl { font-size: 11px; color: #df1c1c; font-weight: 600; text-align: right; white-space: nowrap; }
  .row-payment .box .pv { font-size: 11px; color: #1a1a1a; }
  .row-thanks { padding: 0 40px; }
  .row-thanks .inner { text-align: center; padding: 18px 0 16px; border-top: 1px solid #d4cfc8; }
  .row-thanks .inner .text { font-size: 17px; color: #df1c1c; font-style: italic; font-weight: 500; letter-spacing: 0.3px; }
  .row-thanks .inner .sub { font-size: 11px; color: #777; margin-top: 3px; }
  .row-thanks .inner::before { content: ''; display: block; width: 60px; height: 2px; background: #df1c1c; margin: 0 auto 12px; }
  .footer { padding: 12px 40px; display: flex; justify-content: space-between; align-items: center; background: #df1c1c; }
  .footer .left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .footer .left span { color: rgba(255,255,255,0.85); font-size: 10px; letter-spacing: 0.3px; }
  .footer .left .sep { color: rgba(255,255,255,0.35); }
  .footer .left .fname { color: #fff; font-weight: 600; font-size: 10.5px; letter-spacing: 0.8px; text-transform: uppercase; }
  .footer .right { color: rgba(255,255,255,0.5); font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; }
  @media print {
    .no-print { display: none; }
    body { background: #fff; }
    .page { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>
<div class="no-print">
  <button onclick="window.print()">Save as PDF</button>
  <button onclick="window.close()">Close</button>
</div>

<div class="page">
  <div class="top-bar"></div>

  <div class="letterhead">
    <div class="logo-wrap">
      ${logo ? `<img src="${logo}" alt="Logo">` : `<div class="logo-fallback">${initials}</div>`}
    </div>
    <div class="doc-tag">
      <div class="type">${type}</div>
      <div class="num">${docNumber}</div>
      <div class="meta-line"><strong>Date</strong><span class="mv">${fmtDate(item.issue_date || item.payment_date)}</span></div>
      ${item.due_date ? `<div class="meta-line"><strong>Due Date</strong><span class="mv">${fmtDate(item.due_date)}</span></div>` : ''}
      ${item.valid_until ? `<div class="meta-line"><strong>Valid Until</strong><span class="mv">${fmtDate(item.valid_until)}</span></div>` : ''}
      ${isInvoice && quoteRef ? `<div class="meta-line"><strong>Quote Ref</strong><span class="mv">${quoteRef}</span></div>` : ''}
      ${item.payment_terms ? `<div class="meta-line"><strong>Terms</strong><span class="mv">${item.payment_terms}</span></div>` : ''}
      <div class="status">${(item.status || '').replace('_', ' ')}</div>
    </div>
  </div>

  <div class="row-company">
    <div class="info">
      <div class="name">${companyName}</div>
      ${address ? `<div class="cline">${address}</div>` : ''}
      ${location ? `<div class="cline">${location}${country ? `, ${country}` : ''}</div>` : ''}
      ${phone ? `<div class="cline">${phone}</div>` : ''}
      ${email ? `<div class="cline">${email}</div>` : ''}
      ${kraPin ? `<div class="kra">KRA PIN: ${kraPin}</div>` : ''}
    </div>
  </div>

  <div class="row-billto">
    <div class="left">
      <div class="label">Bill To</div>
      <div class="name">${customerName || 'N/A'}</div>
      ${customerAddress ? `<div class="addr">${customerAddress}</div>` : ''}
    </div>
  </div>

  ${itemsHtml}

  ${termsConds ? `
  <div class="row-terms">
    <div class="head">Terms &amp; Conditions</div>
    <div class="text">${termsConds}</div>
  </div>` : ''}

  ${(paybill || bankName) ? `
  <div class="row-payment">
    <div class="head">Payment Details</div>
    <div class="box">
      ${paybill ? `<span class="pl">M-PESA Paybill</span><span class="pv">${paybill}</span>` : ''}
      ${bankName ? `<span class="pl">Bank</span><span class="pv">${bankName}</span>` : ''}
      ${accountNumber ? `<span class="pl">Account</span><span class="pv">${accountNumber}</span>` : ''}
      ${bankBranch ? `<span class="pl">Branch</span><span class="pv">${bankBranch}</span>` : ''}
      ${branchCode ? `<span class="pl">Branch Code</span><span class="pv">${branchCode}</span>` : ''}
      ${bankCode ? `<span class="pl">Bank Code</span><span class="pv">${bankCode}</span>` : ''}
      ${swiftCode ? `<span class="pl">SWIFT</span><span class="pv">${swiftCode}</span>` : ''}
    </div>
  </div>` : ''}

  <div class="row-thanks">
    <div class="inner">
      <div class="text">Thank you for your business!</div>
      <div class="sub">We appreciate your trust and look forward to serving you again.</div>
    </div>
  </div>

  <div class="footer">
    <div class="left">
      <span class="fname">${companyName}</span>
      ${address ? `<span class="sep">|</span><span>${address}</span>` : ''}
      ${location ? `<span class="sep">|</span><span>${location}${country ? `, ${country}` : ''}</span>` : ''}
      ${phone ? `<span class="sep">|</span><span>${phone}</span>` : ''}
      ${email ? `<span class="sep">|</span><span>${email}</span>` : ''}
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
  const initials = companyName.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('');
  const isPartial = payment.payment_type === 'partial';
  const today = payment.payment_date || new Date().toISOString().split('T')[0];
  const receiptNumber = `RCP-${String(invoice.id).padStart(4, '0')}-${today.replace(/-/g, '')}`;
  const kes = (v: number) => `KES ${Number(v).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Payment Receipt ${receiptNumber}</title>
<style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.6; background: #e8e4de; }
  .page { max-width: 210mm; margin: 16px auto; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
  .top-bar { height: 4px; background: #059669; }
  .header { padding: 32px 40px 20px; text-align: center; border-bottom: 1px solid #d4cfc8; }
  .header .icon { width: 56px; height: 56px; border-radius: 50%; background: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
  .header .icon svg { width: 28px; height: 28px; fill: none; stroke: #fff; stroke-width: 2.5; }
  .header h1 { font-size: 22px; font-weight: 800; color: #059669; letter-spacing: 1px; }
  .header .rcp { font-size: 13px; color: #666; margin-top: 4px; }
  .header .status { display: inline-block; margin-top: 8px; padding: 4px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; border-radius: 20px; ${isPartial ? 'background: #fef3c7; color: #b45309;' : 'background: #d1fae5; color: #065f46;'} }
  .section { padding: 20px 40px; }
  .section-title { font-size: 10px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
  .info-grid { display: flex; justify-content: space-between; }
  .info-grid .col { width: 48%; }
  .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0eeeb; font-size: 12.5px; }
  .info-row .label { color: #666; }
  .info-row .value { font-weight: 600; color: #1a1a1a; }
  .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin-top: 12px; }
  .amount-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .amount-row .label { color: #555; }
  .amount-row .value { font-weight: 600; }
  .amount-row.total { border-top: 2px solid #059669; margin-top: 6px; padding-top: 8px; font-size: 16px; }
  .amount-row.total .label { font-weight: 700; color: #1a1a1a; }
  .amount-row.total .value { font-size: 18px; color: #059669; font-weight: 800; }
  .amount-row.remaining { color: #b45309; }
  .amount-row.remaining .value { font-weight: 700; }
  .thanks { padding: 24px 40px; text-align: center; background: #f0fdf4; border-top: 1px solid #bbf7d0; margin-top: 16px; }
  .thanks h2 { font-size: 20px; color: #059669; font-weight: 700; font-style: italic; }
  .thanks p { font-size: 13px; color: #555; margin-top: 6px; }
  .thanks .emoji { font-size: 28px; margin-bottom: 8px; }
  .footer { padding: 12px 40px; display: flex; justify-content: space-between; align-items: center; background: #059669; }
  .footer span { color: rgba(255,255,255,0.85); font-size: 10px; }
  .footer .fname { color: #fff; font-weight: 600; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.8px; }
  .divider { border: none; border-top: 1px dashed #d4cfc8; margin: 12px 0; }
  @media print { body { background: #fff; } .page { margin: 0; box-shadow: none; } }
</style>
</head>
<body>
<div class="page">
  <div class="top-bar"></div>

  <div class="header">
    <div class="icon">
      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <h1>Payment Receipt</h1>
    <p class="rcp">${receiptNumber}</p>
    <div class="status">${isPartial ? 'Partially Paid' : 'Paid in Full'}</div>
  </div>

  <div class="section">
    <div class="info-grid">
      <div class="col">
        <div class="section-title">Company</div>
        ${logo ? `<img src="${logo}" style="max-height:40px;margin-bottom:6px;">` : `<div style="font-size:20px;font-weight:800;color:#059669;margin-bottom:2px;">${initials}</div>`}
        <div style="font-size:13px;font-weight:700;">${companyName}</div>
        ${address ? `<div style="font-size:11px;color:#666;">${address}</div>` : ''}
        ${location ? `<div style="font-size:11px;color:#666;">${location}${country ? `, ${country}` : ''}</div>` : ''}
        ${phone ? `<div style="font-size:11px;color:#666;">${phone}</div>` : ''}
        ${email ? `<div style="font-size:11px;color:#666;">${email}</div>` : ''}
      </div>
      <div class="col">
        <div class="section-title">Customer</div>
        <div style="font-size:13px;font-weight:700;">${invoice.customer_name || 'N/A'}</div>
        <div style="font-size:11px;color:#666;">Invoice: ${invoice.invoice_number || `#${invoice.id}`}</div>
      </div>
    </div>
  </div>

  <hr class="divider">

  <div class="section">
    <div class="section-title">Payment Details</div>
    <div class="info-row"><span class="label">Payment Date</span><span class="value">${today}</span></div>
    <div class="info-row"><span class="label">Payment Method</span><span class="value" style="text-transform:capitalize">${payment.payment_method}</span></div>
    <div class="info-row"><span class="label">Invoice Amount</span><span class="value">${kes(invoice.amount)}</span></div>

    <div class="amount-box">
      <div class="amount-row"><span class="label">Amount Paid</span><span class="value">${kes(payment.amount)}</span></div>
      ${isPartial ? `<div class="amount-row remaining"><span class="label">Balance Remaining</span><span class="value">${kes(payment.remaining)}</span></div>` : ''}
      <div class="amount-row total"><span class="label">${isPartial ? 'Total Paid To Date' : 'Total Paid'}</span><span class="value">${kes(payment.amount)}</span></div>
    </div>
  </div>

  <div class="thanks">
    <div class="emoji">&#10084;&#65039;</div>
    <h2>Thank you for your payment!</h2>
    <p>${isPartial
      ? `We have received your partial payment of ${kes(payment.amount)}. Your remaining balance of ${kes(payment.remaining)} is still due. We appreciate your business and will notify you once the balance is cleared.`
      : 'We have received your payment in full. Thank you for your prompt settlement. We truly appreciate your trust and look forward to serving you again.'}
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
