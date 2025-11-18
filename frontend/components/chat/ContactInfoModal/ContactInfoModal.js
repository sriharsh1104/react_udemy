import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { COLORS } from '../../../constants';
import groupService from '../../../services/groupService';
import profileService from '../../../services/profileService';
import feedService from '../../../services/feedService';
import fileUploadService from '../../../services/fileUploadService';
import FullScreenImageViewer from '../FullScreenImageViewer';
import AlertModal from '../../common/AlertModal/AlertModal';
import useAlertModal from '../../../hooks/useAlertModal';
import styles from './ContactInfoModal.styles';

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
  const { showAlert, alertState, hideAlert } = useAlertModal();
  const [commonGroups, setCommonGroups] = useState([]);
  const [sharedMedia, setSharedMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [showAllMedia, setShowAllMedia] = useState(false);
  const [contactProfile, setContactProfile] = useState(null);
  const [followStatus, setFollowStatus] = useState('not_following');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [mediaUrls, setMediaUrls] = useState({}); // Store URLs for each media item

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
      setSelectedImage(null);
      setShowFullScreen(false);
      setMediaUrls({});
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
      const urls = {};
      messages.forEach(msg => {
        try {
          const parsed = JSON.parse(msg.message);
          if (parsed && parsed.type === 'file' && (parsed.fileType === 'image' || parsed.fileType === 'video')) {
            const mediaItem = {
              type: parsed.fileType,
              fileId: parsed.fileId,
              fileName: parsed.fileName,
              timestamp: msg.timestamp,
            };
            media.push(mediaItem);
            // Load image URL from server
            fileUploadService.getFileViewUrl(parsed.fileId).then(url => {
              urls[parsed.fileId] = url;
              setMediaUrls(prev => ({ ...prev, [parsed.fileId]: url }));
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
                      showAlert('Follow Request', 'Follow request already sent. Waiting for approval.', { type: 'info' });
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
                      {mediaToShow.map((item, index) => {
                        const imageUrl = mediaUrls[item.fileId];
                        return (
                          <TouchableOpacity
                            key={index}
                            style={styles.mediaItem}
                            onPress={() => {
                              if (item.type === 'image' && imageUrl) {
                                setSelectedImage(imageUrl);
                                setShowFullScreen(true);
                              }
                            }}
                            activeOpacity={0.8}
                          >
                            {item.type === 'image' ? (
                              imageUrl ? (
                                <Image
                                  source={{ uri: imageUrl }}
                                  style={styles.mediaImage}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={styles.mediaPlaceholder}>
                                  <ActivityIndicator size="small" color={COLORS.primary} />
                                </View>
                              )
                            ) : (
                              <View style={styles.mediaPlaceholder}>
                                <Text style={styles.mediaIcon}>🎥</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
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

      {/* Full Screen Image Viewer */}
      {selectedImage && (
        <FullScreenImageViewer
          visible={showFullScreen}
          imageUri={selectedImage}
          onClose={() => {
            setShowFullScreen(false);
            setSelectedImage(null);
          }}
        />
      )}

      {/* Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttonText={alertState.buttonText}
        type={alertState.type}
        onClose={hideAlert}
      />
    </Modal>
  );
};

export default ContactInfoModal;

