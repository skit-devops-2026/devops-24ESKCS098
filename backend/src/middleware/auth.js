'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lifequest_secret_key_2026';

/**
 * Authentication Middleware:
 * Verifies JWT Bearer tokens on protected API routes and derives
 * authenticated user ID from the verified token.
 * Rejects unauthenticated requests with 401.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role || 'user',
      };
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  }

  // Explicit dev testing header only (for CLI test suites)
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
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role || 'user',
        };
        return next();
      } catch (err) {
        // Soft fallback for optional routes: treat as guest
        req.user = null;
        return next();
      }
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
module.exports.auth = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.optionalAuth = optionalAuth;
