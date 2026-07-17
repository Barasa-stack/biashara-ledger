import { exec } from '../db';
import { logError } from '../logger';

export async function safeExec(sql: string, params?: any[]) {
  try {
    await exec(sql, params);
  } catch (e) {
    logError('schema', e instanceof Error ? e.message : String(e));
  }
}
