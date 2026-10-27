function errorHandler(err, req, res, next) {
  console.error('❌ Server Error:', err.stack || err.message);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Map known MongoDB / Mongoose errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Resource already exists: duplicate value for ${field}.`,
    });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ') || 'Validation error',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for ${err.path}: ${err.value}`,
    });
  }

  // Map known PostgreSQL error codes
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Resource already exists (duplicate key).' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced foreign entity does not exist.' });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
