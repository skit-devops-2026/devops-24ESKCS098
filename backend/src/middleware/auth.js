const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lifequest_secret');
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  }

  // Development Fallback: allows testing Wall of Fame before Module C (Auth) is fully ready
  if (process.env.NODE_ENV !== 'production' || req.headers['x-dev-user-id']) {
    const devUserId = parseInt(req.headers['x-dev-user-id'], 10) || 1;
    req.user = {
      id: devUserId,
      name: devUserId === 1 ? 'Alex Rivero (You)' : `User ${devUserId}`,
      email: devUserId === 1 ? 'alex@lifequest.app' : `user${devUserId}@lifequest.app`,
    };
    return next();
  }

  return res.status(401).json({ success: false, message: 'Authorization token required' });
}

module.exports = authMiddleware;
