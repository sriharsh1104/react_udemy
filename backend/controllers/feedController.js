const feedService = require('../services/feedService');
const userService = require('../services/userService');
const followService = require('../services/followService');
const User = require('../models/User');

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
      const { page = 1, limit = 10, feedMode = 'public' } = req.query;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const mode = feedMode === 'private' ? 'private' : 'public';

      const result = await feedService.getFeed(req.userEmail, pageNum, limitNum, mode);

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

  // Search profiles
  searchProfiles = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { query } = req.query;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
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

      res.json({
        success: true,
        profiles: filteredProfiles,
        total: filteredProfiles.length,
      });
    }),
  ];

  // Get user profile for visit
  getProfile = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'User email is required',
        });
      }

      const user = await User.findOne({ email }).lean();
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
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

      res.json({
        success: true,
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
        return res.status(400).json({
          success: false,
          message: 'User email is required',
        });
      }

      if (followingEmail === req.userEmail) {
        return res.status(400).json({
          success: false,
          message: 'Cannot follow yourself',
        });
      }

      const result = await followService.followUser(req.userEmail, followingEmail);

      res.json({
        success: result.success,
        message: result.message,
        status: result.status,
      });
    }),
  ];

  // Unfollow a user
  unfollowUser = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { followingEmail } = req.body;
      
      if (!followingEmail) {
        return res.status(400).json({
          success: false,
          message: 'User email is required',
        });
      }

      const result = await followService.unfollowUser(req.userEmail, followingEmail);

      res.json({
        success: result.success,
        message: result.message,
      });
    }),
  ];

  // Accept follow request
  acceptFollowRequest = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { followerEmail } = req.body;
      
      if (!followerEmail) {
        return res.status(400).json({
          success: false,
          message: 'Follower email is required',
        });
      }

      const result = await followService.acceptFollowRequest(followerEmail, req.userEmail);

      res.json({
        success: result.success,
        message: result.message,
      });
    }),
  ];

  // Reject follow request
  rejectFollowRequest = [
    verifyToken,
    asyncHandler(async (req, res) => {
      const { followerEmail } = req.body;
      
      if (!followerEmail) {
        return res.status(400).json({
          success: false,
          message: 'Follower email is required',
        });
      }

      const result = await followService.rejectFollowRequest(followerEmail, req.userEmail);

      res.json({
        success: result.success,
        message: result.message,
      });
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

      res.json({
        success: true,
        requests: requestsWithNames,
      });
    }),
  ];
}

module.exports = new FeedController();

