const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getAppVersion: () => ipcRenderer.invoke('get-version'),
  checkLicense: () => ipcRenderer.invoke('check-license'),
  checkServer: () => ipcRenderer.invoke('check-server'),
  login: (email, password) => ipcRenderer.invoke('api-login', { email, password }),
  sendOtp: (email) => ipcRenderer.invoke('api-send-otp', { email }),
  signup: (name, email, password, otp) => ipcRenderer.invoke('api-signup', { name, email, password, otp }),
  verifyOtp: (email, code) => ipcRenderer.invoke('api-verify-otp', { email, code }),
  resendOtp: (email) => ipcRenderer.invoke('api-resend-otp', { email }),
  activateLicense: (licenseKey, userEmail) => ipcRenderer.invoke('activate-license', { licenseKey, userEmail }),
  navigateToDashboard: () => ipcRenderer.invoke('navigate-dashboard'),
});
