import { NextResponse } from 'next/server';
import { adminQuery, adminRun } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const notifications = await adminQuery(`
      SELECT id, type, title, message, link, is_read, created_at
      FROM admin_notifications
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const unreadCount = await adminQuery(`
      SELECT COUNT(*) as count FROM admin_notifications WHERE is_read = 0
    `);

    return NextResponse.json({
      notifications: notifications.map((n: any) => ({
        id: n.id,
        type: n.type || 'info',
        title: n.title || '',
        message: n.message,
        link: n.link || '',
        is_read: !!n.is_read,
        created_at: n.created_at,
      })),
      unreadCount: parseInt(unreadCount[0]?.count) || 0,
    });
  } catch (err) {
    console.error('Notifications API error:', err);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { action } = await req.json();

    if (action === 'mark_read') {
      await adminRun('UPDATE admin_notifications SET is_read = 1 WHERE is_read = 0');
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_one_read') {
      const { id } = await req.json();
      await adminRun('UPDATE admin_notifications SET is_read = 1 WHERE id = $1', [id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'add') {
      const { type, title, message, link } = await req.json();
      const result = await adminQuery(
        `INSERT INTO admin_notifications (type, title, message, link) VALUES ($1, $2, $3, $4) RETURNING id`,
        [type || 'info', title || '', message, link || '']
      );
      return NextResponse.json({ success: true, id: result[0]?.id });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Notifications action error:', err);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
