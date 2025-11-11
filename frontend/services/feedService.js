import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToastFromResponse } from '../utils/toast';

class FeedService {
  // Get Instagram-like feed
  async getFeed(page = 1, limit = 10) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await fetch(
        `${API_CONFIG.API_BASE}/feed?page=${page}&limit=${limit}`,
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
        `${API_CONFIG.API_BASE}/feed/${statusId}/comments`,
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

