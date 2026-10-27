/**
 * Standalone migration runner.
 * Runs only the additive migrations without touching seed data.
 * Usage: node src/db/migrate.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  const client = await pool.connect();
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      console.log(`🔄 Running migration: ${file}`);
      await client.query(sql);
      console.log(`✅ Migration applied: ${file}`);
    }
    console.log('🎉 All migrations complete.');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
