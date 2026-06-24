'use client';

import { useEffect, useState, useRef } from 'react';
import { Settings, Building2, Landmark, Mail, FileText, ShieldCheck, Upload } from 'lucide-react';

type Company = {
  company_name: string;
  address: string;
  location: string;
  country: string;
  phone: string;
  email: string;
  kra_pin: string;
  logo_base64: string;
  paybill_number: string;
  bank_name: string;
  account_number: string;
  bank_branch: string;
  branch_code: string;
  bank_code: string;
  swift_code: string;
  terms_conditions: string;
  invoice_prefix: string;
  quotation_prefix: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  vat_rate: number;
};

const emptyForm: Company = {
  company_name: '', address: '', location: '', country: 'Kenya',
  phone: '', email: '', kra_pin: '', logo_base64: '',
  paybill_number: '', bank_name: '', account_number: '', bank_branch: '',
  branch_code: '', bank_code: '', swift_code: '',
  terms_conditions: '', invoice_prefix: 'INV', quotation_prefix: 'QTN',
  smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '', vat_rate: 16,
};

function Section({ icon: Icon, title, desc, children }: { icon: any; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-brand" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          {desc && <p className="text-xs text-gray-500">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type, placeholder }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type || 'text'}
        value={value}
        onChange={onChange}
        placeholder={placeholder || ''}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<Company>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetched, setFetched] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof Company) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const fetchCompany = () => {
    setLoading(true);
    setError('');
    fetch('/api/company')
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load settings'))
      .then(data => {
        setForm(prev => ({ ...prev, ...data }));
        setFetched(true);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCompany(); }, []);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, logo_base64: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setSuccess('Settings saved successfully');
    } catch (e: any) {
      setError(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (error && !fetched) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-brand font-medium mb-2">Failed to load settings</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchCompany} className="mt-4 text-sm text-brand font-medium hover:text-gray-800 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Company Settings</h1>
          <p className="text-xs text-gray-500">Manage company info, banking, invoice templates, and email</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <span className="text-sm text-gray-600">Loading settings...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-5 max-w-2xl">
          <Section icon={Building2} title="Company Information" desc="Legal business details used on invoices">
            <Field label="Company Name" value={form.company_name} onChange={set('company_name')} placeholder="Your Business Name" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email" value={form.email} onChange={set('email')} type="email" placeholder="info@company.co.ke" />
              <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="+254 712 345 678" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
              <textarea value={form.address} onChange={set('address')} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Location / Town" value={form.location} onChange={set('location')} placeholder="Nairobi" />
              <Field label="Country" value={form.country} onChange={set('country')} />
              <Field label="KRA PIN" value={form.kra_pin} onChange={set('kra_pin')} placeholder="P051234567Z" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Company Logo</label>
              <div className="flex items-center gap-4">
                {form.logo_base64 && (
                  <img src={form.logo_base64} alt="Logo" className="h-12 w-12 object-contain rounded-lg border border-border" />
                )}
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-sm text-brand font-medium hover:text-gray-800 transition-colors">
                  <Upload className="h-4 w-4" /> {form.logo_base64 ? 'Change Logo' : 'Upload Logo'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                {form.logo_base64 && (
                  <button onClick={() => setForm(prev => ({ ...prev, logo_base64: '' }))} className="text-xs text-gray-500 hover:text-brand transition-colors">Remove</button>
                )}
              </div>
            </div>
          </Section>

          <Section icon={Landmark} title="Banking & M-Pesa" desc="Payment details shown on invoices and quotations">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bank Name" value={form.bank_name} onChange={set('bank_name')} placeholder="Equity Bank" />
              <Field label="Account Number" value={form.account_number} onChange={set('account_number')} placeholder="0123456789" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Branch" value={form.bank_branch} onChange={set('bank_branch')} placeholder="Nairobi Branch" />
              <Field label="Branch Code" value={form.branch_code} onChange={set('branch_code')} placeholder="12345" />
              <Field label="Bank Code" value={form.bank_code} onChange={set('bank_code')} placeholder="12" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="SWIFT Code" value={form.swift_code} onChange={set('swift_code')} placeholder="EQBLKENA" />
              <Field label="M-Pesa Paybill / Till" value={form.paybill_number} onChange={set('paybill_number')} placeholder="247247" />
            </div>
          </Section>

          <Section icon={FileText} title="Invoice & Quotation Defaults" desc="Templates and numbering for documents">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Invoice Prefix" value={form.invoice_prefix} onChange={set('invoice_prefix')} placeholder="INV" />
              <Field label="Quotation Prefix" value={form.quotation_prefix} onChange={set('quotation_prefix')} placeholder="QTN" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="VAT Rate (%)" value={String(form.vat_rate)} onChange={e => setForm(prev => ({ ...prev, vat_rate: Number(e.target.value) || 0 }))} type="number" placeholder="16" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Terms & Conditions</label>
              <textarea
                value={form.terms_conditions}
                onChange={set('terms_conditions')}
                rows={3}
                placeholder="Payment is due within 30 days. Interest of 1.5% per month applies on overdue balances."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              />
            </div>
          </Section>

          <Section icon={Mail} title="SMTP / Email Settings" desc="Used to send invoices, quotations, and OTP emails">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="SMTP Host" value={form.smtp_host} onChange={set('smtp_host')} placeholder="smtp.gmail.com" />
              <Field label="SMTP Port" value={form.smtp_port} onChange={set('smtp_port')} placeholder="587" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="SMTP Username" value={form.smtp_user} onChange={set('smtp_user')} placeholder="you@gmail.com" />
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">SMTP Password</label>
                <div className="relative">
                  <input
                    type={showSmtpPass ? 'text' : 'password'}
                    value={form.smtp_pass}
                    onChange={set('smtp_pass')}
                    placeholder="App password"
                    className="w-full border border-border rounded-lg px-3 py-2 pr-8 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    type="button"
                  >
                    {showSmtpPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 italic">
              Leave blank to use the global SMTP env vars (SMTP_HOST, SMTP_USER, etc.)
            </p>
          </Section>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
