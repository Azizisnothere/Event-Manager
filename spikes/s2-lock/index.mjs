// Spike S2: is a row lock (SELECT ... FOR UPDATE) held across statements, Lambda on Floci -> Neon?
import pg from 'pg';

const connect = async () => {
  const c = new pg.Client({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: true } });
  await c.connect();
  return c;
};
const now = () => new Date().toISOString();

export const handler = async () => {
  const a = await connect();
  const b = await connect();
  try {
    await a.query('CREATE TABLE IF NOT EXISTS spike_probe (id int PRIMARY KEY)');
    await a.query('INSERT INTO spike_probe VALUES (1) ON CONFLICT DO NOTHING');

    const runA = (async () => {
      await a.query('BEGIN');
      await a.query('SELECT id FROM spike_probe WHERE id = 1 FOR UPDATE');
      const locked = now();
      await a.query('SELECT pg_sleep(3)');
      await a.query('COMMIT');
      return { locked, released: now() };
    })();
    await new Promise((r) => setTimeout(r, 300));
    const runB = (async () => {
      await b.query('BEGIN');
      const asked = now();
      await b.query('SELECT id FROM spike_probe WHERE id = 1 FOR UPDATE');
      const locked = now();
      await b.query('COMMIT');
      return { asked, locked };
    })();

    const [ra, rb] = await Promise.all([runA, runB]);
    const waited = (Date.parse(rb.locked) - Date.parse(rb.asked)) / 1000;
    const result = { pass: waited >= 2.5, bWaitedSeconds: waited, A: ra, B: rb, node: process.version };
    console.log(JSON.stringify(result));
    return result;
  } catch (error) {
    const result = { pass: false, error: error.message };
    console.log(JSON.stringify(result));
    return result;
  } finally {
    await a.end();
    await b.end();
  }
};
