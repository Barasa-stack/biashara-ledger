'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { Quotation, Customer, SendConfirm } from '@/types/quotations';
import { fetchQuotations, fetchCustomers, fetchCompanyVatRate, deleteQuotation, declineQuotation, sendQuotationEmail, printQuotation } from '@/lib/api/quotations';
import { QuotationTable } from '@/components/quotations/QuotationTable';
import { QuotationFormModal } from '@/components/quotations/QuotationFormModal';
import { EmailModal } from '@/components/quotations/EmailModal';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [pageToast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [vatRate, setVatRate] = useState(16);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendConfirm, setSendConfirm] = useState<SendConfirm | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    if (pageToast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [pageToast]);

  const doFetchQuotations = () => {
    setLoading(true);
    setError('');
    fetchQuotations()
      .then(setQuotations)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    doFetchQuotations();
    fetchCustomers().then(setCustomers);
    fetchCompanyVatRate().then(setVatRate);
  }, []);

  const handleDelete = async (q: Quotation) => {
    if (!await confirm(`Delete quotation "${q.quotation_number}"?`)) return;
    try {
      await deleteQuotation(q.id);
      doFetchQuotations();
    } catch (e: any) {
      setToast({ message: e.message || 'Delete failed', type: 'error' });
    }
  };

  const handleDecline = async (q: Quotation) => {
    if (!await confirm(`Mark quotation "${q.quotation_number}" as declined by customer?`)) return;
    try {
      await declineQuotation(q);
      doFetchQuotations();
      setToast({ message: `Quotation "${q.quotation_number}" marked as declined`, type: 'success' });
    } catch (e: any) {
      setToast({ message: e.message || 'Failed to decline quotation', type: 'error' });
    }
  };

  const handleSendClick = (q: Quotation) => {
    const customer = customers.find(c => c.id === q.customer_id);
    const email = customer?.email_address;
    if (!email) {
      setToast({ message: 'No email address on file for this customer', type: 'warning' });
      return;
    }
    setSendConfirm({
      to: email,
      cc: '',
      bcc: '',
      subject: q.quotation_number,
      item: q,
    });
  };

  const handleSendEmail = async () => {
    if (!sendConfirm) return;
    setSendingEmail(true);
    try {
      const result = await sendQuotationEmail(sendConfirm);
      if (result.ok) {
        setToast({ message: result.pdfError ? `Quotation emailed (PDF not attached: ${result.pdfError})` : 'Quotation emailed successfully', type: result.pdfError ? 'warning' : 'success' });
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
      <QuotationTable
        quotations={quotations}
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
        onEdit={(q) => { setEditing(q); setModalOpen(true); }}
        onDelete={handleDelete}
        onDecline={handleDecline}
        onPrint={printQuotation}
        onSendEmail={handleSendClick}
        onRetry={doFetchQuotations}
      />

      <QuotationFormModal
        open={modalOpen}
        editing={editing}
        customers={customers}
        vatRate={vatRate}
        onClose={() => setModalOpen(false)}
        onSaved={doFetchQuotations}
        showToast={(msg, type) => setToast({ message: msg, type })}
      />

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
