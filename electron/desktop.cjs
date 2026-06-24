const { app, BrowserWindow } = require('electron');
const path = require('path');

const SERVER_URL = 'http://localhost:3000';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 960, minHeight: 600,
    icon: path.join(__dirname, '..', 'public', 'favicon.svg'),
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
    },
    show: false, backgroundColor: '#ffffff',
    title: 'BiasharaLedger',
  });

  mainWindow.loadURL(SERVER_URL);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });

  // Prevent navigation away
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('http://localhost')) e.preventDefault();
  });
}

app.whenReady().then(createWindow);
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
