/**
 * errorHandler.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Express global error-handling middleware.
 * Catches anything passed to next(err) or thrown inside async handlers.
 */

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', err.message);

  // Errors originating from the Python microservice
  if (err.isPythonError) {
    return res.status(502).json({ error: err.message });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Mongoose cast errors (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for field: ${err.path}` });
  }

  // Generic fallback
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({ error: err.message || 'Internal server error' });
};
