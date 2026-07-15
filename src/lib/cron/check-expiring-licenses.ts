import { getExpiringLicenses, markReminderSent } from '@/lib/license';
import { sendExpiryReminderEmail } from '@/lib/email';
import { logInfo, logError } from '@/lib/logger';
import { adminRun, adminQuery } from '@/lib/db';
import { createNotification } from '@/lib/admin-notify';

export const checkExpiringLicenses = async () => {
  const schedule: { days: number; type: '30d' | '7d' | '3d' | '1d' | '12h'; label: string }[] = [
    { days: 30, type: '30d', label: '30 days' },
    { days: 7, type: '7d', label: '7 days' },
    { days: 3, type: '3d', label: '3 days' },
    { days: 1, type: '1d', label: '1 day' },
    { days: 0.5, type: '12h', label: '12 hours' },
  ];

  const summary: any = {
    expiringIn30Days: 0,
    expiringIn7Days: 0,
    expiringIn3Days: 0,
    expiringIn1Day: 0,
    remindersSent: 0,
    remindersFailed: 0,
  };

  for (const item of schedule) {
    const licenses = await getExpiringLicenses(item.days);
    if (item.days === 30) summary.expiringIn30Days = licenses.length;
    else if (item.days === 7) summary.expiringIn7Days = licenses.length;
    else if (item.days === 3) summary.expiringIn3Days = licenses.length;
    else if (item.days === 1) summary.expiringIn1Day = licenses.length;

    for (const license of licenses) {
      const email = license.email as string;
      const name = license.company_name || email || 'Valued Customer';
      const expiresAt = license.expires_at ? new Date(license.expires_at).toISOString() : new Date().toISOString();
      const isPaymentNotice = item.type === '12h';

      try {
        const result = await sendExpiryReminderEmail({
          to: email,
          name,
          licenseKey: license.license_key,
          daysRemaining: isPaymentNotice ? 0 : Math.round(item.days),
          expiresAt,
          urgent: item.days <= 7,
          paymentNotice: isPaymentNotice,
        });

        if (result.sent) {
          await markReminderSent(license.license_key, item.type);
          summary.remindersSent += 1;
          logInfo('cron', `Expiry reminder sent for ${license.license_key}`, { email, daysRemaining: item.days });
        } else {
          summary.remindersFailed += 1;
          logError('cron', `Expiry reminder failed for ${license.license_key}`, { email, daysRemaining: item.days, error: result.error || 'unknown' });
        }
      } catch (err: any) {
        summary.remindersFailed += 1;
        logError('cron', `Expiry reminder exception for ${license.license_key}`, { email, daysRemaining: item.days, error: err?.message || err });
      }
    }

    // Also check trial users (only for short-range reminders)
    if (item.days <= 3) {
      const rangeCondition = item.days === 3
        ? `u.trial_end_date > CURRENT_TIMESTAMP + interval '1 days' AND u.trial_end_date <= CURRENT_TIMESTAMP + interval '3 days'`
        : item.days === 1
        ? `u.trial_end_date > CURRENT_TIMESTAMP AND u.trial_end_date <= CURRENT_TIMESTAMP + interval '1 days'`
        : `u.trial_end_date > CURRENT_TIMESTAMP AND u.trial_end_date <= CURRENT_TIMESTAMP + interval '12 hours'`;

      const trialLicenses = await adminQuery(
        `SELECT u.email, u.first_name || ' ' || u.last_name AS company_name, u.license_key, u.trial_end_date AS expires_at
         FROM users u
         WHERE u.license_status = 'trial'
           AND u.trial_end_date IS NOT NULL
           AND ${rangeCondition}
         ORDER BY u.trial_end_date ASC`,
        []
      );

      for (const tl of trialLicenses) {
        const email = tl.email as string;
        const name = tl.company_name || email || 'Valued Customer';
        const expiresAt = tl.expires_at ? new Date(tl.expires_at).toISOString() : new Date().toISOString();
        const isPaymentNotice = item.type === '12h';

        try {
          const result = await sendExpiryReminderEmail({
            to: email,
            name,
            licenseKey: tl.license_key,
            daysRemaining: isPaymentNotice ? 0 : Math.round(item.days),
            expiresAt,
            urgent: true,
            paymentNotice: isPaymentNotice,
          });

          if (result.sent) {
            summary.remindersSent += 1;
            logInfo('cron', `Trial expiry reminder sent for ${tl.license_key}`, { email, daysRemaining: item.days });
          } else {
            summary.remindersFailed += 1;
            logError('cron', `Trial expiry reminder failed for ${tl.license_key}`, { email, daysRemaining: item.days, error: result.error || 'unknown' });
          }
        } catch (err: any) {
          summary.remindersFailed += 1;
          logError('cron', `Trial expiry reminder exception for ${tl.license_key}`, { email, daysRemaining: item.days, error: err?.message || err });
        }
      }
    }
  }

  // Auto-deactivate expired licenses (both paid and trial)
  try {
    const deactivated = await adminRun(
      `UPDATE users SET license_status = 'expired', subscription_status = 'expired'
       WHERE (
         (subscription_expiry IS NOT NULL AND subscription_expiry < NOW())
         OR
         (trial_end_date IS NOT NULL AND trial_end_date < NOW())
       )
       AND license_status NOT IN ('expired', 'revoked')`
    );
    summary.deactivated = deactivated?.rowCount || 0;
    if (deactivated?.rowCount > 0) {
      logInfo('cron', `Deactivated ${deactivated.rowCount} expired licenses`);
      createNotification('warning', 'Licenses Expired', `${deactivated.rowCount} license(s) expired and have been deactivated.`, '/admin/licenses');
    }
  } catch (err: any) {
    logError('cron', 'Failed to deactivate expired licenses', { error: err?.message });
  }

  // Notify about expiring licenses in 3 days
  const expiringSoon = (summary as any).expiringIn3Days || 0;
  if (expiringSoon > 0) {
    createNotification('warning', 'Licenses Expiring Soon', `${expiringSoon} license(s) will expire in 3 days.`, '/admin/licenses');
  }

  return summary;
};
