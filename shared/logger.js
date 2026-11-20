// shared/logger.js  Structured JSON logs -> stdout -> CloudWatch Logs on Lambda
// Never log passwords, JWTs, invitation tokens, emails, dietary notes or request bodies.
// Requests are logged by ROUTE PATTERN (/api/invitations/:token), never by the real URL.
const SERVICE = process.env.SERVICE_NAME || 'local';
const SENSITIVE = /pass|token|secret|authorization|cookie|email|dietary|api[-_]?key/i;

function redact(value, depth = 0) {
  if (value === null || typeof value !== 'object' || depth > 4) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = SENSITIVE.test(k) ? '[redacted]' : redact(v, depth + 1);
  return out;
}

function write(level, msg, fields = {}) {
  const text = JSON.stringify({ level, msg, service: SERVICE, time: new Date().toISOString(), ...redact(fields) });
  if (level === 'error') console.error(text);
  else if (level === 'warn') console.warn(text);
  else console.log(text);
}

const logger = {
  info: (msg, fields) => write('info', msg, fields),
  warn: (msg, fields) => write('warn', msg, fields),
  error: (msg, fields) => write('error', msg, fields),
  // Security events get a fixed "event" key so a CloudWatch metric filter can count them.
  security: (event, fields) => write('warn', 'security', { event, ...fields })
};

function requestLogger(req, res, next) {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const route = req.route ? `${req.baseUrl || ''}${req.route.path}` : '(unmatched)';
    write(res.statusCode >= 500 ? 'error' : 'info', 'request', {
      requestId: req.id,
      method: req.method,
      route,
      status: res.statusCode,
      durationMs: Number((process.hrtime.bigint() - started) / 1000000n),
      userId: req.user ? req.user.userId : undefined
    });
  });
  next();
}

module.exports = { logger, requestLogger, redact };
