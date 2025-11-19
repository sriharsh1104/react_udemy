import { showToastFromResponse } from '../utils/toast';
import apiService from './apiService';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { API_CONFIG } from '../constants';

class StatusService {
  async uploadStatus(file, type, caption = '', tags = [], postType = 'status') {
    try {
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
      
      // Use apiService.uploadFile - loader and auth guard handled automatically
      const result = await apiService.uploadFile('/status/upload', formData, {}, 'Uploading Status...');
      
      if (!result.success) {
        showToastFromResponse(result, { errorTitle: 'Upload Failed' });
      } else {
        showToastFromResponse(result, { successTitle: 'Status Uploaded' });
      }
      return result;
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
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get('/status/feed', {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { errorTitle: 'Failed to Load Status', showSuccess: false });
      }
      return result;
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
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/status/view', { statusId }, {}, false);
      // Don't show toast for view tracking (silent operation)
      return result;
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
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get(`/status/${statusId}/viewers`, {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { errorTitle: 'Failed to Load Viewers', showSuccess: false });
      }
      return result;
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

  async deleteStatus(statusId) {
    try {
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/feed/delete', { statusId }, {}, 'Deleting Status...');
      
      if (!result.success) {
        showToastFromResponse(result, { errorTitle: 'Failed to Delete Status' });
      } else {
        showToastFromResponse(result, { successTitle: 'Status Deleted Successfully' });
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

  async saveImage(fileId, fileName, statusUrl) {
    try {
      // Get file URL - prefer fileId, fallback to statusUrl
      let downloadUrl = null;
      if (fileId) {
        try {
          const fileUploadService = (await import('./fileUploadService')).default;
          downloadUrl = await fileUploadService.getFileViewUrl(fileId);
        } catch (error) {
          console.error('Error getting file URL:', error);
          // Fallback to statusUrl
          downloadUrl = statusUrl?.startsWith('http') 
            ? statusUrl 
            : (statusUrl ? `${API_CONFIG.API_BASE}${statusUrl}` : null);
        }
      } else if (statusUrl) {
        downloadUrl = statusUrl.startsWith('http') 
          ? statusUrl 
          : `${API_CONFIG.API_BASE}${statusUrl}`;
      }

      if (!downloadUrl) {
        return {
          success: false,
          message: 'No file URL available',
        };
      }

      // For web platform, trigger browser download
      if (Platform.OS === 'web') {
        try {
          // Use apiService.downloadFile for web
          const result = await apiService.downloadFile(downloadUrl, {}, 'Downloading...');
          
          if (result.success) {
            const blob = result.data; // blob from downloadFile
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Trigger browser download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || `status_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up blob URL after a delay
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
            
            return {
              success: true,
              message: 'Image saved successfully',
            };
          }
          return result;
        } catch (error) {
          console.error('Error saving image on web:', error);
          return {
            success: false,
            message: 'Failed to save image',
          };
        }
      }

      // For native platforms, download to file system
      try {
        const fileExtension = fileName?.split('.').pop() || 'jpg';
        const localFileName = fileName || `status_${Date.now()}.${fileExtension}`;
        const fileUri = `${FileSystem.documentDirectory}${localFileName}`;
        
        const downloadResult = await FileSystem.downloadAsync(
          downloadUrl,
          fileUri,
          {
            headers: {
              'Authorization': `Bearer ${await (await import('@react-native-async-storage/async-storage')).default.getItem('authToken')}`,
            },
          }
        );
        
        if (downloadResult.status !== 200) {
          throw new Error('Download failed');
        }
        
        return {
          success: true,
          message: 'Image saved successfully',
          localUri: downloadResult.uri,
        };
      } catch (error) {
        console.error('Error saving image on native:', error);
        return {
          success: false,
          message: 'Failed to save image',
        };
      }
    } catch (error) {
      console.error('Error saving image:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }
}

export default new StatusService();
