export type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

export type Quotation = {
  id: string;
  quotation_number: string;
  customer_id: string;
  customer_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_vat: number;
  discounts: number;
  amount: number;
  payment_terms: string;
  status: string;
  issue_date: string;
  due_date: string;
  customer_country?: string;
  vat_rate?: number;
  items?: string;
};

export type Customer = {
  id: string;
  customer_name: string;
  email_address: string;
  country: string;
};

export type QuotationForm = {
  quotation_number: string;
  customer_id: string;
  customer_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_vat: number;
  discounts: number;
  amount: number;
  payment_terms: string;
  status: string;
  issue_date: string;
  due_date: string;
  customer_country: string;
  vat_rate: number;
};

export type SendConfirm = {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  item: any;
};

export const emptyForm: QuotationForm = {
  quotation_number: '', customer_id: '', customer_name: '', description: '',
  quantity: 1, unit_price: 0, subtotal: 0, tax_vat: 0, discounts: 0,
  amount: 0, payment_terms: 'Net 30', status: 'draft', issue_date: '', due_date: '',
  customer_country: '', vat_rate: 16,
};

export const STATUSES = ['draft', 'sent', 'accepted', 'declined', 'expired', 'overdue'];
export const PAYMENT_TERMS = ['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90'];

export function fmtKES(n: number | string | null | undefined) {
  return `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}
