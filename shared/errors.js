// shared/errors.js  One error shape everywhere: { "error": { "code", "message" } }  [Lab 3 Part 4]
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details; // optional, safe-to-show detail; never secrets
  }
}

const badRequest = (message, details) => new AppError(400, 'VALIDATION_ERROR', message, details);
const unauthenticated = (message = 'Authentication required.') => new AppError(401, 'UNAUTHENTICATED', message);
const forbidden = (message = 'You do not have permission to do this.') => new AppError(403, 'FORBIDDEN', message);
const notFound = (message = 'Not found.') => new AppError(404, 'NOT_FOUND', message);
const conflict = (message, code = 'CONFLICT') => new AppError(409, code, message);
const unprocessable = (message) => new AppError(422, 'UNPROCESSABLE', message);
const tooManyRequests = (message = 'Too many requests. Please wait and try again.') =>
  new AppError(429, 'RATE_LIMITED', message);

function sendError(res, error) {
  const body = { error: { code: error.code, message: error.message } };
  if (error.details) body.error.details = error.details;
  return res.status(error.status).json(body);
}

module.exports = {
  AppError, badRequest, unauthenticated, forbidden, notFound, conflict, unprocessable, tooManyRequests, sendError
};
