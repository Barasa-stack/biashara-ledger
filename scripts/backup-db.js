const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupDir = path.resolve(__dirname, '..', 'backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const dbName = process.env.PGDATABASE || 'biashara_ledger';
const backupFile = path.join(backupDir, `${dbName}-${date}.sql`);
const user = process.env.PGUSER || 'postgres';

console.log(`\n=== Database Backup ===`);
console.log(`Database: ${dbName}`);
console.log(`Backup file: ${backupFile}\n`);

exec(`pg_dump -U ${user} ${dbName} > "${backupFile}"`, (err, stdout, stderr) => {
  if (err) {
    console.error('❌ Backup failed:', err.message);
    if (stderr) console.error('stderr:', stderr);
    process.exit(1);
  }
  console.log('✅ Database backup completed successfully!');
  console.log(`📁 File: ${backupFile}`);

  const stats = fs.statSync(backupFile);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`📦 Size: ${sizeKB} KB`);

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const oldBackups = fs.readdirSync(backupDir).filter(f => {
    const fp = path.join(backupDir, f);
    return fs.statSync(fp).mtimeMs < oneWeekAgo;
  });

  if (oldBackups.length > 0) {
    console.log(`\n🧹 Cleaning ${oldBackups.length} backup(s) older than 7 days...`);
    for (const f of oldBackups) {
      fs.unlinkSync(path.join(backupDir, f));
    }
    console.log('✅ Old backups removed');
  }
});
