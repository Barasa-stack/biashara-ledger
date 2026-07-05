import { adminRun } from '@/lib/db';

type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'critical';

export async function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    await adminRun(
      `INSERT INTO admin_notifications (type, title, message, link, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [type, title, message, link || '']
    );
  } catch (err) {
    console.error('[notify] Failed to create notification:', err);
  }
}
