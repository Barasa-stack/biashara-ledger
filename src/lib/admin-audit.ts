import { adminRun } from './db';

export async function logAdminAction(params: {
  adminId?: string;
  adminEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) {
  const { adminId, adminEmail, action, entityType, entityId, details, ipAddress } = params;

  try {
    await adminRun(
      `INSERT INTO admin_audit_log (admin_id, admin_email, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId || null, adminEmail || '', action, entityType || '', entityId || '', details || '', ipAddress || '']
    );
  } catch (err) {
    console.error('Failed to log audit:', err);
  }

  try {
    const notifType =
      action.toLowerCase().includes('revoke') || action.toLowerCase().includes('deactivat') ? 'error'
      : action.toLowerCase().includes('expir') ? 'warning'
      : 'info';

    await adminRun(
      `INSERT INTO admin_notifications (type, title, message, link)
       VALUES ($1, $2, $3, $4)`,
      [notifType, action, details || action, entityType === 'license' ? '/admin/licenses' : entityType === 'client' ? '/admin/clients' : '/admin/updates']
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
