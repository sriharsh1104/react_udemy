import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

const ChatActionBar = ({
  visible,
  selectedCount,
  onDelete,
  onPin,
  onArchive,
  onMute,
  onClose,
  isPinned = false,
  isArchived = false,
  isMuted = false,
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
      <View style={styles.content}>
        <Text style={[styles.countText, { color: colors.text }]}>
          {selectedCount} selected
        </Text>
        
        <View style={styles.actionsContainer}>
          {/* Delete */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.receivedMessage }]}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>

          {/* Pin/Unpin */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.receivedMessage }]}
            onPress={onPin}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.actionIcon}>{isPinned ? '📌' : '📍'}</Text>
          </TouchableOpacity>

          {/* Archive/Unarchive */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.receivedMessage }]}
            onPress={onArchive}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.actionIcon}>{isArchived ? '📦' : '📁'}</Text>
          </TouchableOpacity>

          {/* Mute/Unmute */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.receivedMessage }]}
            onPress={onMute}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.actionIcon}>{isMuted ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>

          {/* Close */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.receivedMessage }]}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.actionIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
});

export default ChatActionBar;

