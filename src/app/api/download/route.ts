import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DOWNLOADS_DIR = path.join(process.cwd(), 'public', 'downloads');

const MIME_TYPES: Record<string, string> = {
  '.exe': 'application/vnd.microsoft.portable-executable',
  '.dmg': 'application/x-apple-diskimage',
  '.AppImage': 'application/x-executable',
  '.zip': 'application/zip',
  '.deb': 'application/vnd.debian.binary-package',
  '.rpm': 'application/x-rpm',
};

const FILES: Record<string, { file: string; name: string }> = {
  windows: { file: 'biashara-ledger-setup.exe', name: 'BiasharaLedger-Setup.exe' },
  mac: { file: 'biashara-ledger-mac.dmg', name: 'BiasharaLedger-macOS.dmg' },
  macos: { file: 'biashara-ledger-mac.dmg', name: 'BiasharaLedger-macOS.dmg' },
  'mac-arm64': { file: 'biashara-ledger-mac-arm64.dmg', name: 'BiasharaLedger-macOS-arm64.dmg' },
  linux: { file: 'biashara-ledger-linux.AppImage', name: 'BiasharaLedger-linux.AppImage' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const fileName = searchParams.get('file');

  let filePath: string;
  let downloadName: string;

  if (fileName) {
    const safeName = path.basename(fileName);
    filePath = path.join(DOWNLOADS_DIR, safeName);
    downloadName = safeName;
  } else if (type && FILES[type]) {
    filePath = path.join(DOWNLOADS_DIR, FILES[type].file);
    downloadName = FILES[type].name;
  } else {
    return NextResponse.json({ error: 'Invalid download type. Use: windows, mac, mac-arm64, or linux' }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Installer file not found. Build the Electron app first with: npm run dist:win / dist:mac / dist:linux' }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath);
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${downloadName}"`,
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
