const Follow = require('../models/Follow');
const User = require('../models/User');

class FollowService {
  // Follow a user (handles both public and private accounts)
  async followUser(followerEmail, followingEmail) {
    try {
      if (followerEmail === followingEmail) {
        throw new Error('Cannot follow yourself');
      }

      // Check if already following
      const existingFollow = await Follow.findOne({
        followerEmail,
        followingEmail,
      });

      if (existingFollow) {
        if (existingFollow.status === 'accepted') {
          return { success: false, message: 'Already following this user', alreadyFollowing: true };
        }
        if (existingFollow.status === 'pending') {
          return { success: false, message: 'Follow request already sent', requestPending: true };
        }
      }

      // Check if target user exists
      const targetUser = await User.findOne({ email: followingEmail });
      if (!targetUser) {
        throw new Error('User not found');
      }

      // Determine status based on account privacy
      const status = targetUser.isPrivate ? 'pending' : 'accepted';
      const acceptedAt = targetUser.isPrivate ? null : new Date();

      // Create follow relationship
      const follow = new Follow({
        followerEmail,
        followingEmail,
        status,
        requestedAt: new Date(),
        acceptedAt,
      });

      await follow.save();

      return {
        success: true,
        status,
        message: targetUser.isPrivate 
          ? 'Follow request sent' 
          : 'Successfully followed',
        followId: follow._id.toString(),
      };
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  // Unfollow a user
  async unfollowUser(followerEmail, followingEmail) {
    try {
      const follow = await Follow.findOneAndDelete({
        followerEmail,
        followingEmail,
      });

      if (!follow) {
        return { success: false, message: 'Not following this user' };
      }

      return {
        success: true,
        message: 'Unfollowed successfully',
      };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  // Accept follow request
  async acceptFollowRequest(followerEmail, followingEmail) {
    try {
      const follow = await Follow.findOne({
        followerEmail,
        followingEmail,
        status: 'pending',
      });

      if (!follow) {
        throw new Error('Follow request not found');
      }

      follow.status = 'accepted';
      follow.acceptedAt = new Date();
      await follow.save();

      return {
        success: true,
        message: 'Follow request accepted',
      };
    } catch (error) {
      console.error('Error accepting follow request:', error);
      throw error;
    }
  }

  // Reject follow request
  async rejectFollowRequest(followerEmail, followingEmail) {
    try {
      const follow = await Follow.findOneAndDelete({
        followerEmail,
        followingEmail,
        status: 'pending',
      });

      if (!follow) {
        return { success: false, message: 'Follow request not found' };
      }

      return {
        success: true,
        message: 'Follow request rejected',
      };
    } catch (error) {
      console.error('Error rejecting follow request:', error);
      throw error;
    }
  }

  // Get follow status between two users
  async getFollowStatus(followerEmail, followingEmail) {
    try {
      if (followerEmail === followingEmail) {
        return { status: 'self' };
      }

      const follow = await Follow.findOne({
        followerEmail,
        followingEmail,
      });

      if (!follow) {
        return { status: 'not_following' };
      }

      return {
        status: follow.status,
        requestedAt: follow.requestedAt,
        acceptedAt: follow.acceptedAt,
      };
    } catch (error) {
      console.error('Error getting follow status:', error);
      throw error;
    }
  }

  // Get list of users that a user follows (accepted only)
  async getFollowingList(userEmail) {
    try {
      const follows = await Follow.find({
        followerEmail: userEmail,
        status: 'accepted',
      }).lean();

      return follows.map(f => f.followingEmail);
    } catch (error) {
      console.error('Error getting following list:', error);
      throw error;
    }
  }

  // Get list of users that follow a user (accepted only)
  async getFollowersList(userEmail) {
    try {
      const follows = await Follow.find({
        followingEmail: userEmail,
        status: 'accepted',
      }).lean();

      return follows.map(f => f.followerEmail);
    } catch (error) {
      console.error('Error getting followers list:', error);
      throw error;
    }
  }

  // Get pending follow requests for a user
  async getPendingRequests(userEmail) {
    try {
      const requests = await Follow.find({
        followingEmail: userEmail,
        status: 'pending',
      })
        .sort({ requestedAt: -1 })
        .lean();

      return requests.map(r => ({
        followerEmail: r.followerEmail,
        requestedAt: r.requestedAt,
      }));
    } catch (error) {
      console.error('Error getting pending requests:', error);
      throw error;
    }
  }

  // Check if user can view another user's posts
  async canViewPosts(viewerEmail, postOwnerEmail) {
    try {
      // Can always view own posts
      if (viewerEmail === postOwnerEmail) {
        return true;
      }

      // Check if post owner is private
      const postOwner = await User.findOne({ email: postOwnerEmail });
      if (!postOwner) {
        return false;
      }

      // If public account, anyone can view
      if (!postOwner.isPrivate) {
        return true;
      }

      // If private account, check if viewer is following (accepted)
      const follow = await Follow.findOne({
        followerEmail: viewerEmail,
        followingEmail: postOwnerEmail,
        status: 'accepted',
      });

      return !!follow;
    } catch (error) {
      console.error('Error checking post visibility:', error);
      return false;
    }
  }
}

module.exports = new FollowService();

