const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set');
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: true },          // Neon: TLS, certificate verified
      max: Number(process.env.DB_POOL_MAX) || 2,  // Lambda handles one request at a time
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000              // Neon may need a few seconds to wake up
    });
    pool.on('error', () => { pool = undefined; }); // drop a broken pool, rebuilt on next call
  }
  return pool;
}

async function query(text, params = []) {
  return getPool().query(text, params);
}


async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { query, withTransaction };