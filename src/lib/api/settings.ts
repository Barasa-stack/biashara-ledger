import { GeneralSettings, BrandingSettings, SmtpSettings, PaymentSettings, Plan, PlanForm } from '@/types/settings';

export async function loadGeneralSettings(): Promise<{ general: GeneralSettings; branding: BrandingSettings }> {
  const res = await fetch('/api/admin/settings/general');
  if (!res.ok) {
    return {
      general: { platform_name: 'BiasharaLedger', support_email: 'support@biasharaledger.com', default_currency: 'KES', timezone: 'Africa/Nairobi (UTC+3)' },
      branding: { primary_color: '#dc2626', logo_url: '', favicon_url: '' },
    };
  }
  const data = await res.json();
  return {
    general: {
      platform_name: data.platform_name || 'BiasharaLedger',
      support_email: data.support_email || 'support@biasharaledger.com',
      default_currency: data.default_currency || 'KES',
      timezone: data.timezone || 'Africa/Nairobi (UTC+3)',
    },
    branding: {
      primary_color: data.primary_color || '#dc2626',
      logo_url: data.logo_url || '',
      favicon_url: data.favicon_url || '',
    },
  };
}

export async function saveGeneralSettings(general: GeneralSettings, branding: BrandingSettings): Promise<void> {
  await fetch('/api/admin/settings/general', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...general, ...branding }),
  });
}

export async function loadSmtpSettings(): Promise<{ settings: SmtpSettings; locked: boolean }> {
  const res = await fetch('/api/admin/settings/smtp');
  if (!res.ok) throw new Error('Failed to load SMTP settings');
  const data = await res.json();
  const settings: SmtpSettings = {
    smtp_host: data.settings?.smtp_host || 'smtp.gmail.com',
    smtp_port: data.settings?.smtp_port || '587',
    smtp_user: data.settings?.smtp_user || '',
    smtp_pass: data.settings?.smtp_pass || '',
    smtp_from_name: data.settings?.smtp_from_name || 'BiasharaLedger',
    smtp_from_address: data.settings?.smtp_from_address || data.settings?.smtp_user || '',
    company_name: data.settings?.company_name || 'BiasharaLedger',
  };
  return { settings, locked: data.locked !== undefined ? data.locked : true };
}

export async function saveSmtpSettings(smtpSettings: SmtpSettings): Promise<void> {
  const res = await fetch('/api/admin/settings/smtp', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      smtp_host: smtpSettings.smtp_host,
      smtp_port: smtpSettings.smtp_port,
      smtp_user: smtpSettings.smtp_user,
      smtp_pass: smtpSettings.smtp_pass,
      smtp_from_name: smtpSettings.smtp_from_name,
      smtp_from_address: smtpSettings.smtp_from_address,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save SMTP settings');
  }
}

export async function loadPlans(): Promise<Plan[]> {
  const res = await fetch('/api/admin/settings/plans');
  if (res.ok) return res.json();
  return [];
}

export async function savePlan(planForm: PlanForm, editingPlan: Plan | null): Promise<void> {
  const action = editingPlan ? 'update' : 'create';
  const body: Record<string, unknown> = { action, name: planForm.name, price: parseFloat(planForm.price), description: planForm.description };
  if (editingPlan) body.id = editingPlan.id;
  await fetch('/api/admin/settings/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deletePlan(id: string): Promise<void> {
  await fetch('/api/admin/settings/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', id }),
  });
}

export async function loadPaymentSettings(): Promise<PaymentSettings> {
  const res = await fetch('/api/admin/settings/payment');
  if (res.ok) return res.json();
  return { provider: 'M-Pesa (Daraja API)', api_key: '', webhook_secret: '' };
}

export async function savePaymentSettings(payment: PaymentSettings): Promise<void> {
  const res = await fetch('/api/admin/settings/payment', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
  });
  if (!res.ok) throw new Error('Failed to save payment settings');
}

export async function loadSecuritySettings(): Promise<{ enabled: boolean; setup_url: string; secret: string }> {
  const res = await fetch('/api/admin/settings/security');
  if (!res.ok) return { enabled: false, setup_url: '', secret: '' };
  return res.json();
}

export async function saveSecuritySettings(body: { action: 'enable' | 'disable'; code?: string; password?: string }): Promise<{ message: string }> {
  const res = await fetch('/api/admin/settings/security', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed');
  return data;
}

export async function loadAuditLog(): Promise<any[]> {
  const res = await fetch('/api/admin/audit-log');
  if (res.ok) return res.json();
  return [];
}

export async function signOut(): Promise<void> {
  await fetch('/api/auth/signout', { method: 'POST' });
}
