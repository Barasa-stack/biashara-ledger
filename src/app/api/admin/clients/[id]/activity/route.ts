import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { getLoginHistory, getSessionActivity, getTotalActiveHours } from '@/lib/tracking';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { id } = await params;
    const [loginHistory, sessions, totalHours] = await Promise.all([
      getLoginHistory(id),
      getSessionActivity(id),
      getTotalActiveHours(id),
    ]);

    return NextResponse.json({
      loginHistory,
      sessions,
      totalActiveHours: totalHours,
    });
  } catch (err: any) {
    console.error('admin/client/activity error:', err);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
