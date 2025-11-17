/**
 * Custom hook for action bar handlers
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { default as Clipboard } from 'expo-clipboard';
import logger from '../../../utils/logger';
import { showSuccessToast } from '../../../utils/toast';
import fileUploadService from '../../../services/fileUploadService';

export const useActionBarHandlers = ({
  selectedMessages,
  setSelectedMessages,
  setReplyingTo,
  setEditingMessage,
  setInputMessage,
  setSelectedMessage,
  handleDeleteMessage,
  handlePinMessage,
  handleUnpinMessage,
  setMessageInfoMessageId,
  setShowMessageInfoModal,
  chatType,
  contactEmail,
  userEmail,
  groupId,
}) => {
  const handleActionBarCopy = useCallback(async () => {
    if (selectedMessages.length === 0) return;
    try {
      const messageToCopy = selectedMessages[0];
      await Clipboard.setStringAsync(messageToCopy.message);
      showSuccessToast('Copied!', 'Message copied to clipboard');
      setSelectedMessages([]);
    } catch (error) {
      logger.error('Error copying message:', error);
    }
  }, [selectedMessages, setSelectedMessages]);

  const handleActionBarReply = useCallback(() => {
    if (selectedMessages.length === 0) return;
    const messageToReply = selectedMessages[0];
    setReplyingTo({
      messageId: messageToReply.messageId,
      message: messageToReply.message,
      senderEmail: messageToReply.isSent ? userEmail : (chatType === 'group' ? null : contactEmail),
    });
    setSelectedMessages([]);
  }, [selectedMessages, chatType, contactEmail, userEmail, setReplyingTo, setSelectedMessages]);

  const handleActionBarForward = useCallback(async () => {
    if (selectedMessages.length === 0) return;
    
    const messageToForward = selectedMessages[0];
    
    // Check if message is a file message
    try {
      const parsed = JSON.parse(messageToForward.message);
      if (parsed && parsed.type === 'file') {
        // Check if file exists locally
        const localUri = await fileUploadService.getLocalFileUri(parsed.fileId, parsed.fileName);
        
        if (localUri) {
          // File exists locally, we can forward it using cached file
          // For now, show alert - full forwarding UI can be implemented later
          Alert.alert(
            'Forward File',
            `File "${parsed.fileName}" is available locally and can be forwarded. Forwarding UI coming soon.`,
            [{ text: 'OK' }]
          );
        } else {
          // File doesn't exist locally, would need to download first
          Alert.alert(
            'Forward File',
            `File "${parsed.fileName}" needs to be downloaded first before forwarding. Forwarding UI coming soon.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        // Regular text message - can forward directly
        Alert.alert('Forward', 'Forward functionality coming soon');
      }
    } catch {
      // Not a JSON message, treat as regular text
      Alert.alert('Forward', 'Forward functionality coming soon');
    }
    
    setSelectedMessages([]);
  }, [selectedMessages, setSelectedMessages]);

  const handleActionBarPin = useCallback(() => {
    if (selectedMessages.length === 0 || !groupId) return;
    const messageToPin = selectedMessages[0];
    if (messageToPin.messageId) {
      handlePinMessage(messageToPin.messageId);
      setSelectedMessages([]);
    }
  }, [selectedMessages, groupId, handlePinMessage, setSelectedMessages]);

  const handleActionBarUnpin = useCallback(() => {
    if (selectedMessages.length === 0 || !groupId) return;
    const messageToUnpin = selectedMessages[0];
    if (messageToUnpin.messageId) {
      handleUnpinMessage(messageToUnpin.messageId);
      setSelectedMessages([]);
    }
  }, [selectedMessages, groupId, handleUnpinMessage, setSelectedMessages]);

  const handleActionBarEdit = useCallback(() => {
    if (selectedMessages.length === 0) return;
    const messageToEdit = selectedMessages[0];
    setSelectedMessage(messageToEdit);
    setEditingMessage(messageToEdit);
    setInputMessage(messageToEdit.message);
    setSelectedMessages([]);
  }, [selectedMessages, setSelectedMessage, setEditingMessage, setInputMessage, setSelectedMessages]);

  const handleActionBarDelete = useCallback(() => {
    if (selectedMessages.length === 0) return;
    const messageToDelete = selectedMessages[0];
    setSelectedMessage(messageToDelete);
    setSelectedMessages([]);
    handleDeleteMessage();
  }, [selectedMessages, setSelectedMessage, setSelectedMessages, handleDeleteMessage]);

  const handleActionBarInfo = useCallback(() => {
    if (selectedMessages.length === 0) return;
    const messageToShow = selectedMessages[0];
    if (messageToShow.messageId) {
      setMessageInfoMessageId(messageToShow.messageId);
      setShowMessageInfoModal(true);
      setSelectedMessages([]);
    }
  }, [selectedMessages, setMessageInfoMessageId, setShowMessageInfoModal, setSelectedMessages]);

  const handleActionBarClose = useCallback(() => {
    setSelectedMessages([]);
  }, [setSelectedMessages]);

  const canEditMessage = useCallback(() => {
    if (selectedMessages.length === 0) return false;
    const msg = selectedMessages[0];
    if (!msg.isSent) return false;
    if (msg.isDeleted) return false;
    if (chatType === 'private') {
      return msg.status !== 'read';
    }
    return msg.status !== 'read';
  }, [selectedMessages, chatType]);

  return {
    handleActionBarCopy,
    handleActionBarReply,
    handleActionBarForward,
    handleActionBarPin,
    handleActionBarUnpin,
    handleActionBarEdit,
    handleActionBarDelete,
    handleActionBarInfo,
    handleActionBarClose,
    canEditMessage,
  };
};

