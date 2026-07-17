import { adminRun, adminGet, exec } from './db';
import { logError } from './logger';

const MIGRATIONS_TABLE = 'public._migrations';

type Migration = {
  name: string;
  run: () => Promise<void>;
};

async function ensureMigrationsTable() {
  await adminRun(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function isMigrationApplied(name: string): Promise<boolean> {
  try {
    const row = await adminGet<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM ${MIGRATIONS_TABLE} WHERE name = $1) as exists`,
      [name]
    );
    return row?.exists ?? false;
  } catch {
    return false;
  }
}

async function markMigrationApplied(name: string) {
  try {
    await adminRun(
      `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [name]
    );
  } catch (e) {
    logError('migration', `Failed to mark ${name} as applied`, { error: e });
  }
}

export async function runMigrations(migrations: Migration[]) {
  await ensureMigrationsTable();

  for (const migration of migrations) {
    const applied = await isMigrationApplied(migration.name);
    if (applied) continue;

    try {
      await migration.run();
      await markMigrationApplied(migration.name);
    } catch (e) {
      logError('migration', `Migration ${migration.name} failed`, { error: e });
    }
  }
}
