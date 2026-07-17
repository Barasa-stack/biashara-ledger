export type Tab = 'general' | 'branding' | 'smtp' | 'security' | 'plans' | 'payment' | 'audit';

export type SmtpSettings = {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from_name: string;
  smtp_from_address: string;
  company_name: string;
};

export type GeneralSettings = {
  platform_name: string;
  support_email: string;
  default_currency: string;
  timezone: string;
};

export type BrandingSettings = {
  primary_color: string;
  logo_url: string;
  favicon_url: string;
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  description?: string;
};

export type PlanForm = {
  name: string;
  price: string;
  description: string;
};

export type PaymentSettings = {
  provider: string;
  api_key: string;
  webhook_secret: string;
};

export type AuditEntry = {
  id: string;
  action: string;
  entity_type?: string;
  admin_email?: string;
  ip_address?: string;
  created_at: string;
};

export function formatTimeAgo(dateStr: string) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
