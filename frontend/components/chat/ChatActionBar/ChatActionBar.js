import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './ChatActionBar.styles';

const ChatActionBar = ({
  visible,
  selectedCount,
  onDelete,
  onPin,
  onArchive,
  onMute,
  onFavorite,
  onClose,
  isPinned = false,
  isArchived = false,
  isMuted = false,
  isFavorite = false,
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

          {/* Favorite/Unfavorite */}
          {onFavorite && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.receivedMessage }]}
              onPress={onFavorite}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.actionIcon}>
                {isFavorite ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          )}

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

export default ChatActionBar;

