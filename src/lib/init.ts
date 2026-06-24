import { initSchema } from './schema';

let initialized = false;

export async function ensureDbInitialized() {
  if (initialized) return;
  await initSchema();
  initialized = true;
}
