/**
 * Custom hook for chat message handlers
 * Extracts message-related logic from ChatScreen
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import logger from '../../../utils/logger';
import { showSuccessToast } from '../../../utils/toast';
import contactsService from '../../../services/contactsService';
import groupService from '../../../services/groupService';
import encryptionService from '../../../services/encryptionService';
import socketService from '../../../services/socketService';
import { SOCKET_EVENTS } from '../../../constants';

export const useChatHandlers = ({
  chatType,
  contactEmail,
  groupId,
  inputMessage,
  setInputMessage,
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  selectedMessage,
  setSelectedMessage,
  selectedMessages,
  setSelectedMessages,
  sendMessage,
  sendPrivateMessage,
  sendGroupMessage,
  removePrivatePendingMessage,
  removeGroupPendingMessage,
  userEmail,
  currentGroup,
  messages,
  setShowMessageMenu,
  setShowDeleteMessageModal,
  setMessageToDelete,
  setShowMessageInfoModal,
  setMessageInfoMessageId,
  setPinnedMessage,
  loadPinnedMessage,
}) => {
  const handleSendMessage = useCallback(async () => {
    if (inputMessage.trim()) {
      // If editing a message, call edit instead of send
      if (editingMessage && editingMessage.messageId) {
        try {
          let result;
          if (chatType === 'group') {
            result = await groupService.editMessage(editingMessage.messageId, inputMessage.trim());
          } else {
            result = await contactsService.editMessage(editingMessage.messageId, inputMessage.trim());
          }
          
          if (result.success) {
            setInputMessage('');
            setEditingMessage(null);
            setReplyingTo(null);
          }
        } catch (error) {
          logger.error('Error editing message:', error);
          Alert.alert('Error', 'Failed to edit message');
        }
        return;
      }
      
      // Include reply info if replying
      const replyInfo = replyingTo ? {
        replyTo: replyingTo.messageId,
        replyToMessage: replyingTo.message,
        replyToSender: replyingTo.senderEmail,
      } : null;
      
      sendMessage(inputMessage, replyInfo);
      setInputMessage('');
      setReplyingTo(null);
      setEditingMessage(null);
    }
  }, [inputMessage, editingMessage, replyingTo, chatType, sendMessage, sendPrivateMessage, sendGroupMessage, setInputMessage, setReplyingTo, setEditingMessage]);

  const handleTyping = useCallback((text) => {
    setInputMessage(text);
    // sendTyping will be called from parent
  }, [setInputMessage]);

  const handleMessageSelect = useCallback((messageData) => {
    if (!messageData) {
      setSelectedMessages([]);
      return;
    }

    setSelectedMessages((prev) => {
      const exists = prev.some(
        (msg) => (msg.messageId || msg._id) === (messageData.messageId || messageData._id)
      );
      
      if (exists) {
        return prev.filter(
          (msg) => (msg.messageId || msg._id) !== (messageData.messageId || messageData._id)
        );
      } else {
        const fullMessage = messages.find(
          (msg) => (msg.messageId || msg._id) === (messageData.messageId || messageData._id)
        );
        
        let messageStatus = fullMessage?.status || messageData.status || 'sent';
        if (chatType === 'group' && fullMessage && (fullMessage.isSent || fullMessage.senderEmail === userEmail) && currentGroup && fullMessage.readBy) {
          const allMembers = currentGroup.members || [];
          const readBy = fullMessage.readBy || [];
          const totalMembers = allMembers.length;
          const readCount = readBy.length;
          
          if (readCount >= totalMembers) {
            messageStatus = 'read';
          } else if (readCount > 1) {
            messageStatus = 'delivered';
          } else {
            messageStatus = 'sent';
          }
        }
        
        return [
          ...prev,
          {
            ...messageData,
            ...fullMessage,
            timestamp: fullMessage?.timestamp || messageData.timestamp,
            status: messageStatus,
            readBy: fullMessage?.readBy || messageData.readBy || [],
          },
        ];
      }
    });
  }, [messages, chatType, currentGroup, userEmail]);

  const handleMenuPress = useCallback((messageData) => {
    const fullMessage = messages.find(
      (msg) => (msg.messageId || msg._id) === messageData.messageId
    );
    
    let messageStatus = fullMessage?.status || messageData.status || 'sent';
    if (chatType === 'group' && fullMessage && (fullMessage.isSent || fullMessage.senderEmail === userEmail) && currentGroup && fullMessage.readBy) {
      const allMembers = currentGroup.members || [];
      const readBy = fullMessage.readBy || [];
      const totalMembers = allMembers.length;
      const readCount = readBy.length;
      
      if (readCount >= totalMembers) {
        messageStatus = 'read';
      } else if (readCount > 1) {
        messageStatus = 'delivered';
      } else {
        messageStatus = 'sent';
      }
    }
    
    setSelectedMessage({
      ...messageData,
      ...fullMessage,
      timestamp: fullMessage?.timestamp || messageData.timestamp,
      status: messageStatus,
      readBy: fullMessage?.readBy || messageData.readBy || [],
    });
    setShowMessageMenu(true);
  }, [messages, chatType, currentGroup, userEmail, setShowMessageMenu]);

  const handleDeleteMessage = useCallback(() => {
    if (!selectedMessage) return;
    setMessageToDelete(selectedMessage);
    setShowDeleteMessageModal(true);
  }, [selectedMessage, setMessageToDelete, setShowDeleteMessageModal]);

  const handleDeleteMessageConfirm = useCallback(async (messageToDelete) => {
    setShowDeleteMessageModal(false);
    
    if (!messageToDelete) return;
    
    const canUndo = messageToDelete.isSent && !messageToDelete.messageId;
    
    if (canUndo) {
      if (chatType === 'group') {
        if (removeGroupPendingMessage) {
          removeGroupPendingMessage(messageToDelete);
          showSuccessToast('Message removed');
        }
      } else {
        if (removePrivatePendingMessage) {
          removePrivatePendingMessage(messageToDelete);
          showSuccessToast('Message removed');
        }
      }
      
      setSelectedMessage(null);
      setMessageToDelete(null);
    } else {
      if (!messageToDelete.messageId) {
        logger.error('Cannot delete message without messageId');
        return;
      }
      
      try {
        let result;
        if (chatType === 'group') {
          result = await groupService.deleteMessage(messageToDelete.messageId);
        } else {
          result = await contactsService.deleteMessage(messageToDelete.messageId);
        }
        
        if (result.success) {
          if (editingMessage && editingMessage.messageId === messageToDelete.messageId) {
            setEditingMessage(null);
            setInputMessage('');
          }
        } else {
          logger.error('Failed to delete message:', result.message);
        }
      } catch (error) {
        logger.error('Error deleting message:', error);
      }
    }
    
    setSelectedMessage(null);
    setMessageToDelete(null);
  }, [chatType, editingMessage, removeGroupPendingMessage, removePrivatePendingMessage, setEditingMessage, setInputMessage, setSelectedMessage, setMessageToDelete, setShowDeleteMessageModal]);

  const handleDeleteMessageCancel = useCallback(() => {
    setShowDeleteMessageModal(false);
    setMessageToDelete(null);
  }, [setShowDeleteMessageModal, setMessageToDelete]);

  const handleReplyMessage = useCallback(() => {
    if (!selectedMessage) return;
    setReplyingTo({
      messageId: selectedMessage.messageId,
      message: selectedMessage.message,
      senderEmail: selectedMessage.isSent ? userEmail : (chatType === 'group' ? null : contactEmail),
    });
    setShowMessageMenu(false);
  }, [selectedMessage, chatType, contactEmail, userEmail, setReplyingTo, setShowMessageMenu]);

  const handleEditMessage = useCallback(() => {
    if (!selectedMessage) return;
    
    // Extract message string
    const messageStr = typeof selectedMessage.message === 'string' 
      ? selectedMessage.message 
      : (selectedMessage.message?.message || selectedMessage.message?.text || String(selectedMessage.message || ''));
    
    // Check if message is a file message - file messages cannot be edited
    try {
      const parsed = JSON.parse(messageStr);
      if (parsed && parsed.type === 'file') {
        Alert.alert('Cannot Edit', 'File messages cannot be edited. You can delete and send a new file instead.');
        setShowMessageMenu(false);
        setSelectedMessage(null);
        return;
      }
    } catch {
      // Not a JSON message, proceed with normal edit
    }
    
    // For text messages, set the text content for editing
    setEditingMessage(selectedMessage);
    setInputMessage(messageStr);
    setShowMessageMenu(false);
    setSelectedMessage(null);
  }, [selectedMessage, setEditingMessage, setInputMessage, setShowMessageMenu, setSelectedMessage]);

  const handleCopyMessage = useCallback(async () => {
    if (selectedMessages.length === 0) return;
    try {
      const { default: Clipboard } = await import('expo-clipboard');
      const messageToCopy = selectedMessages[0];
      await Clipboard.setStringAsync(messageToCopy.message);
      showSuccessToast('Copied!', 'Message copied to clipboard');
      setSelectedMessages([]);
    } catch (error) {
      logger.error('Error copying message:', error);
    }
  }, [selectedMessages, setSelectedMessages]);

  const handleInfoMessage = useCallback(() => {
    if (selectedMessages.length === 0) return;
    const messageToShow = selectedMessages[0];
    if (messageToShow.messageId) {
      setMessageInfoMessageId(messageToShow.messageId);
      setShowMessageInfoModal(true);
      setSelectedMessages([]);
    }
  }, [selectedMessages, setMessageInfoMessageId, setShowMessageInfoModal, setSelectedMessages]);

  const handlePinMessage = useCallback(async (messageId) => {
    if (!groupId || !messageId) return;
    const result = await groupService.pinMessage(messageId, groupId);
    if (result.success) {
      await loadPinnedMessage();
    }
  }, [groupId, loadPinnedMessage]);

  const handleUnpinMessage = useCallback(async (messageId) => {
    if (!groupId || !messageId) return;
    const result = await groupService.unpinMessage(messageId, groupId);
    if (result.success) {
      setPinnedMessage(null);
    }
  }, [groupId, setPinnedMessage]);

  return {
    handleSendMessage,
    handleTyping,
    handleMessageSelect,
    handleMenuPress,
    handleDeleteMessage,
    handleDeleteMessageConfirm,
    handleDeleteMessageCancel,
    handleReplyMessage,
    handleEditMessage,
    handleCopyMessage,
    handleInfoMessage,
    handlePinMessage,
    handleUnpinMessage,
  };
};

