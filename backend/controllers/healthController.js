const { HTTP_STATUS } = require('../constants');

const getHealth = (req, res) => {
  res.status(HTTP_STATUS.OK).json({ 
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Chat server is running',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealth
};
