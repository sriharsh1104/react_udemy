// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3001',
  PORT: process.env.PORT || 3001,
  CORS_ORIGIN: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '*',
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

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

module.exports = {
  API_CONFIG,
  SOCKET_CONFIG,
  ROUTES,
  HTTP_STATUS,
};

