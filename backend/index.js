const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('./config');
const connectDB = require('./config/database');
const routes = require('./routes');
const SocketService = require('./services/socketService');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
// CORS configuration - allow frontend URL from environment
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      config.cors.origin,
      process.env.FRONTEND_URL,
      'http://localhost:8081',
      'http://localhost:3000',
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
// Note: express.json() doesn't parse multipart/form-data, so multer can handle it

// Debug: Log all API requests
app.use('/api', (req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// Root route - for health check and server info
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Chat App Backend API is running!',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      docs: 'API endpoints are available under /api',
    },
    timestamp: new Date().toISOString(),
  });
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
