'use strict';

const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware:
 * Verifies JWT Bearer tokens on protected API routes and derives
 * authenticated user ID from the verified token.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lifequest_secret');
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  }

  return res.status(401).json({ success: false, message: 'Authorization token required' });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lifequest_secret');
        req.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
        };
        return next();
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
    }
  }

  req.user = null;
  return next();
}

module.exports = authMiddleware;
module.exports.auth = authMiddleware;
module.exports.optionalAuth = optionalAuth;
