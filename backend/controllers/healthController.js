const { HTTP_STATUS } = require('../constants');
const userService = require('../services/userService');
const redisService = require('../services/redisService');
const mongoose = require('mongoose');

const getHealth = (req, res) => {
  const memoryUsage = process.memoryUsage();
  const dbState = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  const socketStats = userService.getMemoryStats();
  
  // Check Redis status
  const redisStatus = {
    connected: redisService.isReady(),
    status: redisService.isReady() ? 'connected' : 'disconnected',
    url: process.env.REDIS_URL ? process.env.REDIS_URL.replace(/:[^:@]+@/, ':****@') : 'redis://localhost:6379',
  };
  
  res.status(HTTP_STATUS.OK).json({ 
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Chat server is running',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStates[dbState] || 'unknown',
      readyState: dbState,
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A',
    },
    redis: redisStatus,
    memory: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    },
    sockets: socketStats,
    uptime: `${Math.round(process.uptime())} seconds`,
  });
};

module.exports = {
  getHealth
};
