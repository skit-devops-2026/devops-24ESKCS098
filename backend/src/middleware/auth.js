'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lifequest_secret_key_2026';

/**
 * Mandatory Authentication Middleware
 * Requires either:
 *   1. Authorization: Bearer <valid_jwt>
 *   2. Explicit x-dev-user-id header (for automated CLI smoke tests)
 * Rejects unauthenticated requests with 401.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  }

  // Explicit dev testing header only (does NOT blindly hijack anonymous requests)
  if (req.headers['x-dev-user-id']) {
    const devUserId = parseInt(req.headers['x-dev-user-id'], 10) || 1;
    req.user = {
      id: devUserId,
      name: devUserId === 1 ? 'Alex Rivero (You)' : `User ${devUserId}`,
      email: devUserId === 1 ? 'alex@lifequest.app' : `user${devUserId}@lifequest.app`,
    };
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please sign in or create an account.',
  });
}

/**
 * Optional Authentication Middleware
 * Populates req.user if a valid token is provided, but allows guest access (req.user = null)
 * for public reading of community feeds and leaderboards.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch {
      // Ignore invalid token on optional routes; treat as guest
      req.user = null;
      return next();
    }
  }

  if (req.headers['x-dev-user-id']) {
    const devUserId = parseInt(req.headers['x-dev-user-id'], 10) || 1;
    req.user = {
      id: devUserId,
      name: devUserId === 1 ? 'Alex Rivero (You)' : `User ${devUserId}`,
      email: devUserId === 1 ? 'alex@lifequest.app' : `user${devUserId}@lifequest.app`,
    };
    return next();
  }

  req.user = null;
  return next();
}

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.optionalAuth = optionalAuth;
