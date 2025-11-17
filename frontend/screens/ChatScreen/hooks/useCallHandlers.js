/**
 * Custom hook for call handlers
 * Extracts call-related logic from ChatScreen
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import logger from '../../../utils/logger';

export const useCallHandlers = ({
  chatType,
  contactEmail,
  groupId,
  initiateCallHook,
  setShowCallHistory,
}) => {
  const handleAudioCall = useCallback(async () => {
    try {
      if (chatType === 'group' && groupId) {
        await initiateCallHook(null, groupId, 'audio');
      } else if (contactEmail) {
        await initiateCallHook(contactEmail, null, 'audio');
      }
    } catch (error) {
      logger.error('Error initiating audio call:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  }, [chatType, groupId, contactEmail, initiateCallHook]);

  const handleVideoCall = useCallback(async () => {
    try {
      if (chatType === 'group' && groupId) {
        await initiateCallHook(null, groupId, 'video');
      } else if (contactEmail) {
        await initiateCallHook(contactEmail, null, 'video');
      }
    } catch (error) {
      logger.error('Error initiating video call:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  }, [chatType, groupId, contactEmail, initiateCallHook]);

  const handleCallHistory = useCallback(() => {
    setShowCallHistory(true);
  }, [setShowCallHistory]);

  const handleCallFromHistory = useCallback(async (type, targetEmail, targetGroupId) => {
    try {
      setShowCallHistory(false);
      if (targetGroupId) {
        await initiateCallHook(null, targetGroupId, type);
      } else if (targetEmail) {
        await initiateCallHook(targetEmail, null, type);
      }
    } catch (error) {
      logger.error('Error calling from history:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  }, [initiateCallHook, setShowCallHistory]);

  return {
    handleAudioCall,
    handleVideoCall,
    handleCallHistory,
    handleCallFromHistory,
  };
};

