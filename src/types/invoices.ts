export type Invoice = {
  id: string;
  invoice_number: string;
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
  quotation_id?: string;
  paid_amount?: number;
  items?: string | any[];
};

export type Customer = {
  id: string;
  customer_name: string;
  email_address: string;
  phone_number: string;
  billing_address: string;
  country: string;
};

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
  customer_country?: string;
  items: string;
  description?: string;
};

export type InvoiceForm = {
  invoice_number: string;
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
  quotation_id: string;
};

export type SendConfirm = {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  item: any;
};

export type PaymentModalState = {
  invoice: Invoice;
  paymentType: 'full' | 'partial';
  partialAmount: string;
  paymentMethod: string;
};

export const emptyForm: InvoiceForm = {
  invoice_number: '', customer_id: '', customer_name: '', description: '',
  quantity: 1, unit_price: 0, subtotal: 0, tax_vat: 0, discounts: 0,
  amount: 0, payment_terms: 'Net 30', status: 'draft', issue_date: '', due_date: '',
  customer_country: '', vat_rate: 16, quotation_id: '',
};

export const STATUSES = ['draft', 'sent', 'unpaid', 'paid', 'partially_paid', 'overdue', 'declined', 'cancelled'];
export const PAYMENT_TERMS = ['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90'];

export function fmtKES(n: number | string | null | undefined) {
  return `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}
