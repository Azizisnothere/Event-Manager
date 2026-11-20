const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { requestLogger, logger } = require('./logger');
const { AppError, sendError } = require('./errors');

function corsOrigins() {
  return (process.env.CORS_ORIGINS || 'http://localhost:8080').split(',').map((o) => o.trim()).filter(Boolean);
}

// routers: express.Router() objects that use FULL paths (/api/...).
// largeBodyPaths: regexes of routes allowed 64 KB (pasted CSV guest list) instead of 10 KB.
function createApp(routers, { largeBodyPaths = [] } = {}) {
  const app = express();
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    res.set('X-Request-Id', req.id);
    next();
  });
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({
    origin: corsOrigins(),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Turnstile-Token'],
    maxAge: 600
  }));

  const smallJson = express.json({ limit: '10kb' });
  const largeJson = express.json({ limit: '64kb' });
  app.use((req, res, next) => (largeBodyPaths.some((re) => re.test(req.path)) ? largeJson : smallJson)(req, res, next));

  // 415 when a body is sent that is not JSON  [Lab 4 Part 3]
  app.use((req, res, next) => {
    const hasBody = Number(req.get('content-length') || 0) > 0 || req.get('transfer-encoding');
    if (['POST', 'PATCH', 'PUT'].includes(req.method) && hasBody && !req.is('application/json')) {
      return next(new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.'));
    }
    return next();
  });

  for (const router of routers) app.use(router);

  app.use((req, res) => res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found.' } }));

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (error instanceof AppError) return sendError(res, error);
    if (error.type === 'entity.parse.failed') {
      return sendError(res, new AppError(400, 'VALIDATION_ERROR', 'Request body is not valid JSON.'));
    }
    if (error.type === 'entity.too.large') {
      return sendError(res, new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.'));
    }
    // Unexpected error: details only in the logs; the client gets a generic message (proposal 5.1).
    logger.error('unhandled error', { requestId: req.id, error: error.message, stack: error.stack });
    return sendError(res, new AppError(500, 'INTERNAL_ERROR', 'An unexpected server error occurred.'));
  });

  return app;
}

module.exports = { createApp };