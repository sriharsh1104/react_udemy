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
  
  // Get available routes for better error message
  const availableRoutes = [];
  if (req.app && req.app._router && req.app._router.stack) {
    req.app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(', ');
        availableRoutes.push(`${methods} ${middleware.route.path}`);
      } else if (middleware.name === 'router' && middleware.regexp) {
        // This is a router, routes are under /api
        availableRoutes.push('Router: /api/*');
      }
    });
  }
  
  console.log('Available routes:', availableRoutes.length > 0 ? availableRoutes.join(', ') : 'unknown');
  
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    hint: 'API endpoints are available under /api. Try /api/health for health check.',
    availableRoutes: availableRoutes.length > 0 ? availableRoutes.slice(0, 10) : ['GET /', 'GET /api/health']
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};

