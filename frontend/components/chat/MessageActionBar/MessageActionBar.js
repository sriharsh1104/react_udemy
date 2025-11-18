import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './MessageActionBar.styles';

const MessageActionBar = ({
  visible,
  selectedCount,
  isCreator,
  isGroup,
  isPinned,
  onCopy,
  onReply,
  onForward,
  onPin,
  onUnpin,
  onDelete,
  onInfo,
  onClose,
  onEdit,
  canEdit,
}) => {
  const { colors } = useTheme();

  if (!visible || selectedCount === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.closeIcon, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>

        <Text style={[styles.countText, { color: colors.text }]}>
          {selectedCount} {selectedCount === 1 ? 'message' : 'messages'}
        </Text>

        <View style={styles.actionsContainer}>
          {/* Copy */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onCopy}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.actionIcon}>📋</Text>
          </TouchableOpacity>

          {/* Edit - Only show if message can be edited (not read) */}
          {canEdit && onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.actionIcon}>✏️</Text>
            </TouchableOpacity>
          )}

          {/* Reply */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onReply}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.actionIcon}>↩️</Text>
          </TouchableOpacity>

          {/* Forward */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onForward}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.actionIcon}>➡️</Text>
          </TouchableOpacity>

          {/* Pin/Unpin - Only for creator in groups */}
          {isGroup && isCreator && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={isPinned ? onUnpin : onPin}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.actionIcon}>{isPinned ? '📌' : '📌'}</Text>
            </TouchableOpacity>
          )}

          {/* Info */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onInfo}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.actionIcon}>ℹ️</Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.actionIcon, styles.deleteIcon]}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default MessageActionBar;

