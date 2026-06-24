const { app, BrowserWindow, ipcMain, session } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const { initLocalDatabase } = require('./database.cjs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow;
let serverProcess;

function startNextServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');
    serverProcess = fork(serverPath, ['start', '-p', '3456'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });
    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log('[next]', msg);
      if (msg.includes('Ready')) resolve();
    });
    serverProcess.stderr.on('data', (data) => console.error('[next:err]', data.toString()));
    serverProcess.on('error', reject);
    setTimeout(() => resolve(), 8000);
  });
}

async function createWindow() {
  if (!isDev) await startNextServer();
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 960, minHeight: 600,
    icon: path.join(__dirname, '..', 'public', 'favicon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false, contextIsolation: true, sandbox: false,
    },
    show: false, backgroundColor: '#ffffff',
  });
  const url = isDev ? 'http://localhost:3000' : 'http://localhost:3456';
  mainWindow.loadURL(url);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  if (!isDev) {
    mainWindow.webContents.on('devtools-opened', () => mainWindow.webContents.closeDevTools());
    mainWindow.webContents.on('will-navigate', (e, url) => {
      if (!url.startsWith('file://') && !url.startsWith('http://localhost')) e.preventDefault();
    });
    session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(permission === 'notifications'));
  }
}

app.whenReady().then(async () => {
  try { await initLocalDatabase(); } catch (e) { console.error('DB init:', e.message); }
  await createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => { if (serverProcess) serverProcess.kill(); });

ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('get-version', () => app.getVersion());

ipcMain.handle('activate-license', async (_, { licenseKey, userEmail }) => {
  try {
    const crypto = require('crypto');
    const os = require('os');
    const { execSync } = require('child_process');
    const components = [os.cpus()[0]?.model, os.hostname(), os.platform(), os.arch()];
    try { components.push(execSync('wmic bios get serialnumber 2>nul').toString().trim()); } catch {}
    try { components.push(execSync('wmic baseboard get serialnumber 2>nul').toString().trim()); } catch {}
    const hwFingerprint = crypto.createHash('sha256').update(components.join('|')).digest('hex');
    const response = await fetch('https://api.biasharaledger.com/api/license/activate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey, hardwareFingerprint: hwFingerprint, userEmail }),
    });
    const data = await response.json();
    if (data.success) {
      const fs = require('fs');
      const licensePath = path.join(app.getPath('userData'), 'license.json');
      fs.writeFileSync(licensePath, JSON.stringify({ token: data.token, licenseKey, hardwareFingerprint: hwFingerprint, ...data }));
    }
    return data;
  } catch (e) {
    return { success: false, error: e.message || 'Activation failed' };
  }
});
