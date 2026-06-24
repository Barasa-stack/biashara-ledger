const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist-electron');
const APP_NAME = 'BiasharaLedger';
const PLATFORM = process.platform;

async function main() {
  const isWin = PLATFORM === 'win32';
  const isMac = PLATFORM === 'darwin';
  const ext = isWin ? '.exe' : '';

  const appDir = isMac
    ? path.join(DIST, `${APP_NAME}.app`)
    : path.join(DIST, `${APP_NAME}${ext}`);
  const resourcesDir = isMac
    ? path.join(appDir, 'Contents', 'Resources')
    : path.join(appDir, 'resources');
  const appDir2 = isMac
    ? path.join(resourcesDir, 'app')
    : path.join(resourcesDir, 'app');

  console.log(`Packaging for ${PLATFORM}...`);

  if (isMac || isWin) {
    // Bundle Electron + app into .app structure
    if (isMac) {
      fs.ensureDirSync(path.join(appDir, 'Contents', 'MacOS'));
      fs.ensureDirSync(appDir2);

      // Copy Electron binary
      const electronBin = path.join(ROOT, 'node_modules', 'electron', 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron');
      const destBin = path.join(appDir, 'Contents', 'MacOS', APP_NAME);
      if (fs.existsSync(electronBin)) {
        fs.copyFileSync(electronBin, destBin);
        fs.chmodSync(destBin, 0o755);
      }

      // Copy app files
      copyAppFiles(ROOT, appDir2);

      // Create Info.plist
      const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>${APP_NAME}</string>
  <key>CFBundleIdentifier</key>
  <string>com.biasharaledger.app</string>
  <key>CFBundleName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleVersion</key>
  <string>1.0.0</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>LSMinimumSystemVersion</key>
  <string>10.15</string>
</dict>
</plist>`;
      fs.writeFileSync(path.join(appDir, 'Contents', 'Info.plist'), plist);
    }

    // Create asar or just copy files
    console.log('App bundled at:', appDir);
    console.log('Resources at:', resourcesDir);
    return appDir;
  }

  console.log(`Platform ${PLATFORM} not supported for direct packaging`);
}

function copyAppFiles(src, dest) {
  const dirs = ['electron', '.next', 'public', 'node_modules'];
  const files = ['package.json', 'next.config.ts', 'tsconfig.json'];

  dirs.forEach(d => {
    const s = path.join(src, d);
    if (fs.existsSync(s)) {
      // Exclude some heavy node_module sub-dirs
      if (d === 'node_modules') {
        const keep = ['next', 'react', 'react-dom', 'styled-jsx', 'zod', 'swr', 'electron', 'uuid', 'jsonwebtoken'];
        keep.forEach(k => {
          const modPath = path.join(s, k);
          if (fs.existsSync(modPath)) {
            // Use exec to copy to avoid huge memory usage
            execSync(`cp -R "${modPath}" "${path.join(dest, 'node_modules', k)}"`, { stdio: 'ignore' });
          }
        });
      } else {
        execSync(`cp -R "${s}" "${path.join(dest, d)}"`, { stdio: 'ignore' });
      }
    }
  });
  files.forEach(f => {
    const s = path.join(src, f);
    if (fs.existsSync(s)) fs.copyFileSync(s, path.join(dest, f));
  });
}

main().catch(console.error);
