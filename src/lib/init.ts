import { initSchema } from './schema';

let initialized = false;

export async function ensureDbInitialized() {
  if (initialized) return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  try {
    await initSchema();
  } catch (e) {
    console.error('Schema init failed (non-fatal):', e);
  }
  initialized = true;
}
