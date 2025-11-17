import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './Notification.styles';

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

  // Truncate message if too long - handle file messages
  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return '';
    
    // Check if message is a file message JSON
    try {
      const parsed = JSON.parse(message);
      if (parsed && parsed.type === 'file') {
        // Display file name with appropriate icon
        const fileName = parsed.fileName || 'File';
        const fileType = parsed.fileType || 'file';
        
        // Add icon based on file type
        let icon = '📎'; // Default file icon
        if (fileType === 'image') icon = '🖼️';
        else if (fileType === 'video') icon = '🎥';
        else if (fileType === 'audio') icon = '🎵';
        else if (fileType === 'pdf') icon = '📄';
        
        const displayText = `${icon} ${fileName}`;
        if (displayText.length <= maxLength) return displayText;
        return displayText.substring(0, maxLength) + '...';
      }
    } catch {
      // Not JSON, treat as regular text
    }
    
    // Regular text message
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

export default NotificationContainer;

