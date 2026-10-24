const express = require('express');
const cors = require('cors');
const postRoutes = require('./routes/postRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const trophyRoomRoutes = require('./routes/trophyRoomRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const commentRoutes = require('./routes/commentRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow Vite frontend during development
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LifeQuest Wall of Fame API',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/posts', postRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/trophy-room', trophyRoomRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/comments', commentRoutes);

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
