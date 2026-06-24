const { app } = require('electron');
const path = require('path');
const fs = require('fs');

function getDbPath() {
  const dir = path.join(app.getPath('userData'), 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function initLocalDatabase() {
  console.log('Local DB: using server-side PostgreSQL (no local SQLite)');
  return true;
}

module.exports = { initLocalDatabase, getDbPath };
