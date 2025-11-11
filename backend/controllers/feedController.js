const feedService = require('../services/feedService');
const userService = require('../services/userService');

// Helper to wrap async handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware to verify token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const userEmail = await userService.getUserByToken(token);
    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    req.userEmail = userEmail;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ success: false, message: 'Token verification failed' });
  }
};

class FeedController {
  // Get Instagram-like feed
  getFeed = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      const result = await feedService.getFeed(req.userEmail, pageNum, limitNum);

      res.json({
        success: true,
        ...result,
      });
    }),
  ];

  // Toggle like on a status
  toggleLike = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { statusId } = req.body;
      
      if (!statusId) {
        return res.status(400).json({
          success: false,
          message: 'Status ID is required',
        });
      }

      const result = await feedService.toggleLike(statusId, req.userEmail);

      res.json({
        success: true,
        ...result,
      });
    }),
  ];

  // Add comment to a status
  addComment = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { statusId, comment } = req.body;
      
      if (!statusId) {
        return res.status(400).json({
          success: false,
          message: 'Status ID is required',
        });
      }

      if (!comment || comment.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment cannot be empty',
        });
      }

      const result = await feedService.addComment(statusId, req.userEmail, comment);

      res.json({
        success: true,
        comment: result,
      });
    }),
  ];

  // Get comments for a status
  getComments = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { statusId } = req.params;
      
      if (!statusId) {
        return res.status(400).json({
          success: false,
          message: 'Status ID is required',
        });
      }

      const comments = await feedService.getComments(statusId, req.userEmail);

      res.json({
        success: true,
        comments,
      });
    }),
  ];

  // Update caption
  updateCaption = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { statusId, caption } = req.body;
      
      if (!statusId) {
        return res.status(400).json({
          success: false,
          message: 'Status ID is required',
        });
      }

      const result = await feedService.updateCaption(statusId, req.userEmail, caption);

      res.json({
        success: true,
        ...result,
      });
    }),
  ];
}

module.exports = new FeedController();

