import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';

const MessageItem = ({ message, username, timestamp, isSystemMessage, isSent }) => {
  // Determine if message is sent by current user (for WhatsApp-like alignment)
  const isMyMessage = isSent !== undefined ? isSent : false;
  
  if (isSystemMessage) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isMyMessage ? styles.sentContainer : styles.receivedContainer]}>
      {!isMyMessage && (
        <Text style={styles.username} numberOfLines={1}>{username}</Text>
      )}
      <View style={[styles.bubble, isMyMessage ? styles.sentBubble : styles.receivedBubble]}>
        <Text style={[styles.messageText, isMyMessage ? styles.sentText : styles.receivedText]}>
          {message}
        </Text>
        <View style={styles.timestampContainer}>
          <Text style={[styles.timestamp, isMyMessage ? styles.sentTimestamp : styles.receivedTimestamp]}>
            {new Date(timestamp).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    maxWidth: '85%',
  },
  sentContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.message,
    maxWidth: '100%',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sentBubble: {
    backgroundColor: COLORS.sentMessage,
    borderBottomRightRadius: BORDER_RADIUS.xs, // WhatsApp-style tail
  },
  receivedBubble: {
    backgroundColor: COLORS.receivedMessage,
    borderBottomLeftRadius: BORDER_RADIUS.xs, // WhatsApp-style tail
  },
  username: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    paddingHorizontal: SPACING.sm,
  },
  messageText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 20,
  },
  sentText: {
    color: COLORS.white,
  },
  receivedText: {
    color: COLORS.text,
  },
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  timestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginLeft: SPACING.xs,
  },
  sentTimestamp: {
    color: COLORS.white,
    opacity: 0.8,
  },
  receivedTimestamp: {
    color: COLORS.textSecondary,
  },
  systemContainer: {
    alignSelf: 'center',
    backgroundColor: COLORS.systemMessage,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.sm,
    maxWidth: '90%',
  },
  systemText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MessageItem;
