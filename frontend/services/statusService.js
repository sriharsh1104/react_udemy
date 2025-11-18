import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToastFromResponse } from '../utils/toast';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

class StatusService {
  async uploadStatus(file, type, caption = '', tags = [], postType = 'status') {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      // Create form data
      const formData = new FormData();
      
      // Handle different platforms
      if (Platform.OS === 'web') {
        // On web, use the File object directly if available
        try {
          if (file.file) {
            // Direct File object from input
            formData.append('file', file.file);
            formData.append('type', type);
          } else {
            // Fallback: convert blob URL to blob
            const response = await fetch(file.uri);
            const blob = await response.blob();
            const fileName = file.name || `status.${type === 'image' ? 'jpg' : 'mp4'}`;
            
            formData.append('file', blob, fileName);
            formData.append('type', type);
          }
        } catch (error) {
          console.error('Error converting file for web:', error);
          return {
            success: false,
            message: 'Failed to process file for upload',
          };
        }
      } else {
        // On native platforms (iOS/Android)
        const fileName = file.name || file.uri.split('/').pop() || `status.${type === 'image' ? 'jpg' : 'mp4'}`;
        const mimeType = file.mimeType || file.type || (type === 'image' ? 'image/jpeg' : 'video/mp4');
        
        // React Native FormData format - use file.uri directly, don't modify it
        formData.append('file', {
          uri: file.uri,
          type: mimeType,
          name: fileName,
        });
        formData.append('type', type);
      }
      
      // Add caption, tags, and postType
      if (caption) formData.append('caption', caption);
      if (tags && Array.isArray(tags) && tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
      }
      formData.append('postType', postType || 'status');
      
      const response = await fetch(`${API_CONFIG.API_BASE}/status/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!data.success) {
        showToastFromResponse(data, { errorTitle: 'Upload Failed' });
      } else {
        showToastFromResponse(data, { successTitle: 'Status Uploaded' });
      }
      return data;
    } catch (error) {
      console.error('Error uploading status:', error);
      const errorResponse = {
        success: false,
        message: error.message || 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async getStatusFeed() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await fetch(`${API_CONFIG.API_BASE}/status/feed`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { errorTitle: 'Failed to Load Status', showSuccess: false });
      }
      return data;
    } catch (error) {
      console.error('Error getting status feed:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async markAsViewed(statusId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await fetch(`${API_CONFIG.API_BASE}/status/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ statusId }),
      });

      const data = await response.json();
      // Don't show toast for view tracking (silent operation)
      return data;
    } catch (error) {
      console.error('Error marking status as viewed:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  async getViewers(statusId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await fetch(`${API_CONFIG.API_BASE}/status/${statusId}/viewers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { errorTitle: 'Failed to Load Viewers', showSuccess: false });
      }
      return data;
    } catch (error) {
      console.error('Error getting viewers:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }
}

export default new StatusService();

