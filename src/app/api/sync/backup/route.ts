import { NextResponse } from 'next/server';
import { createBackup, getBackups, getLatestBackup, restoreBackup, deleteBackup, deleteOldBackups } from '@/lib/backup';
import { validateOfflineSession } from '@/lib/offline-session';

export async function POST(request: Request) {
  try {
    const { sessionToken, licenseKey, data, backupType } = await request.json();

    if (!sessionToken && !licenseKey) {
      return NextResponse.json({ error: 'Session token or license key required' }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Backup data required' }, { status: 400 });
    }

    let effectiveLicenseKey = licenseKey;
    if (sessionToken) {
      const validation = await validateOfflineSession(sessionToken);
      if (!validation.valid) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 403 });
      }
      if (!effectiveLicenseKey) {
        effectiveLicenseKey = validation.session?.license_key;
      }
    }
    if (!effectiveLicenseKey) {
      return NextResponse.json({ error: 'Could not determine license key' }, { status: 400 });
    }

    const result = await createBackup({
      licenseKey: effectiveLicenseKey,
      data: { type: backupType || 'full', timestamp: new Date().toISOString(), ...data },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await deleteOldBackups(effectiveLicenseKey, 10);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Backup creation failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const licenseKey = searchParams.get('licenseKey');
    const action = searchParams.get('action') || 'list';

    if (!licenseKey) {
      return NextResponse.json({ error: 'License key required' }, { status: 400 });
    }

    if (action === 'latest') {
      const backup = await getLatestBackup(licenseKey);
      if (!backup) {
        return NextResponse.json({ error: 'No backup found' }, { status: 404 });
      }
      return NextResponse.json(backup);
    }

    const backups = await getBackups(licenseKey);
    return NextResponse.json(backups);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { backupId, sessionToken } = await request.json();

    if (!backupId) {
      return NextResponse.json({ error: 'Backup ID required' }, { status: 400 });
    }

    if (sessionToken) {
      const validation = await validateOfflineSession(sessionToken);
      if (!validation.valid) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 403 });
      }
    }

    const result = await restoreBackup(backupId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Backup restoration failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const backupId = parseInt(searchParams.get('backupId') || '');

    if (!backupId) {
      return NextResponse.json({ error: 'Backup ID required' }, { status: 400 });
    }

    const result = await deleteBackup(backupId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: 'Backup deletion failed' }, { status: 500 });
  }
}
