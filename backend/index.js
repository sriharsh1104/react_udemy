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

// Debug: Log all API requests
app.use('/api', (req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api', routes);

// Log registered routes after mounting
setTimeout(() => {
  console.log('\n=== Registered Routes ===');
  if (app._router && app._router.stack) {
    app._router.stack.forEach((middleware, index) => {
      if (middleware.route) {
        const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(', ');
        console.log(`${methods} ${middleware.route.path}`);
      } else if (middleware.name === 'router') {
        console.log(`Router mounted at: ${middleware.regexp}`);
      }
    });
  }
  console.log('========================\n');
}, 100);

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
