const { app, BrowserWindow, ipcMain, session, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');
const { autoUpdater } = require('electron-updater');

const isDev = !app.isPackaged;
const API = isDev ? 'http://localhost:3000/api' : 'https://biasharaledger.qzz.io/api';
const APP = isDev ? 'http://localhost:3000' : 'https://biasharaledger.qzz.io';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

let mainWindow;
let heartbeatInterval;
let backupInterval;

autoUpdater.setFeedURL({
  provider: 'github',
  repo: 'biashara-ledger',
  owner: process.env.GITHUB_REPO_OWNER || 'digitalbaroz',
  releaseType: 'release',
});

function getLicensePath() {
  return path.join(app.getPath('userData'), 'license.json');
}

function getSessionPath() {
  return path.join(app.getPath('userData'), 'session.json');
}

function getBackupPath() {
  return path.join(app.getPath('userData'), 'backups');
}

function checkLicense() {
  try {
    const p = getLicensePath();
    if (!fs.existsSync(p)) return { valid: false, reason: 'no-license' };
    const lic = JSON.parse(fs.readFileSync(p, 'utf8'));
    const now = Date.now();
    if (now - lic.activatedAt > SEVEN_DAYS) {
      if (lic.sessionToken) {
        return { valid: true, reason: 'offline-session', sessionToken: lic.sessionToken, daysRemaining: -1 };
      }
      return { valid: false, reason: 'expired' };
    }
    return { valid: true, daysRemaining: Math.ceil((SEVEN_DAYS - (now - lic.activatedAt)) / 86400000), sessionToken: lic.sessionToken };
  } catch { return { valid: false, reason: 'error' }; }
}

function saveSession(data) {
  fs.writeFileSync(getSessionPath(), JSON.stringify({
    sessionToken: data.sessionToken,
    licenseKey: data.licenseKey,
    userEmail: data.userEmail,
    hardwareFingerprint: data.hardwareFingerprint,
    expiresAt: data.expiresAt,
    createdAt: Date.now(),
  }));
}

function loadSession() {
  try {
    const p = getSessionPath();
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { return null; }
}

function clearSession() {
  try { fs.unlinkSync(getSessionPath()); } catch {}
}

function checkAppIntegrity() {
  const asarPath = path.join(process.resourcesPath || '', 'app.asar');
  if (!fs.existsSync(asarPath)) return true;
  try {
    const asarContent = fs.readFileSync(asarPath);
    const hash = crypto.createHash('sha256').update(asarContent).digest('hex');
    if (global.__asarHash && global.__asarHash !== hash) {
      dialog.showErrorBox('Security Error', 'Application integrity check failed. Please reinstall.');
      app.quit();
      return false;
    }
    global.__asarHash = hash;
    return true;
  } catch { return true; }
}

function isRunningInVM() {
  try {
    const os = require('os');
    const cpu = os.cpus()[0]?.model || '';
    const vmPatterns = ['VMware', 'VirtualBox', 'QEMU', 'Parallels', 'Virtual', 'KVM', 'Hyper-V'];
    return vmPatterns.some(pattern => cpu.includes(pattern));
  } catch { return false; }
}

function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(`${API.replace('/api', '')}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => { req.destroy(); resolve(false); });
  });
}

async function apiFetch(endpoint, body, retries = 2) {
  const url = `${API}${endpoint}`;
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      let data;
      try { data = await res.json(); } catch { data = {}; }
      return { ok: res.ok, status: res.status, data, cookies: res.headers.getSetCookie?.() || [] };
    } catch (e) {
      lastErr = e;
      if (i < retries) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastErr;
}

function navigateToDashboard() {
  if (mainWindow) {
    mainWindow.loadURL(`${APP}/dashboard`);
  }
}

async function injectSessionCookie(value, maxAge) {
  if (!mainWindow) return;
  try {
    await mainWindow.webContents.session.cookies.set({
      url: APP,
      name: 'bl_session',
      value,
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      expirationDate: Math.floor(Date.now() / 1000) + maxAge,
    });
  } catch (e) {
    console.error('Cookie set failed:', e);
  }
}

async function verifySessionCookie() {
  if (!mainWindow) return null;
  try {
    const cookies = await mainWindow.webContents.session.cookies.get({ name: 'bl_session' });
    return cookies.length > 0 ? cookies[0] : null;
  } catch { return null; }
}

async function navigateAndSetCookie(token, maxAge) {
  if (!mainWindow) return false;
  try {
    await injectSessionCookie(token, maxAge);
    const verified = await verifySessionCookie();
    if (verified) {
      navigateToDashboard();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function saveLicense(data) {
  const existing = (() => { try { return JSON.parse(fs.readFileSync(getLicensePath(), 'utf8')); } catch { return {}; } })();
  fs.writeFileSync(getLicensePath(), JSON.stringify({
    ...existing,
    ...data,
    activatedAt: existing.activatedAt || Date.now(),
  }));
}

async function doHeartbeat() {
  try {
    const lic = checkLicense();
    const sessionData = loadSession();
    if (!sessionData && !lic.sessionToken) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const body = {
      sessionToken: sessionData?.sessionToken || lic.sessionToken || '',
      licenseKey: sessionData?.licenseKey || '',
      hardwareFingerprint: sessionData?.hardwareFingerprint || '',
      appVersion: app.getVersion(),
      platform: process.platform,
      data: { connected: true, timestamp: new Date().toISOString() },
    };
    const res = await fetch(`${API}/sync/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const result = await res.json();

    if (result.needsReactivation) {
      clearSession();
      if (mainWindow) {
        mainWindow.loadFile(path.join(__dirname, 'offline-login.html'));
      }
      return;
    }

    if (result.needsRenewal && sessionData?.sessionToken) {
      try {
        const renewRes = await fetch(`${API}/offline/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: sessionData.sessionToken }),
        });
        const renewData = await renewRes.json();
        if (renewData.valid && renewData.expiresAt) {
          sessionData.expiresAt = renewData.expiresAt;
          saveSession(sessionData);
        }
      } catch {}
    }

    if (result.updateAvailable && result.updateAvailable.version !== app.getVersion()) {
      const cmp = app.getVersion().localeCompare(result.updateAvailable.version, undefined, { numeric: true, sensitivity: 'base' });
      if (cmp < 0) {
        const changes = Array.isArray(result.updateAvailable.changes)
          ? result.updateAvailable.changes.join('\n')
          : 'Bug fixes and improvements';
        const updateChoice = await dialog.showMessageBox({
          type: 'info',
          title: 'Update Available',
          message: `Version ${result.updateAvailable.version} is available!`,
          detail: `Current version: ${app.getVersion()}\n\nWhat's new:\n${changes}`,
          buttons: ['Download', 'Later'],
          defaultId: 0,
        });
        if (updateChoice.response === 0) {
          shell.openExternal('https://biasharaledger.qzz.io/download');
        }
      }
    }

    if (mainWindow) {
      mainWindow.webContents.send('heartbeat-result', result);
    }
  } catch {
    // Silently fail heartbeat - offline mode
  }
}

async function doBackup() {
  try {
    const sessionData = loadSession();
    if (!sessionData?.sessionToken) return;

    const backupDir = getBackupPath();
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const backupFile = path.join(backupDir, `backup-${Date.now()}.json`);
    const localData = {
      timestamp: new Date().toISOString(),
      licenseKey: sessionData.licenseKey,
      localFiles: [],
    };

    const dataPath = path.join(app.getPath('userData'), 'data');
    if (fs.existsSync(dataPath)) {
      const files = fs.readdirSync(dataPath).slice(0, 100);
      for (const file of files) {
        try {
          const fp = path.join(dataPath, file);
          const content = fs.readFileSync(fp, 'utf8');
          localData.localFiles.push({ name: file, content: content.substring(0, 50000) });
        } catch {}
      }
    }

    fs.writeFileSync(backupFile, JSON.stringify(localData));

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      await fetch(`${API}/sync/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: sessionData.sessionToken,
          licenseKey: sessionData.licenseKey,
          data: localData,
          backupType: 'heartbeat',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch {}

    const backups = fs.readdirSync(backupDir).filter(f => f.startsWith('backup-')).sort();
    while (backups.length > 10) {
      const oldest = backups.shift();
      try { fs.unlinkSync(path.join(backupDir, oldest)); } catch {}
    }
  } catch {}
}

async function checkForUpdates() {
  try {
    const res = await fetch(`${API}/updates/latest`);
    const update = await res.json();
    const currentVersion = app.getVersion();
    if (update.version && update.version !== currentVersion) {
      const cmp = currentVersion.localeCompare(update.version, undefined, { numeric: true, sensitivity: 'base' });
      if (cmp < 0) {
        const changes = Array.isArray(update.changes) ? update.changes.join('\n') : 'Bug fixes and improvements';
        const result = await dialog.showMessageBox({
          type: 'info',
          title: 'Update Available',
          message: `Version ${update.version} is available!`,
          detail: `Current version: ${currentVersion}\n\nWhat's new:\n${changes}`,
          buttons: ['Download', 'Later'],
          defaultId: 0,
        });
        if (result.response === 0) {
          shell.openExternal(update.downloadUrl || 'https://biasharaledger.qzz.io/download');
        }
      }
    }
  } catch {}
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 960, minHeight: 600,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false, contextIsolation: true, sandbox: false,
      webSecurity: true,
    },
    show: false, backgroundColor: '#0a0a0a',
  });

  if (!isDev) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith(APP) && !url.startsWith('file://')) {
        event.preventDefault();
      }
    });
  }

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (['clipboard-read', 'media', 'geolocation', 'notifications'].includes(permission)) {
      return callback(false);
    }
    callback(true);
  });

  const lic = checkLicense();
  const sessionData = loadSession();
  if (lic.valid || sessionData) {
    mainWindow.loadURL(`${APP}/dashboard`);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'offline-login.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });

  // Periodic license recheck every hour
  setInterval(() => {
    const licCheck = checkLicense();
    if (!licCheck.valid && !loadSession() && mainWindow) {
      mainWindow.loadFile(path.join(__dirname, 'offline-login.html'));
    }
  }, 3600000);

  // Heartbeat every 30 minutes
  heartbeatInterval = setInterval(doHeartbeat, 30 * 60 * 1000);
  setTimeout(doHeartbeat, 5000);

  // Backup every 2 hours (every 4th heartbeat)
  backupInterval = setInterval(doBackup, 2 * 60 * 60 * 1000);
  setTimeout(doBackup, 60000);

  if (!isDev) {
    checkAppIntegrity();
    autoUpdater.checkForUpdates();
    setInterval(() => { autoUpdater.checkForUpdates(); }, 6 * 60 * 60 * 1000);
    checkForUpdates();
    setInterval(checkForUpdates, 6 * 60 * 60 * 1000);
  }
}

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `Version ${info.version} is available. Downloading now...`,
    buttons: ['OK'],
  });
});

autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: `Version ${info.version} has been downloaded. The app will restart to install the update.`,
    buttons: ['Restart', 'Later'],
    defaultId: 0,
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err.message);
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

app.on('before-quit', () => {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (backupInterval) clearInterval(backupInterval);
});

ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('check-license', () => {
  const lic = checkLicense();
  const sessionData = loadSession();
  return {
    ...lic,
    hasSession: !!sessionData,
    sessionExpiresAt: sessionData?.expiresAt || null,
  };
});

ipcMain.handle('check-server', async () => {
  const running = await checkServerRunning();
  return { running, url: APP };
});

ipcMain.handle('api-login', async (_, { email, password }) => {
  try {
    const result = await apiFetch('/auth/login', { email, password, source: 'desktop' });
    if (result.ok && result.data.success && result.data.token) {
      const navigated = await navigateAndSetCookie(result.data.token, 7 * 24 * 60 * 60);
      return { ...result.data, _status: result.status, _navigated: navigated };
    }
    return { ...result.data, _status: result.status };
  } catch (e) {
    return { success: false, error: 'Cannot connect to BiasharaLedger server. Make sure the app is running and try again.' };
  }
});

ipcMain.handle('api-send-otp', async (_, { email }) => {
  try {
    const result = await apiFetch('/auth/send-signup-otp', { email, purpose: 'signup' });
    return result.data;
  } catch (e) {
    return { success: false, error: 'Cannot connect to BiasharaLedger server. Make sure the app is running and try again.' };
  }
});

ipcMain.handle('api-signup', async (_, { name, email, password, otp }) => {
  try {
    const parts = (name || '').trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    const result = await apiFetch('/auth/signup', { email, password, firstName, lastName, otp, source: 'desktop' });
    if (result.ok && (result.data.success || result.data.user) && result.data.token) {
      const navigated = await navigateAndSetCookie(result.data.token, 7 * 24 * 60 * 60);
      return { ...result.data, _status: result.status, _navigated: navigated };
    }
    return { ...result.data, _status: result.status };
  } catch (e) {
    return { success: false, error: 'Cannot connect to BiasharaLedger server. Make sure the app is running and try again.' };
  }
});

ipcMain.handle('api-verify-otp', async (_, { email, code }) => {
  try {
    const result = await apiFetch('/auth/verify-otp', { email, code, purpose: 'signup' });
    return result.data;
  } catch (e) {
    return { success: false, error: 'Cannot connect to BiasharaLedger server.' };
  }
});

ipcMain.handle('api-resend-otp', async (_, { email }) => {
  try {
    const result = await apiFetch('/auth/resend-otp', { email, purpose: 'signup' });
    return result.data;
  } catch (e) {
    return { success: false, error: 'Cannot connect to BiasharaLedger server.' };
  }
});

ipcMain.handle('navigate-dashboard', () => { navigateToDashboard(); });

ipcMain.handle('activate-license', async (_, { licenseKey, userEmail }) => {
  try {
    const os = require('os');
    const { execSync } = require('child_process');
    const comps = [os.cpus()[0]?.model || 'unknown', os.hostname(), os.platform(), os.arch()];
    try {
      const r = execSync('wmic bios get serialnumber 2>nul').toString().trim().split('\n').pop()?.trim();
      if (r && r !== 'SerialNumber') comps.push(r);
    } catch {}
    try {
      const r = execSync('wmic baseboard get serialnumber 2>nul').toString().trim().split('\n').pop()?.trim();
      if (r && r !== 'SerialNumber') comps.push(r);
    } catch {}
    try {
      const r = execSync('system_profiler SPHardwareDataType 2>/dev/null | grep "Serial Number" | awk \'{print $4}\'').toString().trim();
      if (r) comps.push(r);
    } catch {}
    try {
      const r = execSync('cat /sys/class/dmi/id/product_serial 2>/dev/null').toString().trim();
      if (r && r !== '0') comps.push(r);
    } catch {}
    const hw = crypto.createHash('sha256').update(comps.join('|')).digest('hex');

    // Use the new offline activate endpoint
    const res = await fetch(`${API}/offline/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey,
        hardwareFingerprint: hw,
        userEmail,
        deviceInfo: `${process.platform}-${os.arch()}-${os.release()}`,
      }),
    });
    const data = await res.json();
    if (data.success) {
      saveLicense({
        token: data.sessionToken,
        licenseKey,
        userEmail,
        hardwareFingerprint: hw,
        sessionToken: data.sessionToken,
      });
      saveSession({
        sessionToken: data.sessionToken,
        licenseKey,
        userEmail,
        hardwareFingerprint: hw,
        expiresAt: data.expiresAt,
      });
      doHeartbeat();
    }
    return data;
  } catch (e) { return { success: false, error: e.message || 'Activation failed' }; }
});

ipcMain.handle('check-session', async () => {
  const sessionData = loadSession();
  if (!sessionData?.sessionToken) {
    return { valid: false, reason: 'No session' };
  }
  try {
    const res = await fetch(`${API}/offline/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: sessionData.sessionToken,
        hardwareFingerprint: sessionData.hardwareFingerprint,
      }),
    });
    const data = await res.json();
    if (data.valid && data.expiresAt) {
      sessionData.expiresAt = data.expiresAt;
      saveSession(sessionData);
    }
    return data;
  } catch {
    return { valid: true, offline: true, daysRemaining: -1 };
  }
});

ipcMain.handle('clear-session', async () => {
  const sessionData = loadSession();
  clearSession();
  if (sessionData?.sessionToken) {
    try {
      await fetch(`${API}/sync/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: sessionData.sessionToken,
          licenseKey: sessionData.licenseKey || '',
          data: { action: 'logout', timestamp: new Date().toISOString() },
        }),
      });
    } catch {}
  }
  return { success: true };
});
