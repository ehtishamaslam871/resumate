require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const http = require('http');
const { initializeSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;

// Initialize server with async MongoDB connection
const initServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Database connection established');

    // Create HTTP server for Socket.IO
    const server = http.createServer(app);

    // Initialize Socket.IO
    const io = initializeSocket(server);

    // Make io accessible to routes
    app.set('io', io);

    server.listen(PORT, () => {
      console.log(`🚀 Node API listening on port ${PORT}`);
      console.log(`🔌 WebSocket server ready`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please:`);
        console.error(`   1. Kill the process using port ${PORT}`);
        console.error(`   2. Or change PORT in .env file to a different port`);
        process.exit(1);
      } else {
        throw err;
      }
    });

    // Export for testing
    module.exports = server;
  } catch (error) {
    console.error('❌ Server initialization failed:', error.message);
    process.exit(1);
  }
};

// Start server
initServer();
