const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');

const API = 'http://localhost:3000/api';
const APP = 'http://localhost:3000';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

let mainWindow;

function getLicensePath() {
  return path.join(app.getPath('userData'), 'license.json');
}

function checkLicense() {
  try {
    const p = getLicensePath();
    if (!fs.existsSync(p)) return { valid: false, reason: 'no-license' };
    const lic = JSON.parse(fs.readFileSync(p, 'utf8'));
    const now = Date.now();
    if (now - lic.activatedAt > SEVEN_DAYS) return { valid: false, reason: 'expired' };
    return { valid: true, daysRemaining: Math.ceil((SEVEN_DAYS - (now - lic.activatedAt)) / 86400000) };
  } catch { return { valid: false, reason: 'error' }; }
}

function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:3000/api/health', (res) => {
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
      sameSite: 'lax',
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
    // Set cookie in session store
    await injectSessionCookie(token, maxAge);
    const verified = await verifySessionCookie();
    if (verified) {
      // Navigate after cookie is confirmed set
      navigateToDashboard();
      // Also inject via JS in case session/renderer cookie stores are desynced
      const expSeconds = Math.floor(Date.now() / 1000) + maxAge;
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(
          `document.cookie = 'bl_session=${token}; path=/; max-age=${maxAge}; samesite=lax;'; true`,
        ).catch(() => {});
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function saveLicense(data) {
  fs.writeFileSync(getLicensePath(), JSON.stringify({
    token: data.token,
    licenseKey: data.licenseKey,
    userId: data.userId,
    userEmail: data.userEmail,
    activatedAt: Date.now(),
    ...data,
  }));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 960, minHeight: 600,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false, contextIsolation: true, sandbox: false,
    },
    show: false, backgroundColor: '#0a0a0a',
  });

  const lic = checkLicense();
  if (lic.valid) {
    mainWindow.loadURL(`${APP}/dashboard`);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'offline-login.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });

  setInterval(() => {
    if (!checkLicense().valid && mainWindow) {
      mainWindow.loadFile(path.join(__dirname, 'offline-login.html'));
    }
  }, 3600000);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('check-license', () => checkLicense());

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
    return { success: false, error: 'Cannot connect to BiasharaLedger server. Make sure the app is running (npm run dev) and try again.' };
  }
});

ipcMain.handle('api-send-otp', async (_, { email }) => {
  try {
    const result = await apiFetch('/auth/send-signup-otp', { email, purpose: 'signup' });
    return result.data;
  } catch (e) {
    return { success: false, error: 'Cannot connect to BiasharaLedger server. Make sure the app is running (npm run dev) and try again.' };
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
    return { success: false, error: 'Cannot connect to BiasharaLedger server. Make sure the app is running (npm run dev) and try again.' };
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
    try { const r = execSync('wmic bios get serialnumber 2>nul').toString().trim().split('\n').pop()?.trim(); if (r && r !== 'SerialNumber') comps.push(r); } catch {}
    try { const r = execSync('wmic baseboard get serialnumber 2>nul').toString().trim().split('\n').pop()?.trim(); if (r && r !== 'SerialNumber') comps.push(r); } catch {}
    const hw = crypto.createHash('sha256').update(comps.join('|')).digest('hex');

    const res = await fetch(`${API}/license/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey, hardwareFingerprint: hw, userEmail }),
    });
    const data = await res.json();
    if (data.success) {
      saveLicense({ ...data, licenseKey, userEmail, hardwareFingerprint: hw, userId: data.userId || userEmail });
    }
    return data;
  } catch (e) { return { success: false, error: e.message || 'Activation failed' }; }
});
