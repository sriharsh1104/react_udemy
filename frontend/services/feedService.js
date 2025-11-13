import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToastFromResponse } from '../utils/toast';

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

      const response = await fetch(
        `${API_CONFIG.API_BASE}/feed?page=${page}&limit=${limit}&feedMode=${feedMode}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
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

      const response = await fetch(
        `${API_CONFIG.API_BASE}/feed/search?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
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

      const response = await fetch(
        `${API_CONFIG.API_BASE}/feed/profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
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

      const response = await fetch(`${API_CONFIG.API_BASE}/feed/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ followingEmail }),
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

      const response = await fetch(`${API_CONFIG.API_BASE}/feed/unfollow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ followingEmail }),
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

      const response = await fetch(`${API_CONFIG.API_BASE}/feed/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ statusId }),
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

  // Add comment to a status
  async addComment(statusId, comment) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await fetch(`${API_CONFIG.API_BASE}/feed/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ statusId, comment }),
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { errorTitle: 'Failed to Add Comment' });
      } else {
        showToastFromResponse(data, { successTitle: 'Comment Added' });
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

      const response = await fetch(
        `${API_CONFIG.API_BASE}/feed/comments/${statusId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
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

      const response = await fetch(`${API_CONFIG.API_BASE}/feed/caption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ statusId, caption }),
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
}

export default new FeedService();

