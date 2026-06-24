import { NextResponse } from 'next/server';
import { createReadStream, existsSync } from 'fs';
import { readFile, writeFile, mkdir, copyFile, rm } from 'fs/promises';
import { stat } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'desktop-source';
  const root = process.cwd();

  try {
    if (type === 'desktop-source') {
      const tmpDir = join('/tmp', 'biashara-desktop-' + Date.now());
      await mkdir(tmpDir, { recursive: true });

      type FileEntry = { src: string; dest: string };
      const files: FileEntry[] = [
        { src: 'electron/main.cjs', dest: 'electron/main.cjs' },
        { src: 'electron/preload.cjs', dest: 'electron/preload.cjs' },
        { src: 'electron/database.cjs', dest: 'electron/database.cjs' },
        { src: 'electron/license.cjs', dest: 'electron/license.cjs' },
        { src: 'electron/desktop.cjs', dest: 'electron/desktop.cjs' },
        { src: 'electron-builder.yml', dest: 'electron-builder.yml' },
        { src: 'package.json', dest: 'package.json' },
        { src: 'start-desktop.sh', dest: 'start-desktop.sh' },
        { src: 'start-desktop.bat', dest: 'start-desktop.bat' },
      ];

      for (const f of files) {
        const srcPath = join(root, f.src);
        const destPath = join(tmpDir, f.dest);
        if (existsSync(srcPath)) {
          const dir = join(destPath, '..');
          if (!existsSync(dir)) await mkdir(dir, { recursive: true });
          await copyFile(srcPath, destPath);
        }
      }

      const readme = `BiasharaLedger Desktop
====================

To run the desktop application:

1. Install Node.js 18+ from https://nodejs.org
2. Open a terminal in this directory
3. Run: npm install
4. Run: npx next build --webpack
5. Run: npx electron electron/desktop.cjs

Or use the launcher script:
  - macOS: ./start-desktop.sh
  - Windows: double-click start-desktop.bat
`;
      await writeFile(join(tmpDir, 'README.txt'), readme);

      const tarPath = join('/tmp', `biashara-desktop-${Date.now()}.tar.gz`);
      execSync(`tar -czf "${tarPath}" -C "${tmpDir}" .`, { stdio: 'ignore' });
      await rm(tmpDir, { recursive: true, force: true });

      const s = await stat(tarPath);
      const stream = createReadStream(tarPath);

      const body = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            controller.enqueue(chunk);
          }
          controller.close();
          await rm(tarPath, { force: true });
        },
      });

      return new NextResponse(body, {
        headers: {
          'Content-Type': 'application/gzip',
          'Content-Disposition': 'attachment; filename="biashara-ledger-desktop.tar.gz"',
          'Content-Length': String(s.size),
        },
      });
    }

    if (type === 'macos-app') {
      const appPath = join(root, 'dist-electron', 'mac', 'BiasharaLedger.app');
      if (existsSync(appPath)) {
        const tarPath = join('/tmp', `BiasharaLedger-macOS-${Date.now()}.tar.gz`);
        execSync(`tar -czf "${tarPath}" -C "dist-electron/mac" "BiasharaLedger.app"`, { cwd: root, stdio: 'ignore' });
        const s = await stat(tarPath);
        const stream = createReadStream(tarPath);
        const body = new ReadableStream({
          async start(controller) {
            for await (const chunk of stream) {
              controller.enqueue(chunk);
            }
            controller.close();
            await rm(tarPath, { force: true });
          },
        });
        return new NextResponse(body, {
          headers: {
            'Content-Type': 'application/gzip',
            'Content-Disposition': 'attachment; filename="BiasharaLedger-macOS.tar.gz"',
            'Content-Length': String(s.size),
          },
        });
      }
      return NextResponse.json({ error: 'macOS app not built yet. Run npm run electron:build first.' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Unknown download type' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
