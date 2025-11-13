import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * File Upload Service
 * Handles image, video, audio, and PDF uploads with compression
 */
class FileUploadService {
  // Size limits in bytes
  MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
  MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB
  MAX_PDF_SIZE = 2 * 1024 * 1024; // 2MB
  
  /**
   * Request permissions for media access
   */
  async requestPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access media library is required!');
    }
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermissions() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access camera is required!');
    }
  }
  
  /**
   * Check image size (no compression, just validation)
   */
  async checkImageSize(uri, fileSize = null, maxSize = this.MAX_IMAGE_SIZE) {
    try {
      let size = fileSize;
      
      // On web, use fileSize directly if provided, otherwise try to get from FileSystem
      if (Platform.OS === 'web') {
        if (!size) {
          // On web, we can't use FileSystem, so we need size from the file object
          throw new Error('File size is required on web platform');
        }
      } else {
        // On native platforms, get size from FileSystem
        if (!size) {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (!fileInfo.exists) {
            throw new Error('File does not exist');
          }
          size = fileInfo.size;
        }
      }
      
      if (size > maxSize) {
        throw new Error(`Image size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds limit of ${maxSize / 1024 / 1024}MB`);
      }
      
      return uri;
    } catch (error) {
      console.error('Image size check error:', error);
      throw error;
    }
  }
  
  /**
   * Check video size (no compression, just validation)
   */
  async checkVideoSize(uri, fileSize = null, maxSize = this.MAX_VIDEO_SIZE) {
    try {
      let size = fileSize;
      
      // On web, use fileSize directly if provided
      if (Platform.OS === 'web') {
        if (!size) {
          throw new Error('File size is required on web platform');
        }
      } else {
        // On native platforms, get size from FileSystem
        if (!size) {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (!fileInfo.exists) {
            throw new Error('File does not exist');
          }
          size = fileInfo.size;
        }
      }
      
      if (size > maxSize) {
        throw new Error(`Video size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds limit of ${maxSize / 1024 / 1024}MB`);
      }
      
      return uri;
    } catch (error) {
      console.error('Video size check error:', error);
      throw error;
    }
  }
  
  /**
   * Check PDF size (no compression, just validation)
   */
  async checkPDFSize(uri, fileSize = null, maxSize = this.MAX_PDF_SIZE) {
    try {
      let size = fileSize;
      
      // On web, use fileSize directly if provided
      if (Platform.OS === 'web') {
        if (!size) {
          throw new Error('File size is required on web platform');
        }
      } else {
        // On native platforms, get size from FileSystem
        if (!size) {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (!fileInfo.exists) {
            throw new Error('File does not exist');
          }
          size = fileInfo.size;
        }
      }
      
      if (size > maxSize) {
        throw new Error(`PDF size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds limit of ${maxSize / 1024 / 1024}MB`);
      }
      
      return uri;
    } catch (error) {
      console.error('PDF size check error:', error);
      throw error;
    }
  }
  
  /**
   * Pick image (with size validation)
   */
  async pickImage() {
    try {
      await this.requestPermissions();
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      
      if (result.canceled) {
        return null;
      }
      
      const asset = result.assets[0];
      const fileSize = asset.fileSize || asset.size || 0;
      
      // Check size (no compression) - pass fileSize for web compatibility
      await this.checkImageSize(asset.uri, fileSize);
      
      return {
        uri: asset.uri,
        type: 'image',
        name: `image_${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size: fileSize,
      };
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  }

  /**
   * Take photo with camera (with size validation)
   */
  async takePhoto() {
    try {
      await this.requestCameraPermissions();
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      
      if (result.canceled) {
        return null;
      }
      
      const asset = result.assets[0];
      const fileSize = asset.fileSize || asset.size || 0;
      
      // Check size (no compression) - pass fileSize for web compatibility
      await this.checkImageSize(asset.uri, fileSize);
      
      return {
        uri: asset.uri,
        type: 'image',
        name: `photo_${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size: fileSize,
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }
  
  /**
   * Pick video (with size validation)
   */
  async pickVideo() {
    try {
      await this.requestPermissions();
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });
      
      if (result.canceled) {
        return null;
      }
      
      const asset = result.assets[0];
      const fileSize = asset.fileSize || asset.size || 0;
      
      // Check size (no compression) - pass fileSize for web compatibility
      await this.checkVideoSize(asset.uri, fileSize);
      
      return {
        uri: asset.uri,
        type: 'video',
        name: `video_${Date.now()}.mp4`,
        mimeType: asset.mimeType || 'video/mp4',
        size: fileSize,
      };
    } catch (error) {
      console.error('Error picking video:', error);
      throw error;
    }
  }
  
  /**
   * Pick audio file
   */
  async pickAudio() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return null;
      }
      
      return {
        uri: result.assets[0].uri,
        type: 'audio',
        name: result.assets[0].name || `audio_${Date.now()}.mp3`,
        mimeType: result.assets[0].mimeType || 'audio/mpeg',
        size: result.assets[0].size || 0,
      };
    } catch (error) {
      console.error('Error picking audio:', error);
      throw error;
    }
  }
  
  /**
   * Pick PDF file (with size validation)
   */
  async pickPDF() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return null;
      }
      
      const asset = result.assets[0];
      const fileSize = asset.size || 0;
      
      // Check size (no compression) - pass fileSize for web compatibility
      await this.checkPDFSize(asset.uri, fileSize);
      
      return {
        uri: asset.uri,
        type: 'pdf',
        name: asset.name || `document_${Date.now()}.pdf`,
        mimeType: 'application/pdf',
        size: fileSize,
      };
    } catch (error) {
      console.error('Error picking PDF:', error);
      throw error;
    }
  }
  
  /**
   * Upload file to server with progress tracking
   */
  async uploadFile(file, userEmail, onProgress) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get file size for time estimation
      let fileSize = file.size || 0;
      
      // On native platforms, try to get size from FileSystem if not provided
      if (Platform.OS !== 'web' && !fileSize) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(file.uri);
          fileSize = fileInfo.size || 0;
        } catch (error) {
          console.warn('Could not get file size from FileSystem:', error);
        }
      }
      
      // Estimate upload time (assuming average 1MB/s upload speed)
      const estimatedTimeSeconds = Math.ceil(fileSize / (1024 * 1024)); // Rough estimate: 1 second per MB
      const estimatedTimeMinutes = Math.floor(estimatedTimeSeconds / 60);
      const estimatedTimeSecondsRemainder = estimatedTimeSeconds % 60;
      
      let estimatedTimeText = '';
      if (estimatedTimeMinutes > 0) {
        estimatedTimeText = `${estimatedTimeMinutes} min ${estimatedTimeSecondsRemainder} sec`;
      } else {
        estimatedTimeText = `${estimatedTimeSeconds} sec`;
      }
      
      // Create form data
      const formData = new FormData();
      
      console.log('Uploading file:', {
        uri: file.uri,
        name: file.name,
        type: file.type,
        mimeType: file.mimeType,
        size: file.size,
        platform: Platform.OS,
      });
      
      // Handle different platforms
      if (Platform.OS === 'web') {
        // On web, convert URI to File/Blob
        try {
          // If it's a data URI, convert to blob
          if (file.uri.startsWith('data:')) {
            const response = await fetch(file.uri);
            const blob = await response.blob();
            const fileName = file.name || `file_${Date.now()}.${file.type === 'image' ? 'jpg' : file.type === 'video' ? 'mp4' : 'pdf'}`;
            formData.append('file', blob, fileName);
          } else {
            // If it's a blob URL or file URI, fetch it
            const response = await fetch(file.uri);
            const blob = await response.blob();
            const fileName = file.name || `file_${Date.now()}.${file.type === 'image' ? 'jpg' : file.type === 'video' ? 'mp4' : 'pdf'}`;
            formData.append('file', blob, fileName);
          }
        } catch (error) {
          console.error('Error converting file to blob:', error);
          throw new Error('Failed to prepare file for upload');
        }
      } else {
        // On native platforms, use the file object structure
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name || `file_${Date.now()}`,
        });
      }
      
      formData.append('type', file.type);
      
      const startTime = Date.now();
      
      // Upload to server - don't set Content-Type header, let fetch set it automatically
      const response = await fetch(`${API_CONFIG.API_BASE}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let the browser/React Native set it with boundary
        },
        body: formData,
      });
      
      console.log('Upload response status:', response.status);
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }
      
      const actualTime = Math.ceil((Date.now() - startTime) / 1000);
      
      return {
        ...data,
        estimatedTime: estimatedTimeText,
        actualTime: actualTime,
        fileSize: fileSize,
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
  
  /**
   * Download file from server
   */
  async downloadFile(fileId, fileName, fileType) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Handle web platform differently - use browser download
      if (Platform.OS === 'web') {
        const response = await fetch(`${API_CONFIG.API_BASE}/files/download/${fileId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Download failed');
        }
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Trigger browser download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Note: We don't revoke the blob URL here so it can be used for display
        
        // Return a blob URL for web (can be used to display images/videos)
        return {
          localUri: blobUrl,
          fileName,
          fileType,
        };
      }
      
      // Native platforms - use FileSystem
      const fileUri = `${FileSystem.documentDirectory}${fileId}_${fileName}`;
      
      // Download file with authorization header
      const downloadResult = await FileSystem.downloadAsync(
        `${API_CONFIG.API_BASE}/files/download/${fileId}`,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }
      
      return {
        localUri: downloadResult.uri,
        fileName,
        fileType,
      };
    } catch (error) {
      console.error('File download error:', error);
      throw error;
    }
  }
  
  /**
   * Delete file from server after download
   */
  async deleteFileFromServer(fileId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/files/delete/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }
}

export default new FileUploadService();

