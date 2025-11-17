/**
 * Custom hook for clear chat functionality
 */

import { useCallback } from 'react';
import logger from '../../../utils/logger';
import contactsService from '../../../services/contactsService';
import groupService from '../../../services/groupService';
import socketService from '../../../services/socketService';
import { SOCKET_EVENTS } from '../../../constants';

export const useClearChat = ({
  chatType,
  contactEmail,
  groupId,
  userEmail,
  setShowClearChatModal,
}) => {
  const handleClearChat = useCallback(() => {
    const actualChatType = chatType || (groupId ? 'group' : contactEmail ? 'private' : null);
    if (!actualChatType) {
      logger.error('Cannot determine chat type!');
      setShowClearChatModal(true);
      return;
    }
    setShowClearChatModal(true);
  }, [chatType, groupId, contactEmail, setShowClearChatModal]);

  const executeClearChat = useCallback(async (actualChatType) => {
    try {
      let result;
      
      if (actualChatType === 'group') {
        if (!groupId) {
          logger.error('Group ID is missing!', { groupId, chatType, actualChatType });
          return;
        }
        result = await groupService.clearChat(groupId);
      } else {
        if (!contactEmail) {
          logger.error('Contact email is missing!', { contactEmail, chatType, actualChatType });
          return;
        }
        result = await contactsService.clearChat(contactEmail);
      }
      
      if (result.success) {
        setTimeout(() => {
          if (actualChatType === 'group') {
            if (groupId) {
              socketService.emit(SOCKET_EVENTS.JOIN_GROUP, {
                groupId,
                userEmail,
              });
            }
          } else {
            if (contactEmail) {
              socketService.emit(SOCKET_EVENTS.JOIN_CHAT, {
                userEmail,
                contactEmail,
              });
            }
          }
        }, 2000);
      } else {
        logger.error('API call failed:', result);
      }
    } catch (error) {
      logger.error('Error clearing chat:', error);
    }
  }, [chatType, contactEmail, groupId, userEmail]);

  return {
    handleClearChat,
    executeClearChat,
  };
};

