import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import styles from '../StatusFeed.styles';

const PostMenuModal = ({
  visible,
  onClose,
  selectedPost,
  userEmail,
  savedPosts,
  onForward,
  onSave,
  onDelete,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.postMenuContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.postMenuOption, { borderBottomColor: colors.divider }]}
            onPress={onForward}
            activeOpacity={0.7}
          >
            <Text style={[styles.postMenuOptionText, { color: colors.text }]}>Forward</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.postMenuOption, { borderBottomColor: colors.divider }]}
            onPress={onSave}
            activeOpacity={0.7}
          >
            <Text style={[styles.postMenuOptionText, { color: colors.text }]}>
              {selectedPost && savedPosts.has(selectedPost.statusId) ? 'Unsave' : 'Save'}
            </Text>
          </TouchableOpacity>
          {selectedPost && selectedPost.userEmail === userEmail && (
            <TouchableOpacity
              style={[styles.postMenuOption, { borderBottomColor: colors.divider }]}
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <Text style={[styles.postMenuOptionText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.postMenuOption}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.postMenuOptionText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default PostMenuModal;

