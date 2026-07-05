-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  verified BOOLEAN DEFAULT true,
  subscription_plan TEXT DEFAULT 'premium',
  subscription_status TEXT DEFAULT 'active',
  license_status TEXT DEFAULT 'active',
  country TEXT DEFAULT 'KE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Insert tenants
INSERT INTO tenants (id, name, created_at) 
VALUES ('73f6c416-a84c-4e39-8167-e62b2fc4d169', 'default_tenant', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenants (id, name, created_at) 
VALUES ('92afe6fb-12e2-49c0-853a-1d09d9ec5e8b', 'dummy_client', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert users (with fixed tenant_id)
INSERT INTO users (
  id, email, password_hash, tenant_id, verified, 
  first_name, last_name, role, 
  subscription_plan, subscription_status, license_status,
  country, created_at
) VALUES (
  '1', 'Evanromanoff@gmail.com', '$2b$10$O0RsWK3eRukLlEh3tPRJ7eI.IUCB95Okd2m7kDs/KGCpWqIYtUKzq', '73f6c416-a84c-4e39-8167-e62b2fc4d169', true,
  '', '', 'admin',
  'premium', 'active', 'active',
  'KE', NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (
  id, email, password_hash, tenant_id, verified, 
  first_name, last_name, role, 
  subscription_plan, subscription_status, license_status,
  country, created_at
) VALUES (
  '2', 'Mambombaya1992@gmail.com', '$2b$10$Tx9EukygzPa.29KQfFYYmuoOQvrsQYFqxxbWCSE5rLEi4yXfXQh/q', '92afe6fb-12e2-49c0-853a-1d09d9ec5e8b', true,
  'Mambombaya', 'User', 'admin',
  'premium', 'inactive', 'active',
  'KE', NOW()
)
ON CONFLICT (id) DO NOTHING;
