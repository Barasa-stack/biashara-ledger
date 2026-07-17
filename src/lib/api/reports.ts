import { ApiData } from '@/types/reports';

export async function fetchReport(f: string, t: string): Promise<ApiData> {
  const res = await fetch(`/api/reports?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || body?.message || 'Failed to load reports');
  }
  return res.json();
}
