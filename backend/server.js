require('dotenv').config();
const app = require('./src/app');
const { isPgConnected } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 LifeQuest Backend Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🏆 Wall of Fame Feed: http://localhost:${PORT}/api/posts`);
  console.log(`🥇 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
  console.log(`🎯 Trophy Room: http://localhost:${PORT}/api/trophy-room/me`);
  console.log(`💾 Database Mode: ${isPgConnected() ? 'PostgreSQL Active' : 'In-Memory Dev Store Active (Seamless)'}`);
  console.log(`===============================================`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
