const streakService = require('../services/streakService');
const userService = require('../services/userService');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../constants');

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
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.NO_TOKEN_PROVIDED || 'No token provided');
    }
    
    const userEmail = await userService.getUserByToken(token);
    if (!userEmail) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_OR_EXPIRED_TOKEN || 'Invalid or expired token');
    }
    
    req.userEmail = userEmail;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_VERIFICATION_FAILED || 'Token verification failed');
  }
};

class StreakController {
  // Get all active streaks for the current user
  getMyStreaks = [
    verifyToken,
    asyncHandler(async (req, res) => {
    const userEmail = req.userEmail;
    
    if (!userEmail) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'User email is required');
    }

    const streaks = await streakService.getUserStreaks(userEmail);
    
    return sendSuccess(res, HTTP_STATUS.OK, 'Streaks retrieved successfully', {
      streaks,
    });
    }),
  ];

  // Get streak between current user and a specific contact
  getStreakWithContact = [
    verifyToken,
    asyncHandler(async (req, res) => {
    const userEmail = req.userEmail;
    const { contactEmail } = req.query;
    
    if (!userEmail) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'User email is required');
    }

    if (!contactEmail) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Contact email is required');
    }

    const streak = await streakService.getStreakBetweenUsers(userEmail, contactEmail);
    
    return sendSuccess(res, HTTP_STATUS.OK, 'Streak retrieved successfully', {
      streak,
    });
    }),
  ];

  // Manually reset a streak (optional feature)
  resetStreak = [
    verifyToken,
    asyncHandler(async (req, res) => {
    const userEmail = req.userEmail;
    const { contactEmail } = req.body;
    
    if (!userEmail) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'User email is required');
    }

    if (!contactEmail) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Contact email is required');
    }

    const streak = await streakService.resetStreak(userEmail, contactEmail);
    
    return sendSuccess(res, HTTP_STATUS.OK, 'Streak reset successfully', {
      streak: {
        streakId: streak._id.toString(),
        streakCount: streak.streakCount,
        isActive: streak.isActive,
      },
    });
    }),
  ];
}

module.exports = new StreakController();

