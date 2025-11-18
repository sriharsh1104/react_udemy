import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './MessageActionMenu.styles';

const MessageActionMenu = ({
  visible,
  onClose,
  message,
  messageId,
  isSent,
  isPinned,
  isCreator,
  isGroup,
  onDelete,
  onForward,
  onReply,
  onPin,
  onUnpin,
  onCopy,
  onInfo,
  onEdit,
  canEdit,
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  // Check if message is a file/image
  const isFileMessage = (() => {
    try {
      const messageStr = typeof message === 'string' ? message : (message?.message || message?.text || '');
      const parsed = JSON.parse(messageStr);
      return parsed && parsed.type === 'file';
    } catch {
      return false;
    }
  })();

  const actions = [];

  // Copy - Not available for file/image messages
  if (!isFileMessage) {
    actions.push({
      icon: '📋',
      label: 'Copy',
      onPress: onCopy,
    });
  }

  // Edit - Only if message can be edited (not read)
  if (canEdit && onEdit) {
    actions.push({
      icon: '✏️',
      label: 'Edit',
      onPress: onEdit,
    });
  }

  // Reply - Always available
  actions.push({
    icon: '↩️',
    label: 'Reply',
    onPress: onReply,
  });

  // Forward - Always available
  actions.push({
    icon: '➡️',
    label: 'Forward',
    onPress: onForward,
  });

  // Pin/Unpin - Only for creator in groups
  if (isGroup && isCreator) {
    if (isPinned) {
      actions.push({
        icon: '📌',
        label: 'Unpin',
        onPress: onUnpin,
      });
    } else {
      actions.push({
        icon: '📌',
        label: 'Pin',
        onPress: onPin,
      });
    }
  }

  // Info - Always available
  actions.push({
    icon: 'ℹ️',
    label: 'Info',
    onPress: onInfo,
  });

  // Delete - Always available (user can delete their own messages)
  actions.push({
    icon: '🗑️',
    label: 'Delete',
    onPress: onDelete,
    destructive: true,
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.menuContainer, { backgroundColor: colors.background }]}
          onStartShouldSetResponder={() => true}
        >
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                { borderBottomColor: colors.divider },
                index === actions.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => {
                action.onPress();
                onClose();
              }}
            >
              <Text style={styles.menuIcon}>{action.icon}</Text>
              <Text
                style={[
                  styles.menuLabel,
                  { color: action.destructive ? '#EF4444' : colors.text },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default MessageActionMenu;

