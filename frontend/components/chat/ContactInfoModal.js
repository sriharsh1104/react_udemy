import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import groupService from '../../services/groupService';
import profileService from '../../services/profileService';
import feedService from '../../services/feedService';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const ContactInfoModal = ({ 
  visible, 
  onClose, 
  contactEmail, 
  userEmail, 
  contactName,
  onSelectGroup,
  messages = []
}) => {
  const [commonGroups, setCommonGroups] = useState([]);
  const [sharedMedia, setSharedMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [showAllMedia, setShowAllMedia] = useState(false);
  const [contactProfile, setContactProfile] = useState(null);
  const [followStatus, setFollowStatus] = useState('not_following');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (visible && contactEmail && userEmail) {
      loadContactInfo();
      loadContactProfile();
      loadFollowStatus();
    } else {
      // Reset when modal closes
      setCommonGroups([]);
      setSharedMedia([]);
      setShowAllGroups(false);
      setShowAllMedia(false);
      setContactProfile(null);
      setFollowStatus('not_following');
      setIsPrivate(false);
    }
  }, [visible, contactEmail, userEmail]);

  const loadContactProfile = async () => {
    try {
      const result = await profileService.getContactProfile(contactEmail);
      if (result.success && result.profile) {
        setContactProfile(result.profile);
      }
    } catch (error) {
      console.error('Error loading contact profile:', error);
    }
  };

  const loadFollowStatus = async () => {
    try {
      const result = await feedService.getProfile(contactEmail);
      if (result.success && result.profile) {
        setFollowStatus(result.profile.followStatus || 'not_following');
        setIsPrivate(result.profile.isPrivate || false);
      }
    } catch (error) {
      console.error('Error loading follow status:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const result = await feedService.followUser(contactEmail);
      if (result.success) {
        setFollowStatus(result.status || 'accepted');
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async () => {
    try {
      const result = await feedService.unfollowUser(contactEmail);
      if (result.success) {
        setFollowStatus('not_following');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const loadContactInfo = async () => {
    setLoading(true);
    try {
      // Get common groups
      const groupsResult = await groupService.getGroups();
      if (groupsResult.success) {
        const allGroups = groupsResult.groups || [];
        // Filter groups where both user and contact are members
        const common = allGroups.filter(group => {
          if (!group.members || group.members.length === 0) return false;
          // Check if contact is a member (handle both object and string formats)
          const contactIsMember = group.members.some(m => {
            const memberEmail = typeof m === 'string' ? m : (m.email || m);
            return memberEmail === contactEmail;
          });
          // Check if user is a member
          const userIsMember = group.members.some(m => {
            const memberEmail = typeof m === 'string' ? m : (m.email || m);
            return memberEmail === userEmail;
          });
          return contactIsMember && userIsMember;
        });
        setCommonGroups(common);
      }

      // Extract shared media from messages
      const media = [];
      messages.forEach(msg => {
        try {
          const parsed = JSON.parse(msg.message);
          if (parsed && parsed.type === 'file' && (parsed.fileType === 'image' || parsed.fileType === 'video')) {
            media.push({
              type: parsed.fileType,
              fileId: parsed.fileId,
              fileName: parsed.fileName,
              timestamp: msg.timestamp,
            });
          }
        } catch {
          // Not a file message, skip
        }
      });
      setSharedMedia(media);
    } catch (error) {
      console.error('Error loading contact info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsernameFromEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  const displayName = contactName || getUsernameFromEmail(contactEmail);
  const groupsToShow = showAllGroups ? commonGroups : commonGroups.slice(0, 5);
  const mediaToShow = showAllMedia ? sharedMedia : sharedMedia.slice(0, 6);

  const renderMediaItem = ({ item }) => {
    return (
      <View style={styles.mediaItem}>
        {item.type === 'image' ? (
          <View style={styles.mediaPlaceholder}>
            <Text style={styles.mediaIcon}>🖼️</Text>
          </View>
        ) : (
          <View style={styles.mediaPlaceholder}>
            <Text style={styles.mediaIcon}>🎥</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contact Info</Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Contact Name */}
            <View style={styles.contactSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.contactName}>{displayName}</Text>
              <Text style={styles.contactEmail}>{contactEmail}</Text>
              {contactProfile && contactProfile.phoneNumbers && contactProfile.phoneNumbers.length > 0 && (
                <View style={styles.phoneNumbersContainer}>
                  {contactProfile.phoneNumbers.map((phone, index) => (
                    <Text key={index} style={styles.contactPhone}>
                      {phone}
                    </Text>
                  ))}
                </View>
              )}

              {/* Follow/Unfollow Button */}
              {contactEmail !== userEmail && (
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    followStatus === 'accepted' 
                      ? { backgroundColor: COLORS.receivedMessage, borderColor: COLORS.divider, borderWidth: 1 }
                      : { backgroundColor: COLORS.primary }
                  ]}
                  onPress={() => {
                    if (followStatus === 'accepted') {
                      handleUnfollow();
                    } else if (followStatus === 'pending') {
                      Alert.alert('Follow Request', 'Follow request already sent. Waiting for approval.');
                    } else {
                      handleFollow();
                    }
                  }}
                >
                  <Text style={[
                    styles.followButtonText,
                    { 
                      color: followStatus === 'accepted' 
                        ? COLORS.text 
                        : COLORS.white 
                    }
                  ]}>
                    {followStatus === 'accepted' 
                      ? 'Following' 
                      : followStatus === 'pending'
                      ? 'Requested'
                      : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <>
                {/* Common Groups */}
                {commonGroups.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Groups in Common</Text>
                    <Text style={styles.sectionSubtitle}>
                      {commonGroups.length} group{commonGroups.length !== 1 ? 's' : ''}
                    </Text>
                    
                    {groupsToShow.map((group, index) => (
                      <TouchableOpacity
                        key={group._id || index}
                        style={styles.groupItem}
                        onPress={() => {
                          onClose();
                          if (onSelectGroup) {
                            onSelectGroup(group._id);
                          }
                        }}
                      >
                        <View style={styles.groupAvatar}>
                          <Text style={styles.groupAvatarText}>👥</Text>
                        </View>
                        <View style={styles.groupInfo}>
                          <Text style={styles.groupName} numberOfLines={1}>
                            {group.name}
                          </Text>
                          <Text style={styles.groupMembers}>
                            {Array.isArray(group.members) ? group.members.length : 0} members
                          </Text>
                        </View>
                        <Text style={styles.groupArrow}>→</Text>
                      </TouchableOpacity>
                    ))}

                    {commonGroups.length > 5 && !showAllGroups && (
                      <TouchableOpacity
                        style={styles.viewMoreButton}
                        onPress={() => setShowAllGroups(true)}
                      >
                        <Text style={styles.viewMoreText}>
                          View {commonGroups.length - 5} more group{commonGroups.length - 5 !== 1 ? 's' : ''}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Shared Media */}
                {sharedMedia.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Shared Media</Text>
                    <Text style={styles.sectionSubtitle}>
                      {sharedMedia.length} file{sharedMedia.length !== 1 ? 's' : ''}
                    </Text>
                    
                    <View style={styles.mediaGrid}>
                      {mediaToShow.map((item, index) => (
                        <View key={index} style={styles.mediaItem}>
                          {item.type === 'image' ? (
                            <View style={styles.mediaPlaceholder}>
                              <Text style={styles.mediaIcon}>🖼️</Text>
                            </View>
                          ) : (
                            <View style={styles.mediaPlaceholder}>
                              <Text style={styles.mediaIcon}>🎥</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>

                    {sharedMedia.length > 6 && !showAllMedia && (
                      <TouchableOpacity
                        style={styles.viewMoreButton}
                        onPress={() => setShowAllMedia(true)}
                      >
                        <Text style={styles.viewMoreText}>
                          View {sharedMedia.length - 6} more file{sharedMedia.length - 6 !== 1 ? 's' : ''}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {commonGroups.length === 0 && sharedMedia.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No shared groups or media</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    height: Platform.OS === 'web' ? '90%' : SCREEN_HEIGHT * 0.9, // Responsive height
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : '100%', // Limit width on web
    alignSelf: 'center', // Center on web
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl + 20 : SPACING.xl, // Extra padding for iOS safe area
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  contactSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  avatar: {
    width: SCREEN_WIDTH < 360 ? 70 : 80, // Smaller on small screens
    height: SCREEN_WIDTH < 360 ? 70 : 80,
    borderRadius: SCREEN_WIDTH < 360 ? 35 : 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  contactName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  contactEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  phoneNumbersContainer: {
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  contactPhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    marginTop: SPACING.xs / 2,
  },
  section: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  groupAvatar: {
    width: SCREEN_WIDTH < 360 ? 44 : 48, // Responsive sizing
    height: SCREEN_WIDTH < 360 ? 44 : 48,
    borderRadius: SCREEN_WIDTH < 360 ? 22 : 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  groupAvatarText: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  groupMembers: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  groupArrow: {
    fontSize: 20,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
  },
  mediaItem: {
    width: SCREEN_WIDTH < 360 ? '30%' : '31%', // Adjust for small screens
    aspectRatio: 1,
    margin: SCREEN_WIDTH < 360 ? '1.5%' : '1%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  mediaPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.receivedMessage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaIcon: {
    fontSize: 32,
  },
  viewMoreButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  viewMoreText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  loadingContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  followButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  followButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default ContactInfoModal;

