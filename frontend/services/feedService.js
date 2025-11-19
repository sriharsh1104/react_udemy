import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToastFromResponse } from '../utils/toast';
import { apiFetch } from '../utils/apiHelper';

class FeedService {
  // Get Instagram-like feed
  async getFeed(page = 1, limit = 10, feedMode = 'public') {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await apiFetch(
        `${API_CONFIG.API_BASE}/feed?page=${page}&limit=${limit}&feedMode=${feedMode}`,
        {
          method: 'GET',
          loadingMessage: 'Loading feed...',
        }
      );

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { errorTitle: 'Failed to Load Feed', showSuccess: false });
      }
      return data;
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await apiFetch(
        `${API_CONFIG.API_BASE}/feed/search?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          loadingMessage: 'Searching...',
          showLoader: false, // Don't show loader for search as it's usually fast
        }
      );

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { errorTitle: 'Search Failed', showSuccess: false });
      }
      return data;
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await apiFetch(
        `${API_CONFIG.API_BASE}/feed/profile`,
        {
          method: 'POST',
          body: JSON.stringify({ email }),
          loadingMessage: 'Loading profile...',
        }
      );

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { errorTitle: 'Failed to Load Profile', showSuccess: false });
      }
      return data;
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await apiFetch(`${API_CONFIG.API_BASE}/feed/follow`, {
        method: 'POST',
        body: JSON.stringify({ followingEmail }),
        loadingMessage: 'Following...',
        showLoader: false, // Don't show loader for quick actions
      });

      const data = await response.json();
      showToastFromResponse(data, {
        successTitle: data.status === 'pending' ? 'Follow Request Sent' : 'Followed Successfully',
        errorTitle: 'Failed to Follow',
      });
      return data;
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await apiFetch(`${API_CONFIG.API_BASE}/feed/unfollow`, {
        method: 'POST',
        body: JSON.stringify({ followingEmail }),
        loadingMessage: 'Unfollowing...',
        showLoader: false, // Don't show loader for quick actions
      });

      const data = await response.json();
      showToastFromResponse(data, {
        successTitle: 'Unfollowed Successfully',
        errorTitle: 'Failed to Unfollow',
      });
      return data;
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await apiFetch(`${API_CONFIG.API_BASE}/feed/like`, {
        method: 'POST',
        body: JSON.stringify({ statusId }),
        showLoader: false, // Don't show loader for likes (silent operation)
      });

      const data = await response.json();
      // Don't show toast for likes (silent operation)
      return data;
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const body = { statusId, comment };
      if (replyToCommentId) {
        body.replyToCommentId = replyToCommentId;
      }

      const response = await apiFetch(`${API_CONFIG.API_BASE}/feed/comment`, {
        method: 'POST',
        body: JSON.stringify(body),
        loadingMessage: 'Adding comment...',
        showLoader: false, // Don't show loader for comments (usually fast)
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { errorTitle: replyToCommentId ? 'Failed to Add Reply' : 'Failed to Add Comment' });
      } else {
        // Don't show toast for replies (silent operation)
        if (!replyToCommentId) {
          showToastFromResponse(data, { successTitle: 'Comment Added' });
        }
      }
      return data;
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await apiFetch(
        `${API_CONFIG.API_BASE}/feed/comments/${statusId}`,
        {
          method: 'GET',
          loadingMessage: 'Loading comments...',
        }
      );

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { errorTitle: 'Failed to Load Comments', showSuccess: false });
      }
      return data;
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await apiFetch(`${API_CONFIG.API_BASE}/feed/caption`, {
        method: 'POST',
        body: JSON.stringify({ statusId, caption }),
        loadingMessage: 'Updating caption...',
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { errorTitle: 'Failed to Update Caption' });
      } else {
        showToastFromResponse(data, { successTitle: 'Caption Updated' });
      }
      return data;
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await apiFetch(`${API_CONFIG.API_BASE}/feed/comment-like`, {
        method: 'POST',
        body: JSON.stringify({ statusId, commentId, isReply, replyId }),
        showLoader: false, // Don't show loader for likes (silent operation)
      });

      const data = await response.json();
      // Don't show toast for likes (silent operation)
      return data;
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await apiFetch(`${API_CONFIG.API_BASE}/feed/pin-comment`, {
        method: 'POST',
        body: JSON.stringify({ statusId, commentId }),
        loadingMessage: 'Pinning comment...',
        showLoader: false, // Don't show loader for quick actions
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { errorTitle: 'Failed to Pin Comment' });
      }
      return data;
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await apiFetch(`${API_CONFIG.API_BASE}/feed/delete`, {
        method: 'POST',
        body: JSON.stringify({ statusId }),
        loadingMessage: 'Deleting post...',
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { errorTitle: 'Failed to Delete Post' });
      } else {
        showToastFromResponse(data, { successTitle: 'Post Deleted Successfully' });
      }
      return data;
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await apiFetch(`${API_CONFIG.API_BASE}/feed/save`, {
        method: 'POST',
        body: JSON.stringify({ statusId }),
        showLoader: false, // Don't show loader for save/unsave (silent operation)
      });

      const data = await response.json();
      // Don't show toast for save/unsave (silent operation)
      return data;
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

