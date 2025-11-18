/**
 * Custom hook for ChatScreen socket event handlers
 * Extracts socket event logic from ChatScreen to reduce file size
 */

import { useEffect } from 'react';
import socketService from '../../../services/socketService';
import { SOCKET_EVENTS } from '../../../constants';
import contactsService from '../../../services/contactsService';
import encryptionService from '../../../services/encryptionService';
import logger from '../../../utils/logger';

export const useChatScreenSocketEvents = ({
  socket,
  userEmail,
  contactEmail,
  chatType,
  contacts,
  groupId,
  setContactEmail,
  setChatType,
  setContactName,
  setContacts,
  setPinnedMessage,
  addNotification,
  clearNotification,
  sendPrivateMessage,
  loadContacts,
  loadPinnedMessage,
  showAlert,
}) => {
  // Socket event listener for private messages
  useEffect(() => {
    if (!socket || !userEmail) return;

    const handleAnyPrivateMessage = async (data) => {
      if (data.senderEmail && data.senderEmail !== userEmail) {
        const isViewingThisChat = contactEmail === data.senderEmail && chatType === 'private';
        const senderContact = contacts.find(c => c.email === data.senderEmail);
        const isArchived = senderContact?.isArchived === true;
        
        if (!isViewingThisChat && !isArchived) {
          let messageText = data.message;
          try {
            const parsed = JSON.parse(data.message);
            if (parsed && parsed.encrypted && parsed.iv) {
              messageText = await encryptionService.decryptPrivateMessage(parsed, userEmail, data.senderEmail);
            }
          } catch (error) {
            logger.log('Message not encrypted or parse error:', error);
          }

          let senderName = senderContact?.name || data.senderEmail?.split('@')[0] || 'Unknown';
          const notificationSenderEmail = data.senderEmail;
          
          addNotification({
            senderEmail: notificationSenderEmail,
            senderName: senderName,
            message: messageText,
            timestamp: data.timestamp || new Date(),
            type: 'private',
            onPress: () => {
              setContactEmail(notificationSenderEmail);
              setChatType('private');
              setContactName(senderName);
              clearNotification(notificationSenderEmail);
            },
            onMarkAsRead: async () => {
              await contactsService.markMessagesAsRead(notificationSenderEmail);
              // Immediately reload contacts to update unread count
              loadContacts(false);
            },
            onReply: async (replyMessage) => {
              if (replyMessage && replyMessage.trim()) {
                try {
                  const messageText = replyMessage.trim();
                  const currentSocket = socketService.getSocket();
                  if (!currentSocket || !currentSocket.connected) {
                    showAlert('Connection Error', 'Not connected to server. Please check your connection.', 'error');
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
                  showAlert('Error', `Failed to send message: ${error.message || 'Please try again.'}`, 'error');
                }
              }
            },
          });
        }
      }
    };

    socket.on('privateMessage', handleAnyPrivateMessage);
    return () => {
      socket.off('privateMessage', handleAnyPrivateMessage);
    };
  }, [socket, userEmail, contactEmail, chatType, contacts, addNotification, clearNotification, sendPrivateMessage, setContactEmail, setChatType, setContactName, loadContacts, showAlert]);

  // Socket events for contacts/groups updates
  useEffect(() => {
    if (!socket || !userEmail) return;

    const handleContactsUpdated = (data) => {
      // Optimize: Only make API call for actions that require full data refresh
      // For message_sent/message_received, update local state instead
      if (data && data.action) {
        const action = data.action;
        
        if (action === 'message_sent' || action === 'message_received') {
          // Optimize: Update local state instead of API call
          // Move contact to top and update last message timestamp
          if (data.contactEmail) {
            setContacts((prev) => {
              const contactIndex = prev.findIndex(c => c.email === data.contactEmail);
              
              if (contactIndex === -1) {
                // Contact not in list - might be new, need full refresh
                loadContacts(false);
                return prev;
              }
              
              // Move contact to top
              const updatedContacts = [...prev];
              const contact = updatedContacts[contactIndex];
              updatedContacts.splice(contactIndex, 1);
              
              // Update last message timestamp to move to top
              const updatedContact = {
                ...contact,
                lastMessageTimestamp: new Date().toISOString(),
              };
              
              // Insert at beginning (most recent)
              updatedContacts.unshift(updatedContact);
              
              return updatedContacts;
            });
          }
          return; // Don't make API call for message_sent/received
        }
        
        // For contact_unarchived: Check if contact already exists and is active
        // If yes, treat it like message_sent (just update locally)
        if (action === 'contact_unarchived' && data.contactEmail) {
          // Check current state to see if contact exists and is active
          const contactExists = contacts.find(c => c.email === data.contactEmail);
          const wasArchived = contactExists?.isArchived === true;
          
          // If contact already exists and was NOT archived, just update locally (no API call)
          if (contactExists && !wasArchived) {
            setContacts((prev) => {
              const contactIndex = prev.findIndex(c => c.email === data.contactEmail);
              
              if (contactIndex === -1) {
                return prev; // Shouldn't happen, but safety check
              }
              
              // Contact already active - just move to top (like message_sent)
              const updatedContacts = [...prev];
              const contact = updatedContacts[contactIndex];
              updatedContacts.splice(contactIndex, 1);
              
              const updatedContact = {
                ...contact,
                lastMessageTimestamp: new Date().toISOString(),
                isArchived: false, // Ensure it's not archived
              };
              
              updatedContacts.unshift(updatedContact);
              return updatedContacts;
            });
            return; // No API call needed
          }
          
          // Contact doesn't exist or was archived - need full refresh
          loadContacts(false);
          return;
        }
        
        // Actions that require full API refresh (contact added/deleted/archived, etc.)
        const requiresFullRefresh = [
          'added',
          'deleted',
          'archived',
          'unarchived',
        ];
        
        if (requiresFullRefresh.includes(action)) {
          // Full refresh needed - make API call
          loadContacts(false);
        } else {
          // Unknown action - make API call to be safe
          loadContacts(false);
        }
      } else {
        // No action specified - make API call to be safe
        loadContacts(false);
      }
    };

    const handleGroupsUpdated = () => {
      loadContacts(false);
    };

    const handleContactOnlineStatus = (data) => {
      if (data && data.contactEmail) {
        setContacts((prev) =>
          prev.map((contact) =>
            contact.email === data.contactEmail
              ? { ...contact, isOnline: data.isOnline }
              : contact
          )
        );
      }
    };

    socket.on(SOCKET_EVENTS.CONTACTS_UPDATED, handleContactsUpdated);
    socket.on(SOCKET_EVENTS.GROUPS_UPDATED, handleGroupsUpdated);
    socket.on(SOCKET_EVENTS.CONTACT_ONLINE_STATUS, handleContactOnlineStatus);
    
    return () => {
      socket.off(SOCKET_EVENTS.CONTACTS_UPDATED, handleContactsUpdated);
      socket.off(SOCKET_EVENTS.GROUPS_UPDATED, handleGroupsUpdated);
      socket.off(SOCKET_EVENTS.CONTACT_ONLINE_STATUS, handleContactOnlineStatus);
    };
  }, [socket, userEmail, loadContacts, setContacts, contacts]);

  // Pinned message socket events
  useEffect(() => {
    if (!socket || chatType !== 'group' || !groupId) return;

    const handleMessagePinned = async (data) => {
      if (data.groupId === groupId) {
        await loadPinnedMessage();
      }
    };

    const handleMessageUnpinned = (data) => {
      if (data.groupId === groupId) {
        setPinnedMessage(null);
      }
    };

    socket.on('messagePinned', handleMessagePinned);
    socket.on('messageUnpinned', handleMessageUnpinned);

    return () => {
      socket.off('messagePinned', handleMessagePinned);
      socket.off('messageUnpinned', handleMessageUnpinned);
    };
  }, [socket, chatType, groupId, loadPinnedMessage, setPinnedMessage]);
};

