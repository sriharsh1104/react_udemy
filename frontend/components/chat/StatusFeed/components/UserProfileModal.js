import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import styles from '../StatusFeed.styles';

const UserProfileModal = ({
  visible,
  onClose,
  selectedUserEmail,
  selectedUserProfile,
  loadingProfile,
  userEmail,
  onFollow,
  onUnfollow,
  showAlert,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.userProfileModal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Profile</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseButton}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {loadingProfile ? (
            <View style={styles.profileLoadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : selectedUserProfile ? (
            <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
              <View style={styles.profileSection}>
                <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.profileAvatarText, { color: colors.white }]}>
                    {selectedUserProfile.name?.charAt(0).toUpperCase() || selectedUserProfile.email?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.profileNameRow}>
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {selectedUserProfile.name || selectedUserProfile.email?.split('@')[0] || 'User'}
                  </Text>
                  {selectedUserProfile.isPrivate && (
                    <Text style={styles.privateBadge}>🔒</Text>
                  )}
                </View>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                  {selectedUserProfile.email}
                </Text>

                {/* Stats Row */}
                <View style={styles.profileStats}>
                  <View style={styles.profileStatItem}>
                    <Text style={[styles.profileStatNumber, { color: colors.text }]}>
                      {selectedUserProfile.postsCount || 0}
                    </Text>
                    <Text style={[styles.profileStatLabel, { color: colors.textSecondary }]}>
                      Posts
                    </Text>
                  </View>
                  <View style={styles.profileStatItem}>
                    <Text style={[styles.profileStatNumber, { color: colors.text }]}>
                      {selectedUserProfile.followersCount || 0}
                    </Text>
                    <Text style={[styles.profileStatLabel, { color: colors.textSecondary }]}>
                      Followers
                    </Text>
                  </View>
                  <View style={styles.profileStatItem}>
                    <Text style={[styles.profileStatNumber, { color: colors.text }]}>
                      {selectedUserProfile.followingCount || 0}
                    </Text>
                    <Text style={[styles.profileStatLabel, { color: colors.textSecondary }]}>
                      Following
                    </Text>
                  </View>
                </View>

                {/* Follow/Unfollow Button */}
                {selectedUserEmail !== userEmail && (
                  <TouchableOpacity
                    style={[
                      styles.followButton,
                      selectedUserProfile.followStatus === 'accepted' 
                        ? { backgroundColor: colors.surface, borderColor: colors.divider }
                        : { backgroundColor: colors.primary }
                    ]}
                    onPress={() => {
                      if (selectedUserProfile.followStatus === 'accepted') {
                        onUnfollow(selectedUserEmail);
                      } else if (selectedUserProfile.followStatus === 'pending') {
                        showAlert('Follow Request', 'Follow request already sent. Waiting for approval.', { type: 'info' });
                      } else {
                        onFollow(selectedUserEmail);
                      }
                    }}
                  >
                    <Text style={[
                      styles.followButtonText,
                      { 
                        color: selectedUserProfile.followStatus === 'accepted' 
                          ? colors.text 
                          : colors.white 
                      }
                    ]}>
                      {selectedUserProfile.followStatus === 'accepted' 
                        ? 'Following' 
                        : selectedUserProfile.followStatus === 'pending'
                        ? 'Requested'
                        : selectedUserProfile.isPrivate
                        ? 'Follow'
                        : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                )}

                {!selectedUserProfile.canViewPosts && selectedUserEmail !== userEmail && (
                  <View style={styles.privateAccountNotice}>
                    <Text style={[styles.privateAccountText, { color: colors.textSecondary }]}>
                      🔒 This account is private. Follow to see their posts.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

export default UserProfileModal;

