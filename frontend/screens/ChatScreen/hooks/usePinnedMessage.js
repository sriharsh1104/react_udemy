/**
 * Custom hook for pinned message functionality
 */

import { useEffect, useCallback } from 'react';
import logger from '../../../utils/logger';
import groupService from '../../../services/groupService';
import encryptionService from '../../../services/encryptionService';

export const usePinnedMessage = ({
  chatType,
  groupId,
  pinnedMessage,
  setPinnedMessage,
  loadingPinnedMessage,
  setLoadingPinnedMessage,
  messages,
  flatListRef,
}) => {
  const loadPinnedMessage = useCallback(async () => {
    if (chatType !== 'group' || !groupId) {
      setPinnedMessage(null);
      return;
    }

    setLoadingPinnedMessage(true);
    try {
      const result = await groupService.getPinnedMessages(groupId);
      if (result.success && result.pinnedMessages && result.pinnedMessages.length > 0) {
        const latestPinned = result.pinnedMessages[0];
        let decryptedMessage = latestPinned.message;
        try {
          const parsed = JSON.parse(latestPinned.message);
          if (parsed && parsed.encrypted && parsed.iv) {
            decryptedMessage = await encryptionService.decryptGroupMessage(parsed, groupId);
          }
        } catch {
          // Not encrypted, use as-is
        }
        setPinnedMessage({
          ...latestPinned,
          message: decryptedMessage,
        });
      } else {
        setPinnedMessage(null);
      }
    } catch (error) {
      logger.error('Error loading pinned message:', error);
      setPinnedMessage(null);
    } finally {
      setLoadingPinnedMessage(false);
    }
  }, [chatType, groupId, setPinnedMessage, setLoadingPinnedMessage]);

  useEffect(() => {
    if (chatType === 'group' && groupId) {
      loadPinnedMessage();
    } else {
      setPinnedMessage(null);
    }
  }, [groupId, chatType, loadPinnedMessage, setPinnedMessage]);

  const handlePinnedMessagePress = useCallback(() => {
    if (!pinnedMessage || !pinnedMessage._id) return;
    
    const messageIndex = messages.findIndex(
      (msg) => (msg.messageId === pinnedMessage._id || msg._id === pinnedMessage._id)
    );
    
    if (messageIndex >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: messageIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [pinnedMessage, messages, flatListRef]);

  return {
    loadPinnedMessage,
    handlePinnedMessagePress,
  };
};

