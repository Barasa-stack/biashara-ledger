import { initSchema } from './schema';

let initialized = false;

export async function ensureDbInitialized() {
  if (initialized) return;
  try {
    await initSchema();
  } catch (e) {
    console.error('Schema init failed (non-fatal):', e);
  }
  initialized = true;
}
