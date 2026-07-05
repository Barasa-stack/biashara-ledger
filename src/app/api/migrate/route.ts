import { NextResponse } from 'next/server';
import { exec } from '@/lib/db';

export async function GET() {
  const results: string[] = [];
  const cmds = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'KE'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'trial'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verified INTEGER DEFAULT 0`,
  ];
  for (const sql of cmds) {
    try {
      await exec(sql);
      results.push(`OK: ${sql.substring(0, 60)}`);
    } catch (e: any) {
      results.push(`FAIL: ${e?.message || String(e)}`);
    }
  }
  return NextResponse.json({ results });
}
