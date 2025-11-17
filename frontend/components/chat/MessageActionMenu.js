import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    borderRadius: BORDER_RADIUS.xl,
    minWidth: 200,
    maxWidth: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
    width: 30,
  },
  menuLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    flex: 1,
  },
});

export default MessageActionMenu;

