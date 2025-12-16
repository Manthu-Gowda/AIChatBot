#!/usr/bin/env node
const cp = require('child_process');
const path = require('path');

const AUTO = (process.env.AUTO_MIGRATE || '').toLowerCase();
const STRATEGY = (process.env.MIGRATION_STRATEGY || 'deploy').toLowerCase();

function run(cmd) {
  console.log('[startup] running:', cmd);
  cp.execSync(cmd, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
}

try {
  if (AUTO === 'true' || AUTO === '1') {
    console.log('[startup] AUTO_MIGRATE enabled — applying migrations (strategy=' + STRATEGY + ')');
    if (STRATEGY === 'push') {
      run('npx prisma db push');
    } else {
      // default to safe production workflow: apply already-created migrations
      run('npx prisma migrate deploy');
    }
  } else {
    console.log('[startup] AUTO_MIGRATE not enabled — skipping automatic migrations.');
  }
} catch (err) {
  console.error('[startup] Migration command failed. Aborting startup.');
  console.error(err && err.message ? err.message : err);
  process.exit(1);
}

// Launch the compiled server
require(path.resolve(__dirname, '..', 'dist', 'src', 'app.js'));
