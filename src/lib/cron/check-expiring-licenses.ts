import { getExpiringLicenses, markReminderSent } from '@/lib/license';
import { sendExpiryReminderEmail } from '@/lib/email';
import { logInfo, logError } from '@/lib/logger';

export const checkExpiringLicenses = async () => {
  const schedule = [
    { days: 30, type: '30d' as const },
    { days: 7, type: '7d' as const },
    { days: 1, type: '1d' as const },
  ];

  const summary = {
    expiringIn30Days: 0,
    expiringIn7Days: 0,
    expiringIn1Day: 0,
    remindersSent: 0,
    remindersFailed: 0,
  };

  for (const item of schedule) {
    const licenses = await getExpiringLicenses(item.days);
    summary[`expiringIn${item.days}Days` as keyof typeof summary] = licenses.length;

    for (const license of licenses) {
      const email = license.email as string;
      const name = license.company_name || email || 'Valued Customer';
      const expiresAt = license.expires_at ? new Date(license.expires_at).toISOString() : new Date().toISOString();

      try {
        const result = await sendExpiryReminderEmail({
          to: email,
          name,
          licenseKey: license.license_key,
          daysRemaining: item.days,
          expiresAt,
          urgent: item.days <= 7,
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
  }

  return summary;
};
