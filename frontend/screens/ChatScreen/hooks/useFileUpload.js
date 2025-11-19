/**
 * Custom hook for file upload handling
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import logger from '../../../utils/logger';
import fileUploadService from '../../../services/fileUploadService';

export const useFileUpload = ({
  chatType,
  contactEmail,
  groupId,
  userEmail,
  sendPrivateMessage,
  sendGroupMessage,
}) => {
  const handleFileSelect = useCallback(async (file) => {
    try {
      const currentChatType = chatType;
      const currentContactEmail = contactEmail;
      const currentGroupId = groupId;
      
      if (!currentChatType || (currentChatType === 'private' && !currentContactEmail) || (currentChatType === 'group' && !currentGroupId)) {
        Alert.alert('Error', 'Please select a chat to send the file');
        return;
      }
      
      const fileSizeMB = ((file.size || 0) / 1024 / 1024).toFixed(2);
      const estimatedTimeSeconds = Math.ceil((file.size || 0) / (1024 * 1024));
      const estimatedTimeMinutes = Math.floor(estimatedTimeSeconds / 60);
      const estimatedTimeSecondsRemainder = estimatedTimeSeconds % 60;
      
      let estimatedTimeText = '';
      if (estimatedTimeMinutes > 0) {
        estimatedTimeText = `${estimatedTimeMinutes} min ${estimatedTimeSecondsRemainder} sec`;
      } else {
        estimatedTimeText = `${estimatedTimeSeconds} sec`;
      }
      
      Alert.alert(
        'Uploading File',
        `File size: ${fileSizeMB} MB\nEstimated time: ${estimatedTimeText}`,
        [{ text: 'OK' }]
      );
      
      const uploadResult = await fileUploadService.uploadFile(file, userEmail);
      
      // Check if upload was successful
      if (!uploadResult.success) {
        Alert.alert(
          'Upload Failed',
          uploadResult.message || 'Failed to upload file. Please try again.'
        );
        return;
      }
      
      if (!uploadResult.fileId) {
        Alert.alert(
          'Upload Error',
          'File uploaded but no file ID received. Please try again.'
        );
        return;
      }
      
      // Check if chat context changed during upload
      const chatContextChanged = 
        (currentChatType !== chatType) ||
        (currentChatType === 'private' && currentContactEmail !== contactEmail) ||
        (currentChatType === 'group' && currentGroupId !== groupId);
      
      if (chatContextChanged) {
        Alert.alert(
          'Chat Changed',
          'The chat was changed while uploading. File will not be sent to prevent sending to wrong chat.'
        );
        // TODO: Optionally delete uploaded file from server to save storage
        return;
      }
      
      // Create file message JSON
      const fileMessage = JSON.stringify({
        type: 'file',
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName || file.name,
        fileType: uploadResult.fileType || file.type,
        fileSize: uploadResult.fileSize || file.size || 0,
        localUri: uploadResult.localUri || null, // Include local URI for sender
      });
      
      // Send message with error handling
      try {
        if (currentChatType === 'private' && currentContactEmail) {
          await sendPrivateMessage(fileMessage);
        } else if (currentChatType === 'group' && currentGroupId) {
          await sendGroupMessage(fileMessage);
        } else {
          throw new Error('Invalid chat context');
        }
        
        // Only show success alert if message was sent successfully
        Alert.alert(
          'Upload Complete',
          `File uploaded successfully in ${uploadResult.actualTime || estimatedTimeSeconds} seconds`
        );
      } catch (sendError) {
        logger.error('Error sending file message:', sendError);
        Alert.alert(
          'Send Failed',
          'File uploaded but failed to send message. The file is saved and you can try sending again.'
        );
        // TODO: Optionally show retry option or save file message for later
      }
    } catch (error) {
      logger.error('Error uploading file:', error);
      Alert.alert('Error', error.message || 'Failed to upload file');
    }
  }, [chatType, contactEmail, groupId, userEmail, sendPrivateMessage, sendGroupMessage]);

  return { handleFileSelect };
};

