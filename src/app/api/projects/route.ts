import { NextResponse } from 'next/server';
import { query, run, insertReturning, withTenantContext } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const projects = await withTenantContext(session.tenant_id!, async () => {
      return await query(`
        SELECT p.*, c.customer_name, c.company_name as customer_company,
          (SELECT COALESCE(SUM(amount), 0) FROM project_transactions WHERE project_id=p.id AND entity_type='expense') as total_expenses,
          (SELECT COALESCE(SUM(amount), 0) FROM project_transactions WHERE project_id=p.id AND entity_type='revenue') as total_revenue
        FROM projects p LEFT JOIN customers c ON c.id=p.customer_id ORDER BY p.created_at DESC`);
    });
    return NextResponse.json(projects);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    const result = await withTenantContext(session.tenant_id!, async () => {
      return await insertReturning<{ id: string }>(
        `INSERT INTO projects (tenant_id, project_name, description, start_date, end_date, budget, currency, customer_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [session.tenant_id, body.project_name, body.description || '', body.start_date || '', body.end_date || '', Number(body.budget) || 0, body.currency || 'KES', body.customer_id || null, body.status || 'active']
      );
    });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const body = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('UPDATE projects SET project_name=$1, description=$2, start_date=$3, end_date=$4, budget=$5, customer_id=$6, status=$7 WHERE id=$8',
        [body.project_name, body.description || '', body.start_date || '', body.end_date || '', Number(body.budget) || 0, body.customer_id || null, body.status || 'active', body.id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error('Unauthorized');
    const { id } = await request.json();
    await withTenantContext(session.tenant_id!, async () => {
      await run('DELETE FROM project_transactions WHERE project_id=$1', [id]);
      await run('DELETE FROM projects WHERE id=$1', [id]);
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[error] ${msg}`);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[] Error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
