// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3001',
  PORT: process.env.PORT || 3001,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Socket Configuration
const SOCKET_CONFIG = {
  CORS: {
    origin: API_CONFIG.CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  PING_TIMEOUT: 60000,
  PING_INTERVAL: 25000,
};

// API Routes
const ROUTES = {
  HEALTH: '/api/health',
  BASE: '/api',
};

module.exports = {
  API_CONFIG,
  SOCKET_CONFIG,
  ROUTES,
};

