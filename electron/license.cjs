const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

function getLicensePath() {
  return path.join(app.getPath('userData'), 'license.json');
}

function getStoredLicense() {
  try {
    const data = fs.readFileSync(getLicensePath(), 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function validateLicense(licenseKey) {
  const stored = getStoredLicense();

  if (stored && stored.licenseKey === licenseKey) {
    return { valid: true, type: stored.licenseType || stored.type, expiryDate: stored.expiryDate, features: stored.features || [] };
  }

  try {
    const response = await fetch('https://api.biasharaledger.com/api/license/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey }),
    });
    const data = await response.json();
    return data;
  } catch {
    if (stored) {
      return { valid: true, offline: true, type: stored.licenseType || stored.type, expiryDate: stored.expiryDate };
    }
    return { valid: false, error: 'No internet and no cached license' };
  }
}

module.exports = { validateLicense, getStoredLicense, getLicensePath };
