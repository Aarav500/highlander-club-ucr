const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

// SSL: respect explicit env var, or auto-detect for known cloud providers
function getSslConfig() {
  const sslEnv = process.env.DATABASE_SSL;
  if (sslEnv === 'true') return { rejectUnauthorized: false };
  if (sslEnv === 'false') return false;
  const dbUrl = process.env.DATABASE_URL || '';
  return (dbUrl.includes('railway') || dbUrl.includes('neon') || dbUrl.includes('supabase'))
    ? { rejectUnauthorized: false }
    : false;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: getSslConfig(),
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
  process.exit(1);
});

module.exports = pool;
