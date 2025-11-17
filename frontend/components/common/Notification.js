import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  TextInput,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

const Notification = ({ notification, onDismiss, onPress, onMarkAsRead, onReply, onSendReply }) => {
  const { colors } = useTheme();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const slideAnim = React.useRef(new Animated.Value(-200)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
    handleDismiss();
  };

  const handleMarkAsRead = () => {
    if (onMarkAsRead) {
      onMarkAsRead();
    }
    handleDismiss();
  };

  const handleReply = () => {
    setShowReplyInput(true);
  };

  const handleSendReply = () => {
    if (replyText.trim() && onSendReply) {
      console.log('📤 Notification: Sending reply...', {
        notificationId: notification.id,
        senderEmail: notification.senderEmail,
        message: replyText.trim(),
        hasOnSendReply: !!onSendReply
      });
      onSendReply(notification, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    } else {
      console.warn('⚠️ Notification: Cannot send reply', {
        hasText: !!replyText.trim(),
        hasOnSendReply: !!onSendReply
      });
    }
  };

  const handleCancelReply = () => {
    setReplyText('');
    setShowReplyInput(false);
  };

  // Truncate message if too long
  const truncateMessage = (message, maxLength = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.divider,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <TouchableOpacity
          style={styles.content}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {notification.senderName ? notification.senderName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={[styles.senderName, { color: colors.text }]} numberOfLines={1}>
                {notification.senderName || notification.senderEmail?.split('@')[0] || 'Unknown'}
              </Text>
              <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                {formatTime(notification.timestamp)}
              </Text>
            </View>
            <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
              {truncateMessage(notification.message)}
            </Text>
          </View>
        </TouchableOpacity>

        {!showReplyInput && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.replyButton, { backgroundColor: colors.primary }]}
              onPress={handleReply}
            >
              <Text style={styles.replyText}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.markReadButton, { backgroundColor: colors.textSecondary }]}
              onPress={handleMarkAsRead}
            >
              <Text style={styles.markReadText}>Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
            >
              <Text style={[styles.dismissText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {showReplyInput && (
        <View style={styles.replyContainer}>
          <TextInput
            style={[styles.replyInput, {
              backgroundColor: colors.inputBackground,
              color: colors.inputText,
              borderColor: colors.divider,
            }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.inputPlaceholder}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            autoFocus
            maxLength={1000}
          />
          <View style={styles.replyActions}>
            <TouchableOpacity
              style={[styles.sendButton, {
                backgroundColor: replyText.trim() ? colors.primary : colors.textLight,
              }]}
              onPress={handleSendReply}
              disabled={!replyText.trim()}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelReplyButton}
              onPress={handleCancelReply}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const NotificationContainer = ({ notifications, onDismiss, onPress, onMarkAsRead, onReply, onSendReply }) => {
  if (notifications.length === 0) return null;

  return (
    <View style={[styles.wrapper, { pointerEvents: 'box-none' }]}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss(notification.id)}
          onPress={() => onPress && onPress(notification)}
          onMarkAsRead={() => onMarkAsRead && onMarkAsRead(notification)}
          onReply={() => onReply && onReply(notification)}
          onSendReply={(notif, message) => onSendReply && onSendReply(notif, message)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: SPACING.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs / 2,
  },
  senderName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    flex: 1,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginLeft: SPACING.xs,
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  replyButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.xs,
  },
  replyText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.white,
  },
  markReadButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.xs,
  },
  markReadText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.white,
  },
  dismissButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 18,
    fontWeight: '300',
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingLeft: 56, // Align with avatar
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    maxHeight: 80,
    marginRight: SPACING.xs,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  sendIcon: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelReplyButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 18,
    fontWeight: '300',
  },
});

export default NotificationContainer;

