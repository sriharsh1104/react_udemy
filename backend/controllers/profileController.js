const userProfileService = require('../services/userProfileService');
const userService = require('../services/userService');
const followService = require('../services/followService');
const cacheService = require('../services/cacheService');
const User = require('../models/User');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHelper');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../constants');

class ProfileController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      
      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH_REQUIRED);
      }

      const email = await userService.getUserByToken(token);
      if (!email) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
      }

      // Check cache first
      const cacheKey = cacheService.keys.userProfile(email);
      let cachedData = cacheService.get(cacheKey);
      
      if (cachedData) {
        return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PROFILE_RETRIEVED_SUCCESSFULLY_CACHED, cachedData);
      }

      const profile = await userProfileService.getProfileByEmail(email);
      
      // Get follower and following counts
      const followersList = await followService.getFollowersList(email);
      const followingList = await followService.getFollowingList(email);
      
      // Get user details for following list
      const followingUsers = await User.find({ email: { $in: followingList } })
        .select('email name')
        .lean();
      
      const followingListWithDetails = followingUsers.map(user => ({
        email: user.email,
        name: user.name || user.email.split('@')[0],
      }));
      
      // Get user details for followers list
      const followersUsers = await User.find({ email: { $in: followersList } })
        .select('email name')
        .lean();
      
      const followersListWithDetails = followersUsers.map(user => ({
        email: user.email,
        name: user.name || user.email.split('@')[0],
      }));
      
      if (!profile) {
        // Create default profile if doesn't exist
        const newProfile = await userProfileService.createOrUpdateProfile(email, {});
        const isComplete = await userProfileService.isProfileComplete(email);
        const responseData = {
          profile: { 
            ...newProfile, 
            isProfileComplete: isComplete,
            followersCount: followersList.length,
            followingCount: followingList.length,
            followingList: followingListWithDetails,
            followersList: followersListWithDetails,
          },
        };
        
        // Cache the response (5 minutes TTL)
        cacheService.set(cacheKey, responseData, 5 * 60 * 1000);
        
        return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PROFILE_RETRIEVED_SUCCESSFULLY, responseData);
      }

      const isComplete = await userProfileService.isProfileComplete(email);
      const responseData = {
        profile: { 
          ...profile, 
          isProfileComplete: isComplete,
          followersCount: followersList.length,
          followingCount: followingList.length,
          followingList: followingListWithDetails,
          followersList: followersListWithDetails,
        },
      };
      
      // Cache the response (5 minutes TTL)
      cacheService.set(cacheKey, responseData, 5 * 60 * 1000);
      
      return sendSuccess(res, HTTP_STATUS.OK, 'Profile retrieved successfully', responseData);
    } catch (error) {
      console.error('Error in getProfile:', error);
      console.error('Error stack:', error.stack);
      const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }

  // Get contact profile by email
  async getContactProfile(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { email } = req.body;
      
      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH_REQUIRED);
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
      }

      if (!email) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email is required');
      }

      const profile = await userProfileService.getProfileByEmail(email);
      
      if (!profile) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROFILE_NOT_FOUND);
      }

      // Return profile with phone numbers (but exclude sensitive data)
      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PROFILE_RETRIEVED_SUCCESSFULLY, {
        profile: {
          email: profile.email,
          name: profile.name,
          phoneNumbers: profile.phoneNumbers || [],
          age: profile.age,
        },
      });
    } catch (error) {
      console.error('Error in getContactProfile:', error);
      const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] 📝 UPDATE PROFILE REQUEST:`, {
        method: req.method,
        url: req.url,
        headers: {
          authorization: req.headers.authorization ? 'Bearer ***' : 'missing',
          contentType: req.headers['content-type'],
        },
        body: req.body,
        query: req.query,
      });

      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { name, age, phoneNumbers } = req.body;

      console.log(`[${timestamp}] 🔑 Token extracted:`, {
        fromHeader: !!req.headers.authorization,
        fromBody: !!req.body.token,
        tokenPresent: !!token,
      });

      if (!token) {
        console.error(`[${timestamp}] ❌ No token provided`);
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH_REQUIRED);
      }

      const email = await userService.getUserByToken(token);
      console.log(`[${timestamp}] 👤 User email from token:`, email);
      
      if (!email) {
        console.error(`[${timestamp}] ❌ Invalid token - user not found`);
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
      }

      // Validate phone numbers (max 2)
      if (phoneNumbers && phoneNumbers.length > 2) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Maximum 2 phone numbers allowed');
      }

      // Validate phone numbers format
      if (phoneNumbers) {
        for (const phone of phoneNumbers) {
          if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
            return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid phone number format');
          }
        }
      }

      try {
        const profile = await userProfileService.createOrUpdateProfile(email, {
          name,
          age: age ? parseInt(age) : null,
          phoneNumbers: phoneNumbers || [],
        });

        const isComplete = await userProfileService.isProfileComplete(email);
        
        // Get follower and following counts
        const followersList = await followService.getFollowersList(email);
        const followingList = await followService.getFollowingList(email);
        
        // Get user details for following list
        const followingUsers = await User.find({ email: { $in: followingList } })
          .select('email name')
          .lean();
        
        const followingListWithDetails = followingUsers.map(user => ({
          email: user.email,
          name: user.name || user.email.split('@')[0],
        }));
        
        // Get user details for followers list
        const followersUsers = await User.find({ email: { $in: followersList } })
          .select('email name')
          .lean();
        
        const followersListWithDetails = followersUsers.map(user => ({
          email: user.email,
          name: user.name || user.email.split('@')[0],
        }));

        // Invalidate cache for this user's profile
        const cacheKey = cacheService.keys.userProfile(email);
        cacheService.delete(cacheKey);
        
        // Also invalidate contact profile cache if this profile is viewed by others
        const contactCacheKey = cacheService.keys.contactProfile(email);
        cacheService.delete(contactCacheKey);
        
        console.log(`[${timestamp}] ✅ Profile updated successfully for:`, email);
        return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PROFILE_UPDATED_SUCCESSFULLY, {
          profile: { 
            ...profile, 
            isProfileComplete: isComplete,
            followersCount: followersList.length,
            followingCount: followingList.length,
            followingList: followingListWithDetails,
            followersList: followersListWithDetails,
          },
        });
      } catch (profileError) {
        // Handle validation errors from userProfileService
        if (profileError.message.includes('Duplicate phone numbers') || 
            profileError.message.includes('already registered')) {
          return sendError(res, HTTP_STATUS.BAD_REQUEST, profileError.message);
        }
        throw profileError; // Re-throw if it's a different error
      }
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ❌ Error in updateProfile:`, error);
      console.error(`[${timestamp}] ❌ Error stack:`, error.stack);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }
}

module.exports = new ProfileController();

