'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { Invoice, Customer, Quotation, SendConfirm, PaymentModalState } from '@/types/invoices';
import { fetchInvoices, fetchCustomers, fetchQuotations, fetchCompanyName, deleteInvoice, markInvoiceAsDeclined, sendInvoiceEmail, confirmPayment, printInvoice } from '@/lib/api/invoices';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { InvoiceFormModal } from '@/components/invoices/InvoiceFormModal';
import { PaymentModal } from '@/components/invoices/PaymentModal';
import { EmailModal } from '@/components/invoices/EmailModal';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const { toast: showToast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [pageToast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [vatRate, setVatRate] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendConfirm, setSendConfirm] = useState<SendConfirm | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  useEffect(() => {
    if (pageToast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [pageToast]);

  const doFetchInvoices = () => {
    setLoading(true);
    setError('');
    fetchInvoices()
      .then(setInvoices)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    doFetchInvoices();
    fetchCustomers().then(setCustomers);
    fetchQuotations().then(setQuotations);
    fetchCompanyName().then(d => {
      setCompanyName(d.company_name || 'BiasharaLedger');
      setVatRate(d.vat_rate ?? 0);
    });
  }, []);

  const handleDelete = async (inv: Invoice) => {
    if (!await confirm(`Delete invoice "${inv.invoice_number}"?`)) return;
    const prev = invoices;
    setInvoices(prev => prev.filter(i => i.id !== inv.id));
    try {
      await deleteInvoice(inv.id);
      showToast('Invoice deleted', 'success');
    } catch (e: any) {
      setInvoices(prev);
      showToast(e.message || 'Delete failed');
    }
  };

  const handleMarkPaid = (inv: Invoice) => {
    const remaining = inv.amount - (inv.paid_amount || 0);
    setPaymentModal({ invoice: inv, paymentType: remaining >= inv.amount ? 'full' : 'partial', partialAmount: '', paymentMethod: 'cash' });
  };

  const handleSendClick = (inv: Invoice) => {
    const customer = customers.find(c => c.id === inv.customer_id);
    const email = customer?.email_address || '';
    if (!email) {
      setToast({ message: 'No email address on file for this customer', type: 'warning' });
      return;
    }
    setSendConfirm({
      to: email,
      cc: '',
      bcc: '',
      subject: `Invoice ${inv.invoice_number} from ${companyName || 'BiasharaLedger'}`,
      item: inv,
    });
  };

  const handleConfirmPayment = async () => {
    if (!paymentModal) return;
    setProcessingPayment(true);
    try {
      const paidAmount = paymentModal.paymentType === 'partial' ? Number(paymentModal.partialAmount) : paymentModal.invoice.amount;
      if (!paidAmount || paidAmount <= 0) throw new Error('Invalid payment amount');
      const idempotencyKey = crypto.randomUUID();
      const result = await confirmPayment({
        id: paymentModal.invoice.id,
        paymentType: paymentModal.paymentType,
        partialAmount: paidAmount,
        paymentMethod: paymentModal.paymentMethod || 'cash',
        idempotencyKey,
      });
      doFetchInvoices();
      setPaymentModal(null);
      const paidLabel = `Invoice "${paymentModal.invoice.invoice_number}" ${paymentModal.paymentType === 'partial' ? `partially paid` : 'marked as paid'}`;
      const receiptMsg = result.emailSent ? '. Receipt emailed to customer.' : result.emailError ? `. Receipt email failed: ${result.emailError}` : '';
      setToast({ message: paidLabel + receiptMsg, type: result.emailError ? 'warning' : 'success' });
    } catch (e: any) {
      showToast(e.message || 'Failed to mark as paid');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDecline = async (inv: Invoice) => {
    if (!await confirm(`Mark invoice "${inv.invoice_number}" as declined by customer?`)) return;
    try {
      await markInvoiceAsDeclined(inv);
      doFetchInvoices();
      setToast({ message: `Invoice "${inv.invoice_number}" marked as declined`, type: 'success' });
    } catch (e: any) {
      showToast(e.message || 'Failed to decline invoice');
    }
  };

  const handleSendEmail = async () => {
    if (!sendConfirm) return;
    setSendingEmail(true);
    try {
      const result = await sendInvoiceEmail(sendConfirm);
      if (result.ok) {
        setToast({ message: result.pdfError ? `Invoice emailed (PDF not attached: ${result.pdfError})` : 'Invoice emailed successfully', type: result.pdfError ? 'warning' : 'success' });
      } else {
        setToast({ message: `Email failed: ${result.error}`, type: 'error' });
      }
    } catch (e: any) {
      setToast({ message: `Email failed: ${e.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setSendingEmail(false);
      setSendConfirm(null);
    }
  };

  return (
    <div className="space-y-5">
      <InvoiceTable
        invoices={invoices}
        loading={loading}
        error={error}
        dateFrom={dateFrom}
        dateTo={dateTo}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onStatusFilterChange={setStatusFilter}
        onSearchQueryChange={setSearchQuery}
        onClearFilters={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setSearchQuery(''); }}
        onAdd={() => { setEditing(null); setModalOpen(true); }}
        onEdit={(inv) => { setEditing(inv); setModalOpen(true); }}
        onDelete={handleDelete}
        onMarkPaid={handleMarkPaid}
        onDecline={handleDecline}
        onPrint={printInvoice}
        onSendEmail={handleSendClick}
        onRetry={doFetchInvoices}
      />

      <InvoiceFormModal
        open={modalOpen}
        editing={editing}
        customers={customers}
        quotations={quotations}
        vatRate={vatRate}
        onClose={() => setModalOpen(false)}
        onSaved={doFetchInvoices}
        showToast={(msg, type) => showToast(msg, type)}
      />

      {paymentModal && (
        <PaymentModal
          paymentModal={paymentModal}
          onClose={() => setPaymentModal(null)}
          onConfirm={handleConfirmPayment}
          onUpdate={setPaymentModal}
          processing={processingPayment}
        />
      )}

      {sendConfirm && (
        <EmailModal
          sendConfirm={sendConfirm}
          onClose={() => setSendConfirm(null)}
          onUpdate={setSendConfirm}
          onSend={handleSendEmail}
          sending={sendingEmail}
        />
      )}

      {pageToast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
          pageToast.type === 'success' ? 'bg-emerald-600' : pageToast.type === 'warning' ? 'bg-amber-500' : 'bg-red-600'
        }`}>
          <span>{pageToast.message}</span>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {dialog}
    </div>
  );
}
