import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import statusService from '../../../../services/statusService';
import useAlertModal from '../../../../hooks/useAlertModal';

export const useStatusUpload = ({ loadStatuses, showAlert }) => {
  const { showAction } = useAlertModal();

  const uploadStatus = useCallback(async (file, type) => {
    try {
      const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
      const MAX_VIDEO_SIZE = 5 * 1024 * 1024;
      
      const fileSize = file.size || 0;
      
      if (type === 'image' && fileSize > MAX_IMAGE_SIZE) {
        showAlert('File Too Large', 'Image size must be less than 2MB', { type: 'warning' });
        return;
      }
      
      if (type === 'video' && fileSize > MAX_VIDEO_SIZE) {
        showAlert('File Too Large', 'Video size must be less than 5MB', { type: 'warning' });
        return;
      }
      
      const result = await statusService.uploadStatus(file, type, '', [], 'status');
      
      if (result.success) {
        await loadStatuses();
      } else {
        showAlert('Upload Failed', result.message || 'Failed to upload status', { type: 'error' });
      }
    } catch (error) {
      console.error('Error uploading status:', error);
      showAlert('Error', 'Failed to upload status. Please try again.', { type: 'error' });
    }
  }, [showAlert, loadStatuses]);

  const takePhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          type: asset.type || 'image',
          mimeType: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `status_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
        };
        await uploadStatus(file, 'image');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showAlert('Error', 'Failed to take photo', { type: 'error' });
    }
  }, [showAlert, uploadStatus]);

  const takeVideo = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          type: asset.type || 'video',
          mimeType: asset.mimeType || 'video/mp4',
          name: asset.fileName || `status_${Date.now()}.mp4`,
          size: asset.fileSize || 0,
        };
        await uploadStatus(file, 'video');
      }
    } catch (error) {
      console.error('Error taking video:', error);
      showAlert('Error', 'Failed to take video', { type: 'error' });
    }
  }, [showAlert, uploadStatus]);

  const pickFromGallery = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,video/*';
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              const isVideo = file.type.startsWith('video/');
              const fileObj = {
                uri: URL.createObjectURL(file),
                file: file,
                type: isVideo ? 'video' : 'image',
                mimeType: file.type,
                name: file.name || `status_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
                size: file.size || 0,
              };
              await uploadStatus(fileObj, isVideo ? 'video' : 'image');
            }
            resolve();
          };
          input.oncancel = () => resolve();
          input.click();
        });
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'We need camera roll permissions', { type: 'warning' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');
        const file = {
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          name: asset.fileName || `status_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
          size: asset.fileSize || 0,
        };
        await uploadStatus(file, isVideo ? 'video' : 'image');
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      showAlert('Error', 'Failed to open gallery', { type: 'error' });
    }
  }, [showAlert, uploadStatus]);

  const pickFromCamera = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        showAlert('Not Available', 'Camera is not available on web. Please use Gallery option.', { type: 'info' });
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'We need camera permissions', { type: 'warning' });
        return;
      }

      showAction(
        'Take Photo/Video',
        'Choose media type',
        [
          { text: 'Photo', onPress: takePhoto },
          { text: 'Video', onPress: takeVideo },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error opening camera:', error);
      showAlert('Error', 'Failed to open camera', { type: 'error' });
    }
  }, [showAlert, showAction, takePhoto, takeVideo]);

  const handleAddStatus = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaStatus !== 'granted') {
          showAlert('Permission Denied', 'We need camera roll permissions to add status', { type: 'warning' });
          return;
        }
      }

      showAction(
        'Add Status',
        'Choose an option',
        [
          { text: '📷 Gallery', onPress: pickFromGallery },
          { text: '📸 Camera', onPress: pickFromCamera },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error adding status:', error);
      showAlert('Error', 'Failed to add status', { type: 'error' });
    }
  }, [showAlert, showAction, pickFromGallery, pickFromCamera]);

  return {
    handleAddStatus,
    pickFromGallery,
    pickFromCamera,
    takePhoto,
    takeVideo,
    uploadStatus,
  };
};
