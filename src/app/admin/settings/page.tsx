'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Tab, SmtpSettings, GeneralSettings, BrandingSettings, Plan, PlanForm, PaymentSettings } from '@/types/settings';
import { loadGeneralSettings, loadSmtpSettings, loadPlans, loadPaymentSettings, loadAuditLog, saveGeneralSettings, saveSmtpSettings, savePaymentSettings, savePlan, deletePlan } from '@/lib/api/settings';
import SidebarTabs from '@/components/settings/SidebarTabs';
import GeneralTab from '@/components/settings/GeneralTab';
import BrandingTab from '@/components/settings/BrandingTab';
import SmtpTab from '@/components/settings/SmtpTab';
import SecurityTab from '@/components/settings/SecurityTab';
import PlansTab from '@/components/settings/PlansTab';
import PaymentTab from '@/components/settings/PaymentTab';
import AuditLog from '@/components/settings/AuditLog';
import PlanModal from '@/components/settings/PlanModal';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [general, setGeneral] = useState<GeneralSettings>({
    platform_name: 'BiasharaLedger',
    support_email: 'support@biasharaledger.com',
    default_currency: 'KES',
    timezone: 'Africa/Nairobi (UTC+3)',
  });
  const [generalLoading, setGeneralLoading] = useState(false);

  const [branding, setBranding] = useState<BrandingSettings>({
    primary_color: '#dc2626',
    logo_url: '',
    favicon_url: '',
  });

  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_from_name: 'BiasharaLedger',
    smtp_from_address: '',
    company_name: 'BiasharaLedger',
  });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpError, setSmtpError] = useState('');
  const [smtpLocked, setSmtpLocked] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState<PlanForm>({ name: '', price: '', description: '' });

  const [payment, setPayment] = useState<PaymentSettings>({
    provider: 'M-Pesa (Daraja API)',
    api_key: '',
    webhook_secret: '',
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadGeneral = useCallback(async () => {
    setGeneralLoading(true);
    try {
      const data = await loadGeneralSettings();
      setGeneral(data.general);
      setBranding(data.branding);
    } catch {}
    setGeneralLoading(false);
  }, []);

  const loadSmtp = useCallback(async () => {
    setSmtpLoading(true);
    setSmtpError('');
    try {
      const data = await loadSmtpSettings();
      setSmtpSettings(data.settings);
      setSmtpLocked(data.locked);
    } catch (err: any) {
      setSmtpError(err.message);
    } finally {
      setSmtpLoading(false);
    }
  }, []);

  const loadPlansList = useCallback(async () => {
    setPlansLoading(true);
    try {
      setPlans(await loadPlans());
    } catch {}
    setPlansLoading(false);
  }, []);

  const loadPayment = useCallback(async () => {
    setPaymentLoading(true);
    try {
      setPayment(await loadPaymentSettings());
    } catch {}
    setPaymentLoading(false);
  }, []);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      setAuditLog(await loadAuditLog());
    } catch {}
    setAuditLoading(false);
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 'general':
      case 'branding':
        loadGeneral();
        break;
      case 'smtp':
        loadSmtp();
        break;
      case 'plans':
        loadPlansList();
        break;
      case 'payment':
        loadPayment();
        break;
      case 'audit':
        loadAudit();
        break;
    }
  }, [activeTab, loadGeneral, loadSmtp, loadPlansList, loadPayment, loadAudit]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      switch (activeTab) {
        case 'general':
        case 'branding': {
          await saveGeneralSettings(general, branding);
          break;
        }
        case 'smtp': {
          await saveSmtpSettings(smtpSettings);
          break;
        }
        case 'payment': {
          await savePaymentSettings(payment);
          break;
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      setSaveError(error.message);
      setTimeout(() => setSaveError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePlanSave = async () => {
    if (!planForm.name.trim() || !planForm.price) return;
    await savePlan(planForm, editingPlan);
    setShowPlanModal(false);
    setEditingPlan(null);
    setPlanForm({ name: '', price: '', description: '' });
    loadPlansList();
  };

  const handlePlanDelete = async (id: string) => {
    await deletePlan(id);
    loadPlansList();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-56 flex-shrink-0">
        <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex-1">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 capitalize">{activeTab} Settings</h3>
              <p className="text-xs text-gray-500 mt-0.5">Configure your {activeTab} preferences</p>
            </div>
            <div className="flex items-center gap-3">
              {saveError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertTriangle size={14} />
                  {saveError}
                </div>
              )}
              {activeTab !== 'audit' && activeTab !== 'plans' && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                  {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>

          {activeTab === 'general' && (
            <GeneralTab general={general} onChange={setGeneral} loading={generalLoading} />
          )}

          {activeTab === 'branding' && (
            <BrandingTab branding={branding} onChange={setBranding} />
          )}

          {activeTab === 'smtp' && (
            <SmtpTab
              settings={smtpSettings}
              onChange={setSmtpSettings}
              loading={smtpLoading}
              locked={smtpLocked}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              error={smtpError}
              onRefresh={loadSmtp}
            />
          )}

          {activeTab === 'security' && <SecurityTab />}

          {activeTab === 'plans' && (
            <PlansTab
              plans={plans}
              loading={plansLoading}
              onEdit={(plan) => {
                setEditingPlan(plan);
                setPlanForm({ name: plan.name, price: String(plan.price), description: plan.description || '' });
                setShowPlanModal(true);
              }}
              onDelete={handlePlanDelete}
              onAdd={() => {
                setEditingPlan(null);
                setPlanForm({ name: '', price: '', description: '' });
                setShowPlanModal(true);
              }}
            />
          )}

          {activeTab === 'payment' && (
            <PaymentTab payment={payment} onChange={setPayment} loading={paymentLoading} />
          )}

          {activeTab === 'audit' && (
            <AuditLog entries={auditLog} loading={auditLoading} />
          )}
        </div>
      </div>

      <PlanModal
        show={showPlanModal}
        planForm={planForm}
        editingPlan={editingPlan}
        onClose={() => setShowPlanModal(false)}
        onSave={handlePlanSave}
        onFieldChange={(field, value) => setPlanForm(p => ({ ...p, [field]: value }))}
      />
    </div>
  );
}
