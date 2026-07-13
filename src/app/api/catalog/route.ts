import { NextResponse } from 'next/server';
import { getMergedCatalog } from '@/lib/industry-presets';
import { getSessionFromCookies } from '@/lib/auth-server';
import { get } from '@/lib/db';
import { withTenantContext } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');

    const { searchParams } = new URL(request.url);
    const industriesParam = searchParams.get('industries');

    let industries: string[];
    if (industriesParam) {
      industries = industriesParam.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      const settings = await withTenantContext(session.tenant_id!, async () => {
        return await get('SELECT industries FROM company_settings') as any;
      });
      try {
        industries = settings?.industries || ['general'];
        if (typeof industries === 'string') industries = [industries];
      } catch { industries = ['general']; }
    }

    const catalog = getMergedCatalog(industries);
    return NextResponse.json({ industries, categories: catalog });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
