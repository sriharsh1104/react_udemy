/**
 * Custom hook for notification handlers
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import logger from '../../../utils/logger';
import encryptionService from '../../../services/encryptionService';
import socketService from '../../../services/socketService';
import contactsService from '../../../services/contactsService';
import { SOCKET_EVENTS } from '../../../constants';

export const useNotificationHandlers = ({
  userEmail,
  contactEmail,
  chatType,
  contacts,
  addNotification,
  clearNotification,
  sendPrivateMessage,
  socket,
  loadContacts,
}) => {
  const createNotification = useCallback((data) => {
    const isViewingThisChat = contactEmail === data.senderEmail && chatType === 'private';
    const senderContact = contacts.find(c => c.email === data.senderEmail);
    const isArchived = senderContact?.isArchived === true;
    
    if (!isViewingThisChat && !isArchived) {
      // Decrypt message for notification
      let messageText = data.message;
      const decryptMessage = async () => {
        try {
          const parsed = JSON.parse(data.message);
          if (parsed && parsed.encrypted && parsed.iv) {
            messageText = await encryptionService.decryptPrivateMessage(
              parsed,
              userEmail,
              data.senderEmail
            );
          }
        } catch (error) {
          logger.log('Message not encrypted or parse error:', error);
        }
        
        let senderName = senderContact?.name;
        if (!senderName) {
          senderName = data.senderEmail?.split('@')[0] || 'Unknown';
        }
        
        const notificationSenderEmail = data.senderEmail;
        
        addNotification({
          senderEmail: notificationSenderEmail,
          senderName: senderName,
          message: messageText,
          timestamp: data.timestamp || new Date(),
          type: 'private',
          onPress: () => {
            // Navigation handled by parent
          },
          onMarkAsRead: async () => {
            await contactsService.markMessagesAsRead(notificationSenderEmail);
            // Immediately reload contacts to update unread count
            if (loadContacts) {
              loadContacts(false);
            }
          },
          onReply: async (replyMessage) => {
            if (replyMessage && replyMessage.trim()) {
              try {
                const messageText = replyMessage.trim();
                const currentSocket = socketService.getSocket();
                if (!currentSocket || !currentSocket.connected) {
                  Alert.alert('Connection Error', 'Not connected to server. Please check your connection.');
                  return;
                }
                
                socketService.emit(SOCKET_EVENTS.LOGIN, { email: userEmail });
                socketService.emit(SOCKET_EVENTS.JOIN_CHAT, {
                  userEmail: userEmail,
                  contactEmail: notificationSenderEmail,
                });
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const isViewingThisChat = contactEmail === notificationSenderEmail && chatType === 'private';
                
                if (isViewingThisChat) {
                  await sendPrivateMessage(messageText);
                } else {
                  const encryptedData = await encryptionService.encryptPrivateMessage(
                    messageText,
                    userEmail,
                    notificationSenderEmail
                  );
                  const encryptedMessage = JSON.stringify(encryptedData);
                  
                  if (!currentSocket || !currentSocket.connected) {
                    throw new Error('Socket disconnected before sending message');
                  }
                  
                  socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
                    message: encryptedMessage,
                    contactEmail: notificationSenderEmail,
                    senderEmail: userEmail,
                  });
                  
                  socketService.emit(SOCKET_EVENTS.TYPING, {
                    contactEmail: notificationSenderEmail,
                    isTyping: false,
                  });
                }
                
                clearNotification(notificationSenderEmail);
              } catch (error) {
                logger.error('Error sending reply:', error);
                Alert.alert('Error', `Failed to send message: ${error.message || 'Please try again.'}`);
              }
            }
          },
        });
      };
      
      decryptMessage();
    }
  }, [userEmail, contactEmail, chatType, contacts, addNotification, clearNotification, sendPrivateMessage, loadContacts]);

  return { createNotification };
};

