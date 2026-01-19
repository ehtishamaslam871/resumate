require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const http = require('http');
const { initializeSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;

connectDB();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io accessible to routes
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Node API listening on port ${PORT}`);
  console.log(`WebSocket server ready`);
});

// Export for testing
module.exports = server;
