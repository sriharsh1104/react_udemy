const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const notFoundHandler = (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  console.log('Available routes:', req.app._router?.stack?.length || 'unknown');
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};

