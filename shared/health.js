// shared/health.js  GET /api/health -> proves the API and the database are reachable (proposal 3.5).
// 200 {status:'ok'} or 503 {status:'degraded'}; never returns error details or secrets.
const express = require('express');
const { query } = require('./db');

const router = express.Router();

router.get('/api/health', async (req, res) => {
  const checks = { api: 'ok', database: 'unknown' };
  try {
    await query('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }
  const healthy = checks.database === 'ok';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    checks,
    runtime: process.env.AWS_LAMBDA_FUNCTION_NAME ? 'lambda' : 'pc'
  });
});

module.exports = router;
