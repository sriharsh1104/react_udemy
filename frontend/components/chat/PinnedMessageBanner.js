import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

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

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  pinIcon: {
    fontSize: 16,
  },
  messageContainer: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  senderName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2,
  },
  messageText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PinnedMessageBanner;

