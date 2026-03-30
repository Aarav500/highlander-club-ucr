const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
// Support both local .env and Railway environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

async function migrate() {
  const ssl = process.env.DATABASE_URL?.includes('railway') || process.env.DATABASE_URL?.includes('postgres')
    ? { rejectUnauthorized: false }
    : false;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });

  try {
    console.log('🔄 Running base schema migration...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Base schema applied');

    console.log('🔄 Running V3 CAS auth migration...');
    const v3 = fs.readFileSync(path.join(__dirname, 'migrate-v3-cas-auth.sql'), 'utf8');
    await pool.query(v3);
    console.log('✅ V3 CAS auth migration applied');

    console.log('✅ All migrations complete');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
