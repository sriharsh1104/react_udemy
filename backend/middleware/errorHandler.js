const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};

