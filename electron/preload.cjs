const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getVersion: () => ipcRenderer.invoke('get-version'),
  validateLicense: (key) => ipcRenderer.invoke('validate-license', key),
  activateLicense: (data) => ipcRenderer.invoke('activate-license', data),
  onUpdateStatus: (cb) => ipcRenderer.on('update-status', (_, status) => cb(status)),
});
