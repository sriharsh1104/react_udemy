// Load environment-specific .env file
const path = require('path');
const envFile = process.env.NODE_ENV === 'staging' ? '.env.staging' : '.env';
require('dotenv').config({ path: path.resolve(__dirname, '..', envFile) });

const { API_CONFIG, SOCKET_CONFIG } = require('../constants');

module.exports = {
  port: API_CONFIG.PORT,
  cors: SOCKET_CONFIG.CORS
};

