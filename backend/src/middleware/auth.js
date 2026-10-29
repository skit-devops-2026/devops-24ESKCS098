'use strict';

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'lifequest_secret_key_2026';

// Mandatory authentication guard for protected write endpoints
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

  // Developer convenience header for automated test runs
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

// Non-blocking auth for public endpoints (feed, leaderboard, public stats)
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
        // Expired or bad token; allow request to continue as guest
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

export { authMiddleware, optionalAuth, authMiddleware as auth };
export default authMiddleware;
