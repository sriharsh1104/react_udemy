const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('./config');
const connectDB = require('./config/database');
const routes = require('./routes');
const SocketService = require('./services/socketService');
const redisService = require('./services/redisService');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { HTTP_STATUS } = require('./constants');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Connect to Redis (non-blocking)
redisService.connect()
  .then((connected) => {
    if (connected) {
      // Wait a bit to ensure connection is fully established
      setTimeout(() => {
        if (redisService.isReady()) {
          console.log('✅ Redis: Connection established and ready for operations');
        } else {
          console.warn('⚠️ Redis: Connection attempted but not ready yet');
        }
      }, 1000);
    } else {
      console.warn('⚠️ Redis: Connection failed, continuing without Redis');
    }
  })
  .catch(err => {
    console.error('❌ Redis connection error:', err.message);
    console.warn('⚠️ Continuing without Redis - using database fallback');
  });

// Middleware
// CORS configuration - allow frontend URL from environment
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      config.cors.origin,
      process.env.FRONTEND_URL,
      'http://localhost:8081',
      'http://localhost:3000',
      'http://172.16.15.87:3001',
      'http://172.16.15.87:8081',
      /^http:\/\/172\.16\.\d+\.\d+:\d+$/, // Allow local network IPs
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Allow local network IPs
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/, // Allow local network IPs
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // Check if origin matches any allowed origin (including regex patterns)
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === '*' || allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json());
// Note: express.json() doesn't parse multipart/form-data, so multer can handle it

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Debug: Log all API requests with detailed information
app.use('/api', (req, res, next) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };
  
  // Log request body for POST/PUT requests (but limit size for security)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const bodyStr = JSON.stringify(req.body);
    logData.bodySize = bodyStr.length;
    // Only log body preview for large requests
    if (bodyStr.length < 500) {
      logData.bodyPreview = req.body;
    } else {
      logData.bodyPreview = 'Body too large to log';
    }
  }
  
  console.log(`[${timestamp}] 🌐 API REQUEST:`, logData);
  next();
});

// Root route - for health check and server info
app.get('/', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
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

// Initialize Socket.io with mobile-friendly settings
const io = require('socket.io')(server, {
  cors: config.cors,
  transports: ['websocket', 'polling'], // Support both transports for mobile
  pingTimeout: 60000, // 60 seconds - longer timeout for mobile networks
  pingInterval: 25000, // 25 seconds - keep connection alive
  upgradeTimeout: 30000, // 30 seconds for transport upgrade
  allowEIO3: true, // Support older clients
  maxHttpBufferSize: 1e8, // 100MB - for large file uploads
});

// Initialize Socket Service
new SocketService(io);

// Start server
server.listen(config.port, () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🚀 SERVER STARTED:`, {
    port: config.port,
    nodeEnv: process.env.NODE_ENV || 'development',
    baseUrl: process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${config.port}`,
  });
  console.log(`[${timestamp}] ✅ Socket.io server initialized and ready for connections`);
  
  // Check and display Redis connection status
  setTimeout(() => {
    if (redisService.isReady()) {
      console.log(`[${timestamp}] ✅ Redis: Connected and ready (Status: ${redisService.isConnected ? 'CONNECTED' : 'NOT CONNECTED'})`);
    } else {
      console.log(`[${timestamp}] ⚠️ Redis: Not connected - using database fallback`);
    }
  }, 1500);
});

module.exports = { app, server };
