import { NextResponse } from 'next/server';
import { createReadStream, existsSync } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'mac';
  const root = process.cwd();

  try {
    if (type === 'mac') {
      const dmgPath = join(root, 'public', 'downloads', 'biashara-ledger-mac.dmg');
      
      if (!existsSync(dmgPath)) {
        return NextResponse.json({ error: 'Mac installer not found' }, { status: 404 });
      }

      const s = await stat(dmgPath);
      const stream = createReadStream(dmgPath);

      const body = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            controller.enqueue(chunk);
          }
          controller.close();
        },
      });

      return new NextResponse(body, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="BiasharaLedger-macOS.dmg"',
          'Content-Length': String(s.size),
        },
      });
    }

    if (type === 'windows') {
      const exePath = join(root, 'public', 'downloads', 'biashara-ledger-setup.exe');
      
      if (!existsSync(exePath)) {
        return NextResponse.json({ error: 'Windows installer not available yet' }, { status: 404 });
      }

      const s = await stat(exePath);
      const stream = createReadStream(exePath);

      const body = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            controller.enqueue(chunk);
          }
          controller.close();
        },
      });

      return new NextResponse(body, {
        headers: {
          'Content-Type': 'application/x-msdownload',
          'Content-Disposition': 'attachment; filename="BiasharaLedger-Setup.exe"',
          'Content-Length': String(s.size),
        },
      });
    }

    return NextResponse.json({ error: 'Use ?type=mac or ?type=windows' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
