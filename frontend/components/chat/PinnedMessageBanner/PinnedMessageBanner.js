import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './PinnedMessageBanner.styles';

const PinnedMessageBanner = ({ pinnedMessage, onPress, onClose, isCreator }) => {
  const { colors } = useTheme();

  if (!pinnedMessage) return null;

  // Extract message text (handle JSON file messages)
  const getMessageText = () => {
    if (!pinnedMessage.message) return '';
    try {
      const parsed = JSON.parse(pinnedMessage.message);
      if (parsed && parsed.type === 'file') {
        return `📎 ${parsed.fileName || 'File'}`;
      }
    } catch {
      // Not JSON, return as-is
    }
    return pinnedMessage.message.length > 60 
      ? pinnedMessage.message.substring(0, 60) + '...' 
      : pinnedMessage.message;
  };

  // Get sender name
  const getSenderName = () => {
    if (!pinnedMessage.senderEmail) return 'Unknown';
    return pinnedMessage.senderEmail.split('@')[0];
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.pinIcon}>📌</Text>
        </View>
        <View style={styles.messageContainer}>
          <Text style={[styles.senderName, { color: colors.text }]} numberOfLines={1}>
            {getSenderName()}
          </Text>
          <Text style={[styles.messageText, { color: colors.textSecondary }]} numberOfLines={1}>
            {getMessageText()}
          </Text>
        </View>
        {isCreator && onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default PinnedMessageBanner;

