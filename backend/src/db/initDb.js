const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initDb() {
  console.log('🔄 Initializing LifeQuest PostgreSQL database...');
  const client = await pool.connect();
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');

    console.log('📦 Executing schema.sql...');
    await client.query(schemaSql);
    console.log('✅ Tables created successfully.');

    console.log('🌱 Executing seed.sql...');
    await client.query(seedSql);
    console.log('✅ Seed data inserted successfully.');

    console.log('🎉 Database initialization complete!');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  initDb();
}

module.exports = { initDb };
