const feedService = require('../services/feedService');
const userService = require('../services/userService');
const followService = require('../services/followService');
const User = require('../models/User');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHelper');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../constants');

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
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.NO_TOKEN_PROVIDED);
    }
    
    const userEmail = await userService.getUserByToken(token);
    if (!userEmail) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }
    
    req.userEmail = userEmail;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_VERIFICATION_FAILED);
  }
};

class FeedController {
  // Get Instagram-like feed
  getFeed = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { page = 1, limit = 10, feedMode = 'public' } = req.query;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const mode = feedMode === 'private' ? 'private' : 'public';

      const result = await feedService.getFeed(req.userEmail, pageNum, limitNum, mode);

      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.FEED_RETRIEVED_SUCCESSFULLY, result);
    }),
  ];

  // Toggle like on a status
  toggleLike = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { statusId } = req.body;
      
      if (!statusId) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Status ID is required');
      }

      const result = await feedService.toggleLike(statusId, req.userEmail);

      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LIKE_TOGGLED_SUCCESSFULLY, result);
    }),
  ];

  // Add comment to a status or reply to a comment
  addComment = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { statusId, comment, replyToCommentId } = req.body;
      
      if (!statusId) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Status ID is required');
      }

      if (!comment || comment.trim().length === 0) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Comment cannot be empty');
      }

      const result = await feedService.addComment(statusId, req.userEmail, comment, replyToCommentId || null);

      return sendSuccess(res, HTTP_STATUS.OK, result.isReply ? 'Reply added successfully' : SUCCESS_MESSAGES.COMMENT_ADDED_SUCCESSFULLY, {
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
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Status ID is required');
      }

      const comments = await feedService.getComments(statusId, req.userEmail);

      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.COMMENTS_RETRIEVED_SUCCESSFULLY, {
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
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Status ID is required');
      }

      const result = await feedService.updateCaption(statusId, req.userEmail, caption);

      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.CAPTION_UPDATED_SUCCESSFULLY, result);
    }),
  ];

  // Search profiles
  searchProfiles = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { query } = req.query;
      
      if (!query || query.trim().length === 0) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Search query is required');
      }

      const searchQuery = query.trim().toLowerCase();
      
      // Search users by name or email
      const users = await User.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
        ],
      })
        .select('email name isPrivate')
        .limit(20)
        .lean();

      // Get follow status for each user
      const profiles = await Promise.all(
        users.map(async (user) => {
          if (user.email === req.userEmail) {
            return null; // Skip own profile
          }
          
          const followStatus = await followService.getFollowStatus(req.userEmail, user.email);
          
          return {
            email: user.email,
            name: user.name || user.email.split('@')[0],
            isPrivate: user.isPrivate || false,
            followStatus: followStatus.status,
          };
        })
      );

      const filteredProfiles = profiles.filter(p => p !== null);

      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PROFILES_FOUND_SUCCESSFULLY, {
        profiles: filteredProfiles,
        total: filteredProfiles.length,
      });
    }),
  ];

  // Get user profile for visit
  getProfile = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { email } = req.body;
      
      if (!email) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'User email is required');
      }

      const user = await User.findOne({ email }).lean();
      if (!user) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
      }

      const followStatus = await followService.getFollowStatus(req.userEmail, email);
      const canView = await followService.canViewPosts(req.userEmail, email);

      // Get user's posts count (only if can view)
      const Status = require('../models/Status');
      const postsCount = canView 
        ? await Status.countDocuments({ 
            userEmail: email, 
            expiresAt: { $gt: new Date() } 
          })
        : 0;

      // Get followers and following counts
      const followersList = await followService.getFollowersList(email);
      const followingList = await followService.getFollowingList(email);

      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PROFILE_RETRIEVED_SUCCESSFULLY, {
        profile: {
          email: user.email,
          name: user.name || user.email.split('@')[0],
          isPrivate: user.isPrivate || false,
          followStatus: followStatus.status,
          canViewPosts: canView,
          postsCount,
          followersCount: followersList.length,
          followingCount: followingList.length,
        },
      });
    }),
  ];

  // Follow a user
  followUser = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { followingEmail } = req.body;
      
      if (!followingEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'User email is required');
      }

      if (followingEmail === req.userEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Cannot follow yourself');
      }

      const result = await followService.followUser(req.userEmail, followingEmail);

      if (result.success) {
        return sendSuccess(res, HTTP_STATUS.OK, result.message, {
          status: result.status,
        });
      } else {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, result.message);
      }
    }),
  ];

  // Unfollow a user
  unfollowUser = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { followingEmail } = req.body;
      
      if (!followingEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'User email is required');
      }

      const result = await followService.unfollowUser(req.userEmail, followingEmail);

      if (result.success) {
        return sendSuccess(res, HTTP_STATUS.OK, result.message);
      } else {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, result.message);
      }
    }),
  ];

  // Accept follow request
  acceptFollowRequest = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { followerEmail } = req.body;
      
      if (!followerEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Follower email is required');
      }

      const result = await followService.acceptFollowRequest(followerEmail, req.userEmail);

      if (result.success) {
        return sendSuccess(res, HTTP_STATUS.OK, result.message);
      } else {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, result.message);
      }
    }),
  ];

  // Reject follow request
  rejectFollowRequest = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { followerEmail } = req.body;
      
      if (!followerEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Follower email is required');
      }

      const result = await followService.rejectFollowRequest(followerEmail, req.userEmail);

      if (result.success) {
        return sendSuccess(res, HTTP_STATUS.OK, result.message);
      } else {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, result.message);
      }
    }),
  ];

  // Get pending follow requests
  getPendingRequests = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const requests = await followService.getPendingRequests(req.userEmail);
      
      // Get user info for each request
      const userEmails = requests.map(r => r.followerEmail);
      const users = await User.find({ email: { $in: userEmails } })
        .select('email name')
        .lean();
      
      const userMap = {};
      users.forEach(user => {
        userMap[user.email] = user.name || user.email.split('@')[0];
      });

      const requestsWithNames = requests.map(r => ({
        followerEmail: r.followerEmail,
        followerName: userMap[r.followerEmail] || r.followerEmail.split('@')[0],
        requestedAt: r.requestedAt,
      }));

      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PENDING_REQUESTS_RETRIEVED_SUCCESSFULLY, {
        requests: requestsWithNames,
      });
    }),
  ];

  // Toggle like on a comment or reply
  toggleCommentLike = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { statusId, commentId, isReply, replyId } = req.body;
      
      if (!statusId || !commentId) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Status ID and Comment ID are required');
      }

      const result = await feedService.toggleCommentLike(
        statusId, 
        commentId, 
        req.userEmail, 
        isReply || false, 
        replyId || null
      );

      return sendSuccess(res, HTTP_STATUS.OK, 'Like toggled successfully', result);
    }),
  ];

  // Pin/unpin a comment
  togglePinComment = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { statusId, commentId } = req.body;
      
      if (!statusId || !commentId) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Status ID and Comment ID are required');
      }

      const result = await feedService.togglePinComment(statusId, commentId, req.userEmail);

      return sendSuccess(res, HTTP_STATUS.OK, result.isPinned ? 'Comment pinned successfully' : 'Comment unpinned successfully', result);
    }),
  ];
}

module.exports = new FeedController();

