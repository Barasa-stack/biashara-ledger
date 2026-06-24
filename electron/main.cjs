const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { initLocalDatabase } = require('./database.cjs');

const isDev = !app.isPackaged;
let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 960, minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false, contextIsolation: true, sandbox: false,
    },
    show: false, backgroundColor: '#ffffff',
  });

  // Always load from the live website
  mainWindow.loadURL('https://biasharaledger.qzz.io/sign-in');
  
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });

  if (!isDev) {
    mainWindow.webContents.on('devtools-opened', () => mainWindow.webContents.closeDevTools());
    session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(permission === 'notifications'));
  }
}

app.whenReady().then(async () => {
  try { await initLocalDatabase(); } catch (e) { console.error('DB init:', e.message); }
  await createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

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
