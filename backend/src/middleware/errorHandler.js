function errorHandler(err, req, res, next) {
  console.error('❌ Server Error:', err.stack || err.message);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

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
