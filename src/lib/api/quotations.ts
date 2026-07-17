import { Quotation, Customer, LineItem } from '@/types/quotations';

export async function fetchQuotations(): Promise<Quotation[]> {
  const res = await fetch('/api/sales/quotations');
  if (!res.ok) throw new Error('Failed to load quotations');
  return res.json();
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch('/api/customers');
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCompanyVatRate(): Promise<number> {
  const res = await fetch('/api/company');
  if (!res.ok) return 16;
  const data = await res.json();
  return Number(data.vat_rate) || 16;
}

export async function fetchNextQuotationNumber(): Promise<string> {
  try {
    const res = await fetch('/api/company/next-number?type=quotation');
    if (res.ok) {
      const data = await res.json();
      return data.number || '';
    }
  } catch {}
  return '';
}

export async function saveQuotation(form: any, lineItems: LineItem[], editing: any): Promise<void> {
  const url = '/api/sales/quotations';
  const method = editing ? 'PUT' : 'POST';
  const body = { ...form, items: JSON.stringify(lineItems), id: editing?.id || undefined };
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Save failed');
}

export async function deleteQuotation(id: string): Promise<void> {
  const res = await fetch('/api/sales/quotations', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Delete failed');
}

export async function declineQuotation(q: Quotation): Promise<void> {
  const res = await fetch('/api/sales/quotations', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...q, status: 'declined' }),
  });
  if (!res.ok) throw new Error('Failed to decline quotation');
}

export async function sendQuotationEmail(params: {
  to: string; cc?: string; bcc?: string; subject: string; item: any;
}): Promise<{ ok: boolean; pdfError?: string; error?: string }> {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: params.to,
      cc: params.cc || undefined,
      bcc: params.bcc || undefined,
      subject: `Quotation ${params.subject} from BiasharaLedger`,
      message: 'Please find your quotation attached.',
      item: params.item,
      type: 'Quotation',
    }),
  });
  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: true, pdfError: data.pdfError };
  }
  const errData = await res.json().catch(() => ({}));
  return { ok: false, error: errData.error || 'Unknown error' };
}

export async function printQuotation(q: Quotation): Promise<void> {
  const { buildHtml } = await import('@/lib/print');
  const w = window.open('', '_blank');
  if (!w) return;
  try {
    const res = await fetch('/api/company');
    const companyCache = res.ok ? await res.json() : {};
    const html = buildHtml('Quotation', q, companyCache);
    w.document.write(html);
    w.document.close();
  } catch {
    w.document.write('<p>Failed to load quotation template.</p>');
    w.document.close();
  }
}
