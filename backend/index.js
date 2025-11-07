const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const SocketService = require('./services/socketService');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Initialize Socket.io
const io = require('socket.io')(server, {
  cors: config.cors
});

// Initialize Socket Service
new SocketService(io);

// Start server
server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

module.exports = { app, server };
