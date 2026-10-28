const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();
const app = require('./src/app');
const { connectMongo, isMongoConnected } = require('./src/config/mongodb');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Attempt MongoDB connection
  try {
    await connectMongo();
  } catch (err) {
    console.error('[Startup] MongoDB connection error:', err.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 LifeQuest Backend Server running on port ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:${PORT}`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🏆 Wall of Fame Feed: http://localhost:${PORT}/api/posts`);
    console.log(`🥇 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
    console.log(`🎯 Trophy Room: http://localhost:${PORT}/api/trophy-room/me`);
    console.log(`🎯 BucketList API: http://localhost:${PORT}/api/bucketlist`);
    console.log(`🍃 MongoDB:    ${isMongoConnected() ? '✅ Active' : process.env.MONGODB_URI ? '❌ Connection Failed — check MONGODB_URI' : '⚠️  MONGODB_URI not set — using in-memory dev store'}`);
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
}

startServer();
