import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

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

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  countText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    flex: 1,
    marginLeft: SPACING.xs,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  actionButton: {
    padding: SPACING.xs,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 22,
  },
  deleteIcon: {
    // Keep same for now, can add red tint if needed
  },
});

export default MessageActionBar;

