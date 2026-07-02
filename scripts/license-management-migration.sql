-- BiasharaLedger License Management System - Database Migration
-- Run this in your PostgreSQL database (Neon)

-- 1. Add columns to users table for temporary password and first login tracking
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS temp_password VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ;

-- 2. Add columns to admin_license_keys table for tracking
ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS generated_by UUID;
ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS activation_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_30d BOOLEAN DEFAULT FALSE;
ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_7d BOOLEAN DEFAULT FALSE;
ALTER TABLE public.admin_license_keys ADD COLUMN IF NOT EXISTS reminder_sent_1d BOOLEAN DEFAULT FALSE;

-- 3. Create email_logs table for audit
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  user_id UUID,
  email_type VARCHAR(50),
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent',
  error_message TEXT
);

-- 4. Create license_history table for audit trail
CREATE TABLE IF NOT EXISTS public.license_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  license_id UUID,
  action VARCHAR(50),
  old_plan_tier VARCHAR(20),
  new_plan_tier VARCHAR(20),
  old_expires_at TIMESTAMPTZ,
  new_expires_at TIMESTAMPTZ,
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create index on license expiry for faster queries
CREATE INDEX IF NOT EXISTS idx_license_expires_at ON public.admin_license_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_license_client_id ON public.admin_license_keys(client_id);
CREATE INDEX IF NOT EXISTS idx_license_key ON public.admin_license_keys(license_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_client ON public.email_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_license_history_client ON public.license_history(client_id);

-- 6. Function to automatically expire licenses
CREATE OR REPLACE FUNCTION expire_licenses()
RETURNS void AS $$
BEGIN
  UPDATE public.admin_license_keys
  SET is_active = FALSE
  WHERE is_active = TRUE
  AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 7. View for license status with client info
CREATE OR REPLACE VIEW public.license_status_view AS
SELECT
  c.id as client_id,
  c.company_name,
  c.email,
  c.license_key as client_license_key,
  l.id as license_id,
  l.license_key,
  l.plan,
  l.is_active,
  l.expires_at,
  CASE
    WHEN l.expires_at < CURRENT_TIMESTAMP THEN 'expired'
    WHEN l.expires_at < CURRENT_TIMESTAMP + INTERVAL '7 days' THEN 'expiring_soon'
    WHEN l.expires_at < CURRENT_TIMESTAMP + INTERVAL '30 days' THEN 'expiring'
    ELSE 'active'
  END as status,
  l.reminder_sent_30d,
  l.reminder_sent_7d,
  l.reminder_sent_1d,
  u.first_login,
  u.subscription_status
FROM public.admin_clients c
LEFT JOIN public.admin_license_keys l ON l.client_id = c.id
LEFT JOIN public.users u ON u.email = c.email AND u.role = 'admin';
