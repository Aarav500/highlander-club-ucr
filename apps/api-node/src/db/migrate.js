const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env.example') });

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🔄 Running migrations...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Migrations complete — 9 tables created');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
