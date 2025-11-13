const { HTTP_STATUS } = require('../constants');

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Optional data to include
 */
const sendSuccess = (res, statusCode = HTTP_STATUS.OK, message, data = null) => {
  const response = {
    success: true,
    status: statusCode,
    message,
  };
  
  if (data !== null) {
    Object.assign(response, data);
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
const sendError = (res, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message) => {
  return res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
  });
};

module.exports = {
  sendSuccess,
  sendError,
  HTTP_STATUS,
};

