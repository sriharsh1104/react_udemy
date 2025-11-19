import { showToastFromResponse } from '../utils/toast';
import apiService from './apiService';

class FeedService {
  // Get Instagram-like feed
  async getFeed(page = 1, limit = 10, feedMode = 'public') {
    try {
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get(
        `/feed?page=${page}&limit=${limit}&feedMode=${feedMode}`,
        {},
        false
      );
      
      if (!result.success) {
        showToastFromResponse(result, { errorTitle: 'Failed to Load Feed', showSuccess: false });
      }
      return result;
    } catch (error) {
      console.error('Error getting feed:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  // Search profiles
  async searchProfiles(query) {
    try {
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get(
        `/feed/search?query=${encodeURIComponent(query)}`,
        {},
        false
      );
      
      if (!result.success) {
        showToastFromResponse(result, { errorTitle: 'Search Failed', showSuccess: false });
      }
      return result;
    } catch (error) {
      console.error('Error searching profiles:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  // Get user profile
  async getProfile(email) {
    try {
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/feed/profile', { email }, {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { errorTitle: 'Failed to Load Profile', showSuccess: false });
      }
      return result;
    } catch (error) {
      console.error('Error getting profile:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  // Follow a user
  async followUser(followingEmail) {
    try {
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/feed/follow', { followingEmail }, {}, 'Following...');
      
      showToastFromResponse(result, {
        successTitle: result.status === 'pending' ? 'Follow Request Sent' : 'Followed Successfully',
        errorTitle: 'Failed to Follow',
      });
      return result;
    } catch (error) {
      console.error('Error following user:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  // Unfollow a user
  async unfollowUser(followingEmail) {
    try {
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/feed/unfollow', { followingEmail }, {}, 'Unfollowing...');
      
      showToastFromResponse(result, {
        successTitle: 'Unfollowed Successfully',
        errorTitle: 'Failed to Unfollow',
      });
      return result;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  // Toggle like on a status
  async toggleLike(statusId) {
    try {
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/feed/like', { statusId }, {}, false);
      // Don't show toast for likes (silent operation)
      return result;
    } catch (error) {
      console.error('Error toggling like:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  // Add comment to a status or reply to a comment
  async addComment(statusId, comment, replyToCommentId = null) {
    try {
      const body = { statusId, comment };
      if (replyToCommentId) {
        body.replyToCommentId = replyToCommentId;
      }

      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/feed/comment', body, {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { errorTitle: replyToCommentId ? 'Failed to Add Reply' : 'Failed to Add Comment' });
      } else {
        // Don't show toast for replies (silent operation)
        if (!replyToCommentId) {
          showToastFromResponse(result, { successTitle: 'Comment Added' });
        }
      }
      return result;
    } catch (error) {
      console.error('Error adding comment:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  // Get comments for a status
  async getComments(statusId) {
    try {
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get(`/feed/comments/${statusId}`, {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { errorTitle: 'Failed to Load Comments', showSuccess: false });
      }
      return result;
    } catch (error) {
      console.error('Error getting comments:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  // Update caption
  async updateCaption(statusId, caption) {
    try {
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/feed/caption', { statusId, caption }, {}, 'Updating Caption...');
      
      if (!result.success) {
        showToastFromResponse(result, { errorTitle: 'Failed to Update Caption' });
      } else {
        showToastFromResponse(result, { successTitle: 'Caption Updated' });
      }
      return result;
    } catch (error) {
      console.error('Error updating caption:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  // Toggle like on a comment or reply
  async toggleCommentLike(statusId, commentId, isReply = false, replyId = null) {
    try {
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post(
        '/feed/comment-like',
        { statusId, commentId, isReply, replyId },
        {},
        false
      );
      // Don't show toast for likes (silent operation)
      return result;
    } catch (error) {
      console.error('Error toggling comment like:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  // Pin/unpin a comment
  async togglePinComment(statusId, commentId) {
    try {
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/feed/pin-comment', { statusId, commentId }, {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { errorTitle: 'Failed to Pin Comment' });
      }
      return result;
    } catch (error) {
      console.error('Error pinning comment:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  // Delete a status/post
  async deleteStatus(statusId) {
    try {
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/feed/delete', { statusId }, {}, 'Deleting Post...');
      
      if (!result.success) {
        showToastFromResponse(result, { errorTitle: 'Failed to Delete Post' });
      } else {
        showToastFromResponse(result, { successTitle: 'Post Deleted Successfully' });
      }
      return result;
    } catch (error) {
      console.error('Error deleting status:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  // Save/Unsave a post
  async toggleSavePost(statusId) {
    try {
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/feed/save', { statusId }, {}, false);
      // Don't show toast for save/unsave (silent operation)
      return result;
    } catch (error) {
      console.error('Error toggling save post:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }
}

export default new FeedService();

