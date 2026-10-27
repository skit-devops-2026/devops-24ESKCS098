const express = require('express');
const cors = require('cors');
const path = require('path');
const postRoutes = require('./routes/postRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const trophyRoomRoutes = require('./routes/trophyRoomRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const commentRoutes = require('./routes/commentRoutes');
const bucketlistRoutes = require('./routes/bucketlistRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow Vite frontend during development
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-user-id'],
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check — returns running commit SHA
const COMMIT_SHA = process.env.RENDER_GIT_COMMIT || process.env.COMMIT_SHA || 'dev';

const healthResponse = () => ({
  status: 'ok',
  service: 'LifeQuest Wall of Fame API',
  commit: COMMIT_SHA,
  timestamp: new Date().toISOString(),
});

app.get('/health', (req, res) => res.json(healthResponse()));
app.get('/api/health', (req, res) => res.json(healthResponse()));

// Mount Routes
app.use('/api/posts', postRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/trophy-room', trophyRoomRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/bucketlist', bucketlistRoutes);

// Serve the built frontend in production
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// SPA fallback — serve index.html for non-API routes
app.get(/^(?!\/api).*/, (req, res, next) => {
  const indexPath = path.join(publicDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next(); // fall through to 404 if file missing
  });
});

// 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;

