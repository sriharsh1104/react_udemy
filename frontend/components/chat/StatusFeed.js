import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Platform,
  TextInput,
  Animated,
  ScrollView,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import contactsService from '../../services/contactsService';
import statusService from '../../services/statusService';
import feedService from '../../services/feedService';
import profileService from '../../services/profileService';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { API_CONFIG } from '../../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Status Content Viewer Component
const StatusContentView = ({ status }) => {
  const { colors } = useTheme();
  const isVideo = status?.statusType === 'video' && status?.statusUrl;
  // Always call hook, but pass null if not video
  const player = useVideoPlayer(isVideo ? status.statusUrl : '', (player) => {
    if (isVideo && player) {
      player.loop = true;
      player.play();
    }
  });

  if (!status || !status.statusUrl) {
    return (
      <View style={styles.statusContentView}>
        <Text style={{ color: COLORS.white }}>No status content</Text>
      </View>
    );
  }

  return (
    <View style={styles.statusContentView}>
      {isVideo ? (
        <VideoView
          player={player}
          style={styles.statusVideo}
          contentFit="contain"
          nativeControls={false}
        />
      ) : (
        <Image
          source={{ uri: status.statusUrl }}
          style={styles.statusImage}
          resizeMode="contain"
        />
      )}
      <View style={styles.statusViewerInfo}>
        <Text style={styles.statusViewerName}>
          {status.name || status.email?.split('@')[0]}
        </Text>
        <Text style={styles.statusViewerTime}>
          {status.statusTime || 'Just now'}
        </Text>
      </View>
    </View>
  );
};

const StatusFeed = ({ userEmail, contacts = [] }) => {
  const { colors } = useTheme();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [likedStatuses, setLikedStatuses] = useState(new Set());
  const doubleTapRefs = useRef({});
  const likeAnimations = useRef({});
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    loadFeed();
  }, [contacts, userEmail]);

  const loadFeed = async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const result = await feedService.getFeed(pageNum, 10);
      if (result.success) {
        if (append) {
          setFeed(prev => [...prev, ...result.feed]);
        } else {
          setFeed(result.feed);
        }
        setHasMore(result.hasMore);
        setPage(pageNum);
        
        // Track liked statuses
        const liked = new Set();
        result.feed.forEach(item => {
          if (item.isLiked) {
            liked.add(item.statusId);
          }
        });
        setLikedStatuses(liked);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadFeed(page + 1, true);
    }
  };

  const handleRefresh = () => {
    loadFeed(1, false);
  };

  const handleAddStatus = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to add status');
        return;
      }

      // Show options: Gallery, Camera, or Cancel
      Alert.alert(
        'Add Status',
        'Choose an option',
        [
          { 
            text: '📷 Gallery', 
            onPress: () => pickFromGallery() 
          },
          { 
            text: '📸 Camera', 
            onPress: () => pickFromCamera() 
          },
          { 
            text: 'Cancel', 
            style: 'cancel' 
          },
        ]
      );
    } catch (error) {
      console.error('Error adding status:', error);
      Alert.alert('Error', 'Failed to add status');
    }
  };

  const pickFromGallery = async () => {
    try {
      // On web, permissions are handled differently
      if (Platform.OS === 'web') {
        // For web, use file input approach
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,video/*';
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              const isVideo = file.type.startsWith('video/');
              // For web, we need to create a File object that can be used
              const fileObj = {
                uri: URL.createObjectURL(file), // Blob URL for preview
                file: file, // Actual File object for upload
                type: isVideo ? 'video' : 'image',
                mimeType: file.type,
                name: file.name || `status_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
                size: file.size || 0,
              };
              await uploadStatus(fileObj, isVideo ? 'video' : 'image');
            }
            resolve();
          };
          input.oncancel = () => resolve();
          input.click();
        });
      }

      // For mobile platforms
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions');
        return;
      }

      // Directly open gallery with both images and videos
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');
        const file = {
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          name: asset.fileName || `status_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
          size: asset.fileSize || 0,
        };
        await uploadStatus(file, isVideo ? 'video' : 'image');
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const pickFromCamera = async () => {
    try {
      // Web doesn't support camera directly
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'Camera is not available on web. Please use Gallery option.');
        return;
      }

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions');
        return;
      }

      // Show options for image or video from camera
      Alert.alert(
        'Take Photo/Video',
        'Choose media type',
        [
          { text: 'Photo', onPress: () => takePhoto() },
          { text: 'Video', onPress: () => takeVideo() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          type: asset.type || 'image',
          mimeType: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `status_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
        };
        await uploadStatus(file, 'image');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const takeVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          type: asset.type || 'video',
          mimeType: asset.mimeType || 'video/mp4',
          name: asset.fileName || `status_${Date.now()}.mp4`,
          size: asset.fileSize || 0,
        };
        await uploadStatus(file, 'video');
      }
    } catch (error) {
      console.error('Error taking video:', error);
      Alert.alert('Error', 'Failed to take video');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Format file object properly
        const file = {
          uri: asset.uri,
          type: asset.type || 'image',
          mimeType: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `status_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
        };
        await uploadStatus(file, 'image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Format file object properly
        const file = {
          uri: asset.uri,
          type: asset.type || 'video',
          mimeType: asset.mimeType || 'video/mp4',
          name: asset.fileName || `status_${Date.now()}.mp4`,
          size: asset.fileSize || 0,
        };
        await uploadStatus(file, 'video');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const uploadStatus = async (file, type) => {
    try {
      // Validate file size before upload
      const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
      const MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB
      
      const fileSize = file.size || 0;
      
      if (type === 'image' && fileSize > MAX_IMAGE_SIZE) {
        Alert.alert(
          'File Too Large',
          'Image size must be less than 2MB. Please choose a smaller image.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (type === 'video' && fileSize > MAX_VIDEO_SIZE) {
        Alert.alert(
          'File Too Large',
          'Video size must be less than 5MB. Please choose a smaller video.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      Alert.alert('Uploading', 'Please wait...');
      
      // Upload status
      const result = await statusService.uploadStatus(file, type);
      
      if (result.success) {
        // Refresh feed after upload
        await loadFeed(1, false);
      }
    } catch (error) {
      console.error('Error uploading status:', error);
      Alert.alert('Error', 'Failed to upload status');
    }
  };

  const handleLike = async (statusId) => {
    // Optimistic update
    const isLiked = likedStatuses.has(statusId);
    const newLikedStatuses = new Set(likedStatuses);
    if (isLiked) {
      newLikedStatuses.delete(statusId);
    } else {
      newLikedStatuses.add(statusId);
    }
    setLikedStatuses(newLikedStatuses);

    // Update feed
    setFeed(prev => prev.map(item => {
      if (item.statusId === statusId) {
        return {
          ...item,
          isLiked: !isLiked,
          likesCount: isLiked ? item.likesCount - 1 : item.likesCount + 1,
        };
      }
      return item;
    }));

    // API call
    try {
      await feedService.toggleLike(statusId);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setLikedStatuses(likedStatuses);
      setFeed(prev => prev.map(item => {
        if (item.statusId === statusId) {
          return {
            ...item,
            isLiked,
            likesCount: isLiked ? item.likesCount + 1 : item.likesCount - 1,
          };
        }
        return item;
      }));
    }
  };

  const handleDoubleTap = (statusId) => {
    if (!likedStatuses.has(statusId)) {
      handleLike(statusId);
      
      // Animate heart
      if (!likeAnimations.current[statusId]) {
        likeAnimations.current[statusId] = new Animated.Value(0);
      }
      
      Animated.sequence([
        Animated.timing(likeAnimations.current[statusId], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnimations.current[statusId], {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleCommentPress = async (statusId) => {
    setSelectedStatus(statusId);
    setShowCommentsModal(true);
    setLoadingComments(true);
    
    try {
      const result = await feedService.getComments(statusId);
      if (result.success) {
        setComments(result.comments || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedStatus) return;
    
    const commentToAdd = commentText.trim();
    setCommentText('');
    
    try {
      const result = await feedService.addComment(selectedStatus, commentToAdd);
      if (result.success) {
        setComments(prev => [...prev, result.comment]);
        // Update feed
        setFeed(prev => prev.map(item => {
          if (item.statusId === selectedStatus) {
            return {
              ...item,
              commentsCount: item.commentsCount + 1,
            };
          }
          return item;
        }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleUserProfilePress = async (clickedUserEmail) => {
    if (!clickedUserEmail) return;
    
    setSelectedUserEmail(clickedUserEmail);
    setShowUserProfileModal(true);
    setLoadingProfile(true);
    
    try {
      const result = await profileService.getContactProfile(clickedUserEmail);
      if (result.success && result.profile) {
        setSelectedUserProfile(result.profile);
      } else {
        // If profile not found, still show basic info
        setSelectedUserProfile({
          email: clickedUserEmail,
          name: clickedUserEmail.split('@')[0],
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Show basic info on error
      setSelectedUserProfile({
        email: clickedUserEmail,
        name: clickedUserEmail.split('@')[0],
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  // Feed Item Component with proper double tap handling
  const FeedItemComponent = ({ item }) => {
    const statusUrl = item.statusUrl?.startsWith('http') 
      ? item.statusUrl 
      : item.statusUrl 
        ? `${API_CONFIG.BASE_URL}${item.statusUrl}` 
        : null;
    
    const isLiked = likedStatuses.has(item.statusId);
    const isVideo = item.statusType === 'video';
    const lastTapRef = useRef(null);
    
    // Initialize animation if needed
    if (!likeAnimations.current[item.statusId]) {
      likeAnimations.current[item.statusId] = new Animated.Value(0);
    }
    
    const heartScale = likeAnimations.current[item.statusId].interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1.5],
    });
    
    const heartOpacity = likeAnimations.current[item.statusId].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 0],
    });

    const handleImagePress = () => {
      const now = Date.now();
      const DOUBLE_PRESS_DELAY = 300;
      
      if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_PRESS_DELAY) {
        handleDoubleTap(item.statusId);
        lastTapRef.current = null;
      } else {
        lastTapRef.current = now;
      }
    };

    // Video player hook - always call it
    const videoPlayer = useVideoPlayer(
      isVideo && statusUrl ? statusUrl : '',
      (player) => {
        if (isVideo && player && statusUrl) {
          player.loop = true;
          player.play();
        }
      }
    );

    return (
      <View style={[styles.feedItem, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.feedHeader}>
          <View style={[styles.feedAvatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.feedAvatarText, { color: colors.white }]}>
              {item.userName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.feedHeaderInfo}>
            <TouchableOpacity
              onPress={() => handleUserProfilePress(item.userEmail)}
              activeOpacity={0.7}
            >
            <Text style={[styles.feedUserName, { color: colors.text }]}>
              {item.userName || item.userEmail?.split('@')[0]}
            </Text>
            </TouchableOpacity>
            <Text style={[styles.feedTime, { color: colors.textSecondary }]}>
              {item.statusTime}
            </Text>
          </View>
        </View>

        {/* Media */}
        <TouchableOpacity 
          activeOpacity={1}
          onPress={handleImagePress}
          style={styles.feedMediaContainer}
        >
          {statusUrl && (
            <>
              {isVideo ? (
                <VideoView
                  player={videoPlayer}
                  style={styles.feedMedia}
                  contentFit="cover"
                  nativeControls={false}
                />
              ) : (
                <Image
                  source={{ uri: statusUrl }}
                  style={styles.feedMedia}
                  resizeMode="cover"
                />
              )}
              
              {/* Double tap heart animation */}
              <Animated.View
                style={[
                  styles.doubleTapHeart,
                  {
                    transform: [{ scale: heartScale }],
                    opacity: heartOpacity,
                  },
                ]}
                pointerEvents="none"
              >
                <Text style={styles.heartEmoji}>❤️</Text>
              </Animated.View>
            </>
          )}
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.feedActions}>
          <TouchableOpacity
            onPress={() => handleLike(item.statusId)}
            style={styles.feedActionButton}
          >
            <Text style={styles.feedActionIcon}>
              {isLiked ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleCommentPress(item.statusId)}
            style={styles.feedActionButton}
          >
            <Text style={styles.feedActionIcon}>💬</Text>
          </TouchableOpacity>
          <View style={styles.feedActionSpacer} />
        </View>

        {/* Likes count */}
        {item.likesCount > 0 && (
          <Text style={[styles.feedLikes, { color: colors.text }]}>
            {item.likesCount} {item.likesCount === 1 ? 'like' : 'likes'}
          </Text>
        )}

        {/* Caption */}
        {item.caption && (
          <View style={styles.feedCaption}>
            <Text style={[styles.feedCaptionText, { color: colors.text }]}>
              <Text style={[styles.feedCaptionUser, { color: colors.text }]}>
                {item.userName || item.userEmail?.split('@')[0]}{' '}
              </Text>
              {item.caption}
            </Text>
          </View>
        )}

        {/* Comments count */}
        {item.commentsCount > 0 && (
          <TouchableOpacity
            onPress={() => handleCommentPress(item.statusId)}
            style={styles.feedCommentsButton}
          >
            <Text style={[styles.feedCommentsText, { color: colors.textSecondary }]}>
              View all {item.commentsCount} {item.commentsCount === 1 ? 'comment' : 'comments'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFeedItem = ({ item }) => {
    return <FeedItemComponent item={item} />;
  };

  if (loading && feed.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={feed}
        renderItem={renderFeedItem}
        keyExtractor={(item) => `feed-${item.statusId}`}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No posts yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Be the first to share a post!
            </Text>
            <TouchableOpacity
              style={[styles.addStatusButton, { backgroundColor: colors.primary }]}
              onPress={handleAddStatus}
            >
              <Text style={[styles.addStatusButtonText, { color: colors.white }]}>
                Add Your First Post
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Action Button - Always visible */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleAddStatus}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>➕</Text>
      </TouchableOpacity>

      {/* Status Viewer Modal */}
      <Modal
        visible={showStatusViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusViewer(false)}
      >
        <View style={styles.statusViewerContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowStatusViewer(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          {selectedStatus && (
            <StatusContentView status={selectedStatus} />
          )}
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCommentsModal(false);
          setComments([]);
          setCommentText('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.commentsModal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Comments</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCommentsModal(false);
                  setComments([]);
                  setCommentText('');
                }}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loadingComments ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
              <>
                <FlatList
                  data={comments}
                  keyExtractor={(item, index) => `comment-${item.commentId}-${index}`}
                  style={styles.commentsList}
                  renderItem={({ item }) => (
                    <View style={[styles.commentItem, { borderBottomColor: colors.divider }]}>
                      <View style={[styles.commentAvatar, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.commentAvatarText, { color: colors.white }]}>
                          {item.userName?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.commentContent}>
                        <Text style={[styles.commentUserName, { color: colors.text }]}>
                          {item.userName || item.userEmail?.split('@')[0]}
                        </Text>
                        <Text style={[styles.commentText, { color: colors.text }]}>
                          {item.comment}
                        </Text>
                        <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                          {new Date(item.commentedAt).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyComments}>
                      <Text style={[styles.emptyCommentsText, { color: colors.textSecondary }]}>
                        No comments yet. Be the first to comment!
                      </Text>
                    </View>
                  }
                />
                
                {/* Comment Input */}
                <View style={[styles.commentInputContainer, { borderTopColor: colors.divider }]}>
                  <TextInput
                    style={[styles.commentInput, { color: colors.text, backgroundColor: colors.inputBackground }]}
                    placeholder="Add a comment..."
                    placeholderTextColor={colors.textSecondary}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                  />
                  <TouchableOpacity
                    onPress={handleAddComment}
                    disabled={!commentText.trim()}
                    style={[
                      styles.commentSendButton,
                      { backgroundColor: commentText.trim() ? colors.primary : colors.divider },
                    ]}
                  >
                    <Text style={[styles.commentSendText, { color: colors.white }]}>Post</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* User Profile Modal */}
      <Modal
        visible={showUserProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowUserProfileModal(false);
          setSelectedUserEmail(null);
          setSelectedUserProfile(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.userProfileModal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Profile</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowUserProfileModal(false);
                  setSelectedUserEmail(null);
                  setSelectedUserProfile(null);
                }}
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
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {selectedUserProfile.name || selectedUserProfile.email?.split('@')[0] || 'User'}
                  </Text>
                  <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                    {selectedUserProfile.email}
                  </Text>
                  {selectedUserProfile.phoneNumbers && selectedUserProfile.phoneNumbers.length > 0 && (
                    <View style={styles.phoneNumbersContainer}>
                      {selectedUserProfile.phoneNumbers.map((phone, index) => (
                        <Text key={index} style={[styles.profilePhone, { color: colors.primary }]}>
                          {phone}
                        </Text>
                      ))}
                    </View>
                  )}
                  {selectedUserProfile.age && (
                    <Text style={[styles.profileAge, { color: colors.textSecondary }]}>
                      Age: {selectedUserProfile.age}
                    </Text>
                  )}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Feed Item Styles
  feedItem: {
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  feedAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  feedHeaderInfo: {
    flex: 1,
  },
  feedUserName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  fabIcon: {
    fontSize: 28,
    color: COLORS.white,
  },
  userProfileModal: {
    height: '70%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.md,
  },
  profileLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  profileContent: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.xs,
  },
  profileEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.xs,
  },
  phoneNumbersContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  profilePhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.xs / 2,
  },
  profileAge: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.xs,
  },
  feedTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
  },
  feedMediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    position: 'relative',
  },
  feedMedia: {
    width: '100%',
    height: '100%',
  },
  doubleTapHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartEmoji: {
    fontSize: 60,
  },
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  feedActionButton: {
    marginRight: SPACING.md,
  },
  feedActionIcon: {
    fontSize: 28,
  },
  feedActionSpacer: {
    flex: 1,
  },
  feedLikes: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  feedCaption: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  feedCaptionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  feedCaptionUser: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  feedCommentsButton: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  feedCommentsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  addStatusButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  addStatusButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  statusViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusContentView: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  statusVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  statusViewerInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  statusViewerName: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: 4,
  },
  statusViewerTime: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  viewersModal: {
    height: '70%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.md,
  },
  commentsModal: {
    height: '70%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.md,
  },
  commentsList: {
    flex: 1,
    padding: SPACING.md,
  },
  commentItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  commentAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
  },
  commentText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginBottom: SPACING.xs,
  },
  commentTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  emptyComments: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
    maxHeight: 100,
  },
  commentSendButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  commentSendText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: SPACING.xl,
  },
  viewersList: {
    flex: 1,
    padding: SPACING.md,
  },
  viewersCount: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.md,
  },
  noViewers: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  viewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  viewerAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  viewerInfo: {
    flex: 1,
  },
  viewerName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2,
  },
  viewerTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  infoButton: {
    padding: SPACING.sm,
  },
  infoButtonText: {
    fontSize: 20,
  },
  myStatusAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});

export default StatusFeed;


