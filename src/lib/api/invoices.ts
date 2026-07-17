import { Invoice, Customer, Quotation, LineItem } from '@/types/invoices';

export async function fetchInvoices(): Promise<Invoice[]> {
  const res = await fetch('/api/sales/invoices');
  if (!res.ok) throw new Error('Failed to load invoices');
  return res.json();
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch('/api/customers');
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCompanyName(): Promise<{ company_name: string; vat_rate: number }> {
  const res = await fetch('/api/company');
  if (!res.ok) return { company_name: 'BiasharaLedger', vat_rate: 0 };
  return res.json();
}

export async function fetchQuotations(): Promise<Quotation[]> {
  const res = await fetch('/api/sales/quotations');
  if (!res.ok) return [];
  return res.json();
}

export async function fetchNextInvoiceNumber(): Promise<string> {
  try {
    const res = await fetch('/api/company/next-number?type=invoice');
    if (res.ok) {
      const data = await res.json();
      return data.number || '';
    }
  } catch {}
  return '';
}

export async function saveInvoice(form: any, lineItems: LineItem[], editing: any): Promise<void> {
  const url = '/api/sales/invoices';
  const method = editing ? 'PUT' : 'POST';
  const body = { ...form, items: JSON.stringify(lineItems), id: editing?.id || undefined };
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error || 'Save failed');
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  const res = await fetch('/api/sales/invoices', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Delete failed');
}

export async function markInvoiceAsDeclined(inv: Invoice): Promise<void> {
  const res = await fetch('/api/sales/invoices', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...inv, status: 'declined' }),
  });
  if (!res.ok) throw new Error('Failed to decline invoice');
}

export async function sendInvoiceEmail(params: {
  to: string; cc?: string; bcc?: string; subject: string; item: any;
}): Promise<{ ok: boolean; pdfError?: string; error?: string }> {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: params.to,
      cc: params.cc || undefined,
      bcc: params.bcc || undefined,
      subject: params.subject,
      message: 'Please find your invoice attached.',
      item: params.item,
      type: 'Invoice',
    }),
  });
  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: true, pdfError: data.pdfError };
  }
  const errData = await res.json().catch(() => ({}));
  return { ok: false, error: errData.error || 'Unknown error' };
}

export async function confirmPayment(params: {
  id: string; paymentType: 'full' | 'partial'; partialAmount: number;
  paymentMethod: string; idempotencyKey: string;
}): Promise<{ emailSent?: boolean; emailError?: string }> {
  const res = await fetch('/api/sales/invoices/mark-paid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-idempotency-key': params.idempotencyKey },
    body: JSON.stringify({
      id: params.id,
      payment_type: params.paymentType,
      partial_amount: params.partialAmount,
      payment_method: params.paymentMethod || 'cash',
      idempotency_key: params.idempotencyKey,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to mark as paid');
  }
  return res.json();
}

export async function printInvoice(inv: Invoice): Promise<void> {
  const { buildHtml } = await import('@/lib/print');
  const w = window.open('', '_blank');
  if (!w) return;
  try {
    let companyCache: any = null;
    const res = await fetch('/api/company');
    companyCache = res.ok ? await res.json() : {};
    let printInv = inv;
    if (!inv.hasOwnProperty('items') || !inv.items) {
      try {
        const res = await fetch('/api/sales/invoices?id=' + inv.id);
        if (res.ok) {
          const full = await res.json();
          if (full) printInv = full;
        }
      } catch {}
    }
    const html = buildHtml('Invoice', printInv, companyCache);
    w.document.write(html);
    w.document.close();
  } catch (e: any) {
    w.document.write('<p>Failed to load invoice template: ' + (e?.message || String(e)) + '</p>');
    w.document.close();
  }
}
