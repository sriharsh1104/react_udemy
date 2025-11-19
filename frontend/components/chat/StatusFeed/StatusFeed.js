import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
  TextInput,
  Animated,
  ScrollView,
} from 'react-native';
import { useIsFocused, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING } from '../../../constants';
import { useTheme } from '../../../contexts/ThemeContext';
import statusService from '../../../services/statusService';
import feedService from '../../../services/feedService';
import fileUploadService from '../../../services/fileUploadService';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { API_CONFIG } from '../../../constants';
import AlertModal from '../../common/AlertModal/AlertModal';
import ActionModal from '../../common/ActionModal/ActionModal';
import ConfirmationModal from '../../common/ConfirmationModal/ConfirmationModal';
import ForwardContactModal from '../ForwardContactModal/ForwardContactModal';
import useAlertModal from '../../../hooks/useAlertModal';
import EmojiPicker from '../EmojiPicker';
import GIFPicker from '../GIFPicker';
import * as FileSystem from 'expo-file-system/legacy';
import socketService from '../../../services/socketService';
import encryptionService from '../../../services/encryptionService';
import { SOCKET_EVENTS } from '../../../constants';
import logger from '../../../utils/logger';
import styles from './StatusFeed.styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Caption Input Component
const CaptionInputComponent = ({ onPost, onCancel, colors }) => {
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');

  return (
    <ScrollView style={styles.captionInputScroll}>
      <View style={styles.captionInputContainer}>
        <Text style={[styles.captionLabel, { color: colors.text }]}>Caption</Text>
        <TextInput
          style={[styles.captionInput, { backgroundColor: colors.inputBackground || colors.surface, color: colors.text, borderColor: colors.divider }]}
          placeholder="Write a caption..."
          placeholderTextColor={colors.textSecondary}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={500}
        />
        <Text style={[styles.captionCharCount, { color: colors.textSecondary }]}>
          {caption.length}/500
        </Text>
      </View>

      <View style={styles.captionInputContainer}>
        <Text style={[styles.captionLabel, { color: colors.text }]}>Tags (comma-separated)</Text>
        <TextInput
          style={[styles.captionInput, { backgroundColor: colors.inputBackground || colors.surface, color: colors.text, borderColor: colors.divider }]}
          placeholder="e.g., nature, photography, travel"
          placeholderTextColor={colors.textSecondary}
          value={tags}
          onChangeText={setTags}
          maxLength={200}
        />
        <Text style={[styles.captionCharCount, { color: colors.textSecondary }]}>
          {tags.length}/200
        </Text>
      </View>

      <View style={styles.captionButtonContainer}>
        <TouchableOpacity
          style={[styles.captionPostButton, { backgroundColor: colors.primary }]}
          onPress={() => onPost(caption, tags)}
        >
          <Text style={[styles.captionPostButtonText, { color: COLORS.white }]}>Post</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Status Content Viewer Component
const StatusContentView = ({ status }) => {
  const { colors } = useTheme();
  const [statusUrl, setStatusUrl] = useState(null);
  const isVideo = status?.statusType === 'video' && status?.statusUrl;
  
  // Load status URL with authentication token
  useEffect(() => {
    const loadStatusUrl = async () => {
      if (!status) return;
      
      // If fileId is available, use fileUploadService to get URL with token
      if (status.fileId) {
        try {
          const url = await fileUploadService.getFileViewUrl(status.fileId);
          setStatusUrl(url);
        } catch (error) {
          console.error('Error loading status URL:', error);
          // Fallback to statusUrl from backend with token
          if (status.statusUrl) {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const baseUrl = status.statusUrl.startsWith('http') 
                ? status.statusUrl 
                : `${API_CONFIG.BASE_URL}${status.statusUrl}`;
              const finalUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
              setStatusUrl(finalUrl);
            } catch (err) {
              console.error('Error getting token:', err);
              const baseUrl = status.statusUrl.startsWith('http') 
                ? status.statusUrl 
                : `${API_CONFIG.BASE_URL}${status.statusUrl}`;
              setStatusUrl(baseUrl);
            }
          }
        }
      } else if (status.statusUrl) {
        // Fallback: construct URL manually with token
        try {
          const token = await AsyncStorage.getItem('authToken');
          const baseUrl = status.statusUrl.startsWith('http') 
            ? status.statusUrl 
            : `${API_CONFIG.BASE_URL}${status.statusUrl}`;
          const finalUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
          setStatusUrl(finalUrl);
        } catch (error) {
          console.error('Error getting token:', error);
          const baseUrl = status.statusUrl.startsWith('http') 
            ? status.statusUrl 
            : `${API_CONFIG.BASE_URL}${status.statusUrl}`;
          setStatusUrl(baseUrl);
        }
      }
    };
    
    loadStatusUrl();
  }, [status]);
  
  // Always call hook, but pass null if not video
  const player = useVideoPlayer(isVideo && statusUrl ? statusUrl : '', (player) => {
    if (isVideo && player && statusUrl) {
      player.loop = true;
      player.play();
    }
  });

  if (!status || !statusUrl) {
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
          source={{ uri: statusUrl }}
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
  const isFocused = useIsFocused(); // Check if screen is focused
  const route = useRoute(); // Get current route to verify we're on Feed screen
  const isFeedScreen = route?.name === 'Feed'; // Only true when actually on Feed screen
  const { showAlert, showAction, alertState, actionState, hideAlert, hideAction } = useAlertModal();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [feedMode, setFeedMode] = useState('public'); // 'public' or 'private'
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  // Optimized: Single state for upload modal
  const [uploadModal, setUploadModal] = useState({ visible: false, file: null, type: null });
  // Full-screen image viewer
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState(null);
  // Comments state for replies
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [selectedStatusOwner, setSelectedStatusOwner] = useState(null);
  // Emoji/GIF picker state for comments
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGIFPicker, setShowGIFPicker] = useState(false);
  // Post menu state
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [savedPosts, setSavedPosts] = useState(new Set());

  useEffect(() => {
    // Only load feed when screen is focused AND we're actually on Feed screen
    // This prevents feed API from being called when navigating to Chat or other screens
    // Note: contacts is not needed here - it's only used for forwarding posts
    if (isFocused && isFeedScreen) {
      loadFeed();
    }
  }, [userEmail, feedMode, isFocused, isFeedScreen]);

  const loadFeed = async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const result = await feedService.getFeed(pageNum, 10, feedMode);
      if (result.success) {
        if (append) {
          setFeed(prev => [...prev, ...result.feed]);
        } else {
          setFeed(result.feed);
        }
        setHasMore(result.hasMore);
        setPage(pageNum);
        
        // Track liked statuses and saved posts
        const liked = new Set();
        const saved = new Set();
        result.feed.forEach(item => {
          if (item.isLiked) {
            liked.add(item.statusId);
          }
          if (item.isSaved) {
            saved.add(item.statusId);
          }
        });
        setLikedStatuses(liked);
        setSavedPosts(saved);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    // Only load more if we're on Feed screen
    if (isFeedScreen && hasMore && !loading) {
      loadFeed(page + 1, true);
    }
  };

  const handleRefresh = () => {
    // Only refresh if we're on Feed screen
    if (isFeedScreen) {
      loadFeed(1, false);
    }
  };

  const handleAddStatus = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'We need camera roll permissions to add status', { type: 'warning' });
        return;
      }

      // Show options: Gallery, Camera, or Cancel
      showAction(
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
      showAlert('Error', 'Failed to add status', { type: 'error' });
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
              setUploadModal({ visible: true, file: fileObj, type: isVideo ? 'video' : 'image' });
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
        showAlert('Permission Denied', 'We need camera roll permissions', { type: 'warning' });
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
        setUploadModal({ visible: true, file, type: isVideo ? 'video' : 'image' });
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      showAlert('Error', 'Failed to open gallery', { type: 'error' });
    }
  };

  const pickFromCamera = async () => {
    try {
      // Web doesn't support camera directly
      if (Platform.OS === 'web') {
        showAlert('Not Available', 'Camera is not available on web. Please use Gallery option.', { type: 'info' });
        return;
      }

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'We need camera permissions', { type: 'warning' });
        return;
      }

      // Show options for image or video from camera
      showAction(
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
      showAlert('Error', 'Failed to open camera', { type: 'error' });
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
      showAlert('Error', 'Failed to take photo', { type: 'error' });
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
      showAlert('Error', 'Failed to take video', { type: 'error' });
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
      showAlert('Error', 'Failed to pick image', { type: 'error' });
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
      showAlert('Error', 'Failed to pick video', { type: 'error' });
    }
  };

  const handlePostStatus = async (caption, tags) => {
    const { file, type } = uploadModal;
    if (!file) return;
    
    try {
      // Validate file size before upload
      const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
      const MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB
      
      const fileSize = file.size || 0;
      
      if (type === 'image' && fileSize > MAX_IMAGE_SIZE) {
        showAlert('File Too Large', 'Image size exceeds 2MB limit. Please choose a smaller image.', { type: 'error' });
        setUploadModal({ visible: false, file: null, type: null });
        return;
      }
      
      if (type === 'video' && fileSize > MAX_VIDEO_SIZE) {
        showAlert('File Too Large', 'Video size exceeds 5MB limit. Please choose a smaller video.', { type: 'error' });
        setUploadModal({ visible: false, file: null, type: null });
        return;
      }
      
      setUploadModal({ visible: false, file: null, type: null });
      showAlert('Uploading', 'Please wait...', { type: 'info' });
      
      // Parse tags (comma-separated)
      const tagsArray = tags?.trim() ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
      
      // Upload feed post with caption and tags (postType='feed' for Instagram-style)
      const result = await statusService.uploadStatus(file, type, caption?.trim() || '', tagsArray, 'feed');
      
      if (result.success) {
        await loadFeed(1, false);
        hideAlert();
      } else {
        hideAlert();
      }
    } catch (error) {
      console.error('Error uploading status:', error);
      hideAlert();
      showAlert('Error', 'Failed to upload status', { type: 'error' });
    }
  };

  const handleCancelUpload = () => {
    setUploadModal({ visible: false, file: null, type: null });
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
    setReplyingToCommentId(null);
    setReplyText('');
    setExpandedReplies(new Set());
    
    // Find the post owner email
    const feedItem = feed.find(item => item.statusId === statusId);
    if (feedItem) {
      setSelectedStatusOwner(feedItem.userEmail);
    }
    
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
    if (!selectedStatus) return;
    
    const textToAdd = replyingToCommentId ? replyText.trim() : commentText.trim();
    if (!textToAdd) return;
    
    const commentToAdd = textToAdd;
    if (replyingToCommentId) {
      setReplyText('');
    } else {
      setCommentText('');
    }
    
    try {
      const result = await feedService.addComment(selectedStatus, commentToAdd, replyingToCommentId);
      if (result.success) {
        if (replyingToCommentId) {
          // Update comment with new reply
          setComments(prev => prev.map(comment => {
            if (comment.commentId === replyingToCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), {
                  replyId: result.comment.replyId,
                  userEmail: result.comment.userEmail,
                  userName: result.comment.userName,
                  reply: result.comment.reply,
                  repliedAt: result.comment.repliedAt,
                  likesCount: 0,
                  isLiked: false,
                  isOwnReply: result.comment.userEmail === userEmail,
                }],
                repliesCount: (comment.repliesCount || 0) + 1,
              };
            }
            return comment;
          }));
          setReplyingToCommentId(null);
          setReplyText('');
          // Expand replies for this comment
          const newExpanded = new Set(expandedReplies);
          newExpanded.add(replyingToCommentId);
          setExpandedReplies(newExpanded);
        } else {
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
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Handle Enter key press for comment input
  const handleCommentKeyPress = (e) => {
    // On web, detect Enter key without Shift to send comment
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    if (replyingToCommentId) {
      setReplyText(replyText + emoji);
    } else {
      setCommentText(commentText + emoji);
    }
    setShowEmojiPicker(false);
  };

  // Handle GIF selection
  const handleGIFSelect = async (gifUrl) => {
    setShowGIFPicker(false);
    
    try {
      let fileUri;
      let fileSize = 0;
      
      if (Platform.OS === 'web') {
        // On web, download and create blob URL
        const response = await fetch(gifUrl);
        const blob = await response.blob();
        fileUri = URL.createObjectURL(blob);
        fileSize = blob.size || 0;
      } else {
        // On native, download to file system
        const fileName = `gif_${Date.now()}.gif`;
        const localUri = `${FileSystem.documentDirectory}${fileName}`;
        
        const downloadResult = await FileSystem.downloadAsync(gifUrl, localUri);
        
        if (downloadResult.status !== 200) {
          throw new Error('Failed to download GIF');
        }
        
        fileUri = downloadResult.uri;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        fileSize = fileInfo.size || 0;
      }
      
      // For comments, we'll add the GIF URL as text for now
      // In a full implementation, you might want to upload and send as image
      const gifText = `[GIF: ${gifUrl}]`;
      if (replyingToCommentId) {
        setReplyText(replyText + gifText);
      } else {
        setCommentText(commentText + gifText);
      }
    } catch (error) {
      console.error('Error handling GIF:', error);
      showAlert('Error', 'Failed to add GIF. Please try again.', 'error');
    }
  };

  // Handle camera photo
  const handleTakePhoto = async () => {
    try {
      const file = await fileUploadService.takePhoto();
      if (file) {
        // For comments, we'll add a placeholder text
        // In a full implementation, you might want to upload and send as image
        const photoText = `[Photo: ${file.name || 'photo'}]`;
        if (replyingToCommentId) {
          setReplyText(replyText + photoText);
        } else {
          setCommentText(commentText + photoText);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showAlert('Error', error.message || 'Failed to take photo', 'error');
    }
  };

  // Handle post menu press
  const handlePostMenuPress = (statusId) => {
    const post = feed.find(item => item.statusId === statusId);
    setSelectedPostId(statusId);
    setSelectedPost(post);
    setShowPostMenu(true);
  };

  // Handle delete post confirmation
  const handleDeletePostConfirm = () => {
    setShowPostMenu(false);
    setShowDeleteConfirm(true);
  };

  // Handle delete post
  const handleDeletePost = async () => {
    if (!selectedPostId) return;
    
    try {
      const result = await feedService.deleteStatus(selectedPostId);
      if (result.success) {
        // Remove post from feed
        setFeed(prev => prev.filter(item => item.statusId !== selectedPostId));
        setShowDeleteConfirm(false);
        setSelectedPostId(null);
        setSelectedPost(null);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showAlert('Error', 'Failed to delete post. Please try again.', 'error');
      setShowDeleteConfirm(false);
    }
  };

  // Handle forward post
  const handleForwardPost = () => {
    if (!selectedPost) return;
    setShowPostMenu(false);
    setShowForwardModal(true);
  };

  // Handle save post
  const handleSavePost = async () => {
    if (!selectedPostId) return;
    
    const isSaved = savedPosts.has(selectedPostId);
    const newSavedPosts = new Set(savedPosts);
    
    // Optimistic update
    if (isSaved) {
      newSavedPosts.delete(selectedPostId);
    } else {
      newSavedPosts.add(selectedPostId);
    }
    setSavedPosts(newSavedPosts);
    
    // Update feed
    setFeed(prev => prev.map(item => {
      if (item.statusId === selectedPostId) {
        return {
          ...item,
          isSaved: !isSaved,
        };
      }
      return item;
    }));
    
    setShowPostMenu(false);
    
    // API call
    try {
      await feedService.toggleSavePost(selectedPostId);
    } catch (error) {
      console.error('Error toggling save post:', error);
      // Revert on error
      setSavedPosts(savedPosts);
      setFeed(prev => prev.map(item => {
        if (item.statusId === selectedPostId) {
          return {
            ...item,
            isSaved,
          };
        }
        return item;
      }));
    }
    
    setSelectedPostId(null);
    setSelectedPost(null);
  };

  const handleReplyPress = (commentId) => {
    setReplyingToCommentId(commentId);
    setReplyText('');
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setReplyText('');
  };

  const handleToggleReplies = (commentId) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleCommentLike = async (commentId, isReply = false, replyId = null) => {
    if (!selectedStatus) return;
    
    try {
      const result = await feedService.toggleCommentLike(selectedStatus, commentId, isReply, replyId);
      if (result.success) {
        setComments(prev => prev.map(comment => {
          if (isReply && replyId && comment.commentId === commentId) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.replyId === replyId) {
                  return {
                    ...reply,
                    isLiked: result.isLiked,
                    likesCount: result.likesCount,
                  };
                }
                return reply;
              }),
            };
          } else if (!isReply && comment.commentId === commentId) {
            return {
              ...comment,
              isLiked: result.isLiked,
              likesCount: result.likesCount,
            };
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  const handlePinComment = async (commentId) => {
    if (!selectedStatus) return;
    
    try {
      const result = await feedService.togglePinComment(selectedStatus, commentId);
      if (result.success) {
        // Reload comments to get updated order
        const commentsResult = await feedService.getComments(selectedStatus);
        if (commentsResult.success) {
          setComments(commentsResult.comments || []);
        }
      }
    } catch (error) {
      console.error('Error pinning comment:', error);
    }
  };

  const handleUserProfilePress = async (clickedUserEmail) => {
    if (!clickedUserEmail) return;
    
    setSelectedUserEmail(clickedUserEmail);
    setShowUserProfileModal(true);
    setLoadingProfile(true);
    
    try {
      const result = await feedService.getProfile(clickedUserEmail);
      if (result.success && result.profile) {
        setSelectedUserProfile(result.profile);
      } else {
        // If profile not found, still show basic info
        setSelectedUserProfile({
          email: clickedUserEmail,
          name: clickedUserEmail.split('@')[0],
          followStatus: 'not_following',
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Show basic info on error
      setSelectedUserProfile({
        email: clickedUserEmail,
        name: clickedUserEmail.split('@')[0],
        followStatus: 'not_following',
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setLoadingSearch(true);
    setShowSearchResults(true);
    
    try {
      const result = await feedService.searchProfiles(query);
      if (result.success) {
        setSearchResults(result.profiles || []);
      }
    } catch (error) {
      console.error('Error searching profiles:', error);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleFollow = async (followingEmail) => {
    try {
      const result = await feedService.followUser(followingEmail);
      if (result.success) {
        // Update profile follow status
        if (selectedUserEmail === followingEmail && selectedUserProfile) {
          setSelectedUserProfile({
            ...selectedUserProfile,
            followStatus: result.status || 'accepted',
          });
        }
        // Refresh feed to show new posts
        loadFeed(1, false);
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (followingEmail) => {
    try {
      const result = await feedService.unfollowUser(followingEmail);
      if (result.success) {
        // Update profile follow status
        if (selectedUserEmail === followingEmail && selectedUserProfile) {
          setSelectedUserProfile({
            ...selectedUserProfile,
            followStatus: 'not_following',
          });
        }
        // Refresh feed
        loadFeed(1, false);
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handleProfileVisit = async (email) => {
    setShowSearchResults(false);
    setSearchQuery('');
    await handleUserProfilePress(email);
  };

  // Feed Item Component with proper double tap handling
  const FeedItemComponent = ({ item }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const isLiked = likedStatuses.has(item.statusId);
    const isVideo = item.statusType === 'video';
    const lastTapRef = useRef(null);
    const tapTimeoutRef = useRef(null);
    
    // Load image URL with authentication token
    useEffect(() => {
      const loadUrl = async () => {
        if (item.fileId && !isVideo) {
          try {
            const url = await fileUploadService.getFileViewUrl(item.fileId);
            if (url) {
              setImageUrl(url);
              return;
            }
          } catch (err) {
            console.error('Error loading image URL:', err);
          }
          // Fallback to statusUrl if available
          if (item.statusUrl) {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const baseUrl = item.statusUrl.startsWith('http') 
                ? item.statusUrl 
                : `${API_CONFIG.BASE_URL}${item.statusUrl}`;
              const finalUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
              setImageUrl(finalUrl);
            } catch (err) {
              console.error('Error getting token:', err);
              const baseUrl = item.statusUrl.startsWith('http') 
                ? item.statusUrl 
                : `${API_CONFIG.BASE_URL}${item.statusUrl}`;
              setImageUrl(baseUrl);
            }
          }
        } else if (item.statusUrl) {
          // For videos or if fileId is not available, use statusUrl with token
          try {
            const token = await AsyncStorage.getItem('authToken');
            const baseUrl = item.statusUrl.startsWith('http') 
              ? item.statusUrl 
              : `${API_CONFIG.BASE_URL}${item.statusUrl}`;
            const finalUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
            setImageUrl(finalUrl);
          } catch (err) {
            console.error('Error getting token:', err);
            const baseUrl = item.statusUrl.startsWith('http') 
              ? item.statusUrl 
              : `${API_CONFIG.BASE_URL}${item.statusUrl}`;
            setImageUrl(baseUrl);
          }
        }
      };
      
      loadUrl();
    }, [item.fileId, item.statusUrl, isVideo]);
    
    // Use imageUrl which is already set with token by useEffect above
    const statusUrl = imageUrl;
    
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
      
      // Clear any pending timeout
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      
      if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_PRESS_DELAY) {
        // Double tap detected
        handleDoubleTap(item.statusId);
        lastTapRef.current = null;
      } else {
        // First tap - wait to see if there's a second tap
        lastTapRef.current = now;
        // If single tap on image (not video), open full screen after delay
        if (!isVideo && statusUrl) {
          tapTimeoutRef.current = setTimeout(() => {
            if (lastTapRef.current === now) {
              setFullScreenImageUrl(statusUrl);
              setShowFullScreenImage(true);
            }
            tapTimeoutRef.current = null;
          }, DOUBLE_PRESS_DELAY);
        }
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
          <View style={styles.feedHeaderLeft}>
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
          {/* Show menu for all posts */}
          <TouchableOpacity
            onPress={() => handlePostMenuPress(item.statusId)}
            style={styles.feedMenuButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.feedMenuIcon, { color: colors.text }]}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Media */}
        <TouchableOpacity 
          activeOpacity={1}
          onPress={handleImagePress}
          style={styles.feedMediaContainer}
        >
          {statusUrl ? (
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
                  onError={(error) => {
                    console.error('Image load error:', error);
                    // Retry with fileId if available
                    if (item.fileId) {
                      fileUploadService.getFileViewUrl(item.fileId).then(url => {
                        if (url) setImageUrl(url);
                      });
                    }
                  }}
                />
              )}
              
              {/* Double tap heart animation */}
              <Animated.View
                style={[
                  styles.doubleTapHeart,
                  {
                    transform: [{ scale: heartScale }],
                    opacity: heartOpacity,
                    pointerEvents: 'none',
                  },
                ]}
              >
                <Text style={styles.heartEmoji}>❤️</Text>
              </Animated.View>
            </>
          ) : item.fileId ? (
            // Show loading indicator while URL is being fetched
            <View style={[styles.feedMedia, { backgroundColor: colors.divider, justifyContent: 'center', alignItems: 'center', minHeight: SCREEN_WIDTH - (SPACING.md * 2) }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null}
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
        {item.caption && item.caption.trim() ? (
          <View style={styles.feedCaption}>
            <Text style={[styles.feedCaptionText, { color: colors.text }]}>
              <Text style={[styles.feedCaptionUser, { color: colors.text }]}>
                {item.userName || item.userEmail?.split('@')[0]}
              </Text>
              <Text> {String(item.caption || '')}</Text>
            </Text>
          </View>
        ) : null}

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
      {/* Search Bar and Feed Mode Toggle */}
      <View style={[styles.headerContainer, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search profiles..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
            }}
            onFocus={() => {
              if (searchQuery.trim()) {
                setShowSearchResults(true);
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Feed Mode Toggle */}
        <View style={[styles.feedModeContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.feedModeButton,
              feedMode === 'public' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFeedMode('public')}
          >
            <Text style={[
              styles.feedModeText,
              { color: feedMode === 'public' ? colors.white : colors.text }
            ]}>
              Public
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.feedModeButton,
              feedMode === 'private' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFeedMode('private')}
          >
            <Text style={[
              styles.feedModeText,
              { color: feedMode === 'private' ? colors.white : colors.text }
            ]}>
              Private
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Results */}
      {showSearchResults && (
        <View style={[styles.searchResultsContainer, { backgroundColor: colors.background }]}>
          {loadingSearch ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => `search-${item.email}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.searchResultItem, { borderBottomColor: colors.divider }]}
                  onPress={() => handleProfileVisit(item.email)}
                >
                  <View style={[styles.searchAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.searchAvatarText, { color: colors.white }]}>
                      {item.name?.charAt(0).toUpperCase() || item.email?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={[styles.searchResultName, { color: colors.text }]}>
                      {item.name || item.email?.split('@')[0]}
                    </Text>
                    <Text style={[styles.searchResultEmail, { color: colors.textSecondary }]}>
                      {item.email}
                    </Text>
                  </View>
                  {item.isPrivate && (
                    <Text style={styles.privateIcon}>🔒</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          ) : searchQuery.trim() ? (
            <View style={styles.noResultsContainer}>
              <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                No profiles found
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {!showSearchResults && (
      <FlatList
        data={feed}
        renderItem={renderFeedItem}
        keyExtractor={(item) => `feed-${item.statusId}`}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
          onScrollBeginDrag={() => {
            // Hide search results when scrolling feed
            if (showSearchResults) {
              setShowSearchResults(false);
            }
          }}
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
      )}

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
          setReplyingToCommentId(null);
          setReplyText('');
          setExpandedReplies(new Set());
          setSelectedStatusOwner(null);
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
                  setReplyingToCommentId(null);
                  setReplyText('');
                  setExpandedReplies(new Set());
                  setSelectedStatusOwner(null);
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
                  renderItem={({ item }) => {
                    const isPostOwner = selectedStatusOwner === userEmail;
                    const showReplies = expandedReplies.has(item.commentId);
                    const hasReplies = item.replies && item.replies.length > 0;
                    
                    return (
                      <View style={[styles.commentItem, { borderBottomColor: colors.divider }]}>
                        <View style={styles.commentRow}>
                          <View style={[styles.commentAvatar, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.commentAvatarText, { color: colors.white }]}>
                              {item.userName?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                          </View>
                          <View style={styles.commentContent}>
                            <View style={styles.commentHeader}>
                              <Text style={[styles.commentUserName, { color: colors.text }]}>
                                {item.userName || item.userEmail?.split('@')[0]}
                                {item.isPinned && <Text style={{ color: colors.primary }}> 📌</Text>}
                              </Text>
                              {isPostOwner && (
                                <TouchableOpacity
                                  onPress={() => handlePinComment(item.commentId)}
                                  style={styles.pinButton}
                                >
                                  <Text style={styles.pinButtonText}>
                                    {item.isPinned ? '📌' : '📍'}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                            <Text style={[styles.commentText, { color: colors.text }]}>
                              {item.comment}
                            </Text>
                            <View style={styles.commentActions}>
                              <TouchableOpacity
                                onPress={() => handleCommentLike(item.commentId, false, null)}
                                style={styles.commentActionButton}
                              >
                                <Text style={styles.commentActionIcon}>
                                  {item.isLiked ? '❤️' : '🤍'}
                                </Text>
                                {item.likesCount > 0 && (
                                  <Text style={[styles.commentActionCount, { color: colors.textSecondary }]}>
                                    {item.likesCount}
                                  </Text>
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleReplyPress(item.commentId)}
                                style={styles.commentActionButton}
                              >
                                <Text style={styles.commentActionIcon}>💬</Text>
                              </TouchableOpacity>
                              {hasReplies && (
                                <TouchableOpacity
                                  onPress={() => handleToggleReplies(item.commentId)}
                                  style={styles.commentActionButton}
                                >
                                  <Text style={[styles.commentActionText, { color: colors.textSecondary }]}>
                                    {showReplies ? 'Hide' : 'View'} {item.repliesCount} {item.repliesCount === 1 ? 'reply' : 'replies'}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                            <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                              {new Date(item.commentedAt).toLocaleString()}
                            </Text>
                            
                            {/* Replies */}
                            {showReplies && hasReplies && (
                              <View style={styles.repliesContainer}>
                                {item.replies.map((reply) => (
                                  <View key={reply.replyId} style={styles.replyItem}>
                                    <View style={[styles.replyAvatar, { backgroundColor: colors.primary }]}>
                                      <Text style={[styles.replyAvatarText, { color: colors.white }]}>
                                        {reply.userName?.charAt(0).toUpperCase() || 'U'}
                                      </Text>
                                    </View>
                                    <View style={styles.replyContent}>
                                      <Text style={[styles.replyUserName, { color: colors.text }]}>
                                        {reply.userName || reply.userEmail?.split('@')[0]}
                                      </Text>
                                      <Text style={[styles.replyText, { color: colors.text }]}>
                                        {reply.reply}
                                      </Text>
                                      <View style={styles.replyActions}>
                                        <TouchableOpacity
                                          onPress={() => handleCommentLike(item.commentId, true, reply.replyId)}
                                          style={styles.commentActionButton}
                                        >
                                          <Text style={styles.commentActionIcon}>
                                            {reply.isLiked ? '❤️' : '🤍'}
                                          </Text>
                                          {reply.likesCount > 0 && (
                                            <Text style={[styles.commentActionCount, { color: colors.textSecondary }]}>
                                              {reply.likesCount}
                                            </Text>
                                          )}
                                        </TouchableOpacity>
                                        <Text style={[styles.replyTime, { color: colors.textSecondary }]}>
                                          {new Date(reply.repliedAt).toLocaleString()}
                                        </Text>
                                      </View>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            )}
                            
                            {/* Reply Input */}
                            {replyingToCommentId === item.commentId && (
                              <View style={styles.replyInputContainer}>
                                <TextInput
                                  style={[styles.replyInput, { color: colors.text, backgroundColor: colors.inputBackground }]}
                                  placeholder="Write a reply..."
                                  placeholderTextColor={colors.textSecondary}
                                  value={replyText}
                                  onChangeText={setReplyText}
                                  multiline={Platform.OS === 'web'}
                                  maxLength={1000}
                                  onSubmitEditing={Platform.OS !== 'web' ? handleAddComment : undefined}
                                  blurOnSubmit={false}
                                  returnKeyType="send"
                                  onKeyPress={handleCommentKeyPress}
                                />
                                <View style={styles.replyInputActions}>
                                  <TouchableOpacity
                                    onPress={handleCancelReply}
                                    style={styles.replyCancelButton}
                                  >
                                    <Text style={[styles.replyCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={handleAddComment}
                                    disabled={!replyText.trim()}
                                    style={[
                                      styles.replySendButton,
                                      { backgroundColor: replyText.trim() ? colors.primary : colors.divider },
                                    ]}
                                  >
                                    <Text style={[styles.replySendText, { color: colors.white }]}>Reply</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyComments}>
                      <Text style={[styles.emptyCommentsText, { color: colors.textSecondary }]}>
                        No comments yet. Be the first to comment!
                      </Text>
                    </View>
                  }
                />
                
                {/* Comment Input */}
                {!replyingToCommentId && (
                  <View style={[styles.commentInputContainer, { borderTopColor: colors.divider }]}>
                    <View style={styles.commentInputWrapper}>
                      <TouchableOpacity 
                        style={styles.commentActionButton}
                        onPress={handleTakePhoto}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.commentActionIcon}>📷</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.commentActionButton}
                        onPress={() => {
                          setShowGIFPicker(false);
                          setShowEmojiPicker(!showEmojiPicker);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.commentActionIcon}>😊</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.commentActionButton}
                        onPress={() => {
                          setShowEmojiPicker(false);
                          setShowGIFPicker(!showGIFPicker);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.commentGIFButton, { color: colors.primary }]}>GIF</Text>
                      </TouchableOpacity>
                      
                      <TextInput
                        style={[styles.commentInput, { color: colors.text, backgroundColor: colors.inputBackground }]}
                        placeholder="Add a comment..."
                        placeholderTextColor={colors.textSecondary}
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline={Platform.OS === 'web'}
                        maxLength={1000}
                        onSubmitEditing={Platform.OS !== 'web' ? handleAddComment : undefined}
                        blurOnSubmit={false}
                        returnKeyType="send"
                        onKeyPress={handleCommentKeyPress}
                      />
                    </View>
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
                )}
                
                {/* Emoji Picker Modal */}
                <EmojiPicker
                  visible={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  onEmojiSelect={handleEmojiSelect}
                />

                {/* GIF Picker Modal */}
                <GIFPicker
                  visible={showGIFPicker}
                  onClose={() => setShowGIFPicker(false)}
                  onGIFSelect={handleGIFSelect}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Full-Screen Image Modal */}
      <Modal
        visible={showFullScreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowFullScreenImage(false);
          setFullScreenImageUrl(null);
        }}
      >
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity
            style={styles.fullScreenCloseButton}
            onPress={() => {
              setShowFullScreenImage(false);
              setFullScreenImageUrl(null);
            }}
          >
            <Text style={styles.fullScreenCloseButtonText}>✕</Text>
          </TouchableOpacity>
          {fullScreenImageUrl && (
            <Image
              source={{ uri: fullScreenImageUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
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
                          handleUnfollow(selectedUserEmail);
                        } else if (selectedUserProfile.followStatus === 'pending') {
                          // Already requested - show message
                          showAlert('Follow Request', 'Follow request already sent. Waiting for approval.', { type: 'info' });
                        } else {
                          handleFollow(selectedUserEmail);
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

      {/* Post Menu Modal */}
      <Modal
        visible={showPostMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPostMenu(false);
          setSelectedPostId(null);
          setSelectedPost(null);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowPostMenu(false);
            setSelectedPostId(null);
            setSelectedPost(null);
          }}
        >
          <View style={[styles.postMenuContainer, { backgroundColor: colors.background }]}>
            {/* Forward option - available for all posts */}
            <TouchableOpacity
              style={[styles.postMenuOption, { borderBottomColor: colors.divider }]}
              onPress={handleForwardPost}
              activeOpacity={0.7}
            >
              <Text style={[styles.postMenuOptionText, { color: colors.text }]}>Forward</Text>
            </TouchableOpacity>
            {/* Save/Unsave option - available for all posts */}
            <TouchableOpacity
              style={[styles.postMenuOption, { borderBottomColor: colors.divider }]}
              onPress={handleSavePost}
              activeOpacity={0.7}
            >
              <Text style={[styles.postMenuOptionText, { color: colors.text }]}>
                {selectedPost && savedPosts.has(selectedPost.statusId) ? 'Unsave' : 'Save'}
              </Text>
            </TouchableOpacity>
            {/* Delete option - only for own posts */}
            {selectedPost && selectedPost.userEmail === userEmail && (
              <TouchableOpacity
                style={[styles.postMenuOption, { borderBottomColor: colors.divider }]}
                onPress={handleDeletePostConfirm}
                activeOpacity={0.7}
              >
                <Text style={[styles.postMenuOptionText, { color: '#FF3B30' }]}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.postMenuOption}
              onPress={() => {
                setShowPostMenu(false);
                setSelectedPostId(null);
                setSelectedPost(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.postMenuOptionText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Forward Modal */}
      <ForwardContactModal
        visible={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setSelectedPost(null);
        }}
        onSelectContacts={async (targets) => {
          if (!selectedPost || !targets || targets.length === 0) return;
          
          try {
            let successCount = 0;
            let errorCount = 0;
            
            // Helper function to forward post to a single target
            const forwardToTarget = async (target) => {
              try {
                // Create file message from post
                const fileMessage = JSON.stringify({
                  type: 'file',
                  fileId: selectedPost.fileId,
                  fileName: selectedPost.statusType === 'video' ? 'post_video.mp4' : 'post_image.jpg',
                  fileType: selectedPost.statusType,
                  fileSize: 0,
                });
                
                if (target.type === 'private' && target.contactEmail) {
                  // First send the file message
                  const encryptedData = await encryptionService.encryptPrivateMessage(
                    fileMessage,
                    userEmail,
                    target.contactEmail
                  );
                  socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
                    message: JSON.stringify(encryptedData),
                    contactEmail: target.contactEmail,
                    senderEmail: userEmail,
                  });
                  
                  // If there's a caption, send it as a separate text message
                  if (selectedPost.caption && selectedPost.caption.trim()) {
                    const captionEncrypted = await encryptionService.encryptPrivateMessage(
                      selectedPost.caption.trim(),
                      userEmail,
                      target.contactEmail
                    );
                    socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
                      message: JSON.stringify(captionEncrypted),
                      contactEmail: target.contactEmail,
                      senderEmail: userEmail,
                    });
                  }
                  successCount++;
                } else if (target.type === 'group' && target.groupId) {
                  // Send file message to group
                  socketService.emit(SOCKET_EVENTS.GROUP_MESSAGE, {
                    message: fileMessage,
                    groupId: target.groupId,
                    senderEmail: userEmail,
                  });
                  
                  // If there's a caption, send it as a separate text message
                  if (selectedPost.caption && selectedPost.caption.trim()) {
                    socketService.emit(SOCKET_EVENTS.GROUP_MESSAGE, {
                      message: selectedPost.caption.trim(),
                      groupId: target.groupId,
                      senderEmail: userEmail,
                    });
                  }
                  successCount++;
                }
              } catch (error) {
                logger.error(`Error forwarding post to ${target.type === 'private' ? target.contactEmail : target.groupName}:`, error);
                errorCount++;
              }
            };
            
            // Forward to all selected targets
            await Promise.all(targets.map(target => forwardToTarget(target)));
            
            setShowForwardModal(false);
            setSelectedPost(null);
            
            if (errorCount === 0) {
              showAlert('Success', `Post forwarded to ${successCount} ${successCount === 1 ? 'contact' : 'contacts'} successfully`, { type: 'success' });
            } else {
              showAlert(
                'Partial Success', 
                `Post forwarded to ${successCount} ${successCount === 1 ? 'contact' : 'contacts'}, ${errorCount} ${errorCount === 1 ? 'failed' : 'failed'}`,
                { type: 'warning' }
              );
            }
          } catch (error) {
            logger.error('Error forwarding post:', error);
            showAlert('Error', 'Failed to forward post', { type: 'error' });
          }
        }}
        message={selectedPost ? `Forwarding post from ${selectedPost.userName || selectedPost.userEmail?.split('@')[0]}` : ''}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeletePost}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedPostId(null);
          setSelectedPost(null);
        }}
        confirmButtonStyle="destructive"
      />

      {/* Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttonText={alertState.buttonText}
        type={alertState.type}
        onClose={hideAlert}
      />

      {/* Action Modal */}
      <ActionModal
        visible={actionState.visible}
        title={actionState.title}
        message={actionState.message}
        options={actionState.options}
        onClose={hideAction}
      />

      {/* Upload Modal with Caption and Tags */}
      <Modal
        visible={uploadModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelUpload}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.captionModal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Caption & Tags</Text>
              <TouchableOpacity onPress={handleCancelUpload} style={styles.modalCloseButton}>
                <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Preview */}
            {uploadModal.file && (
              <View style={styles.captionPreviewContainer}>
                {uploadModal.type === 'image' ? (
                  <Image
                    source={{ uri: uploadModal.file.uri }}
                    style={styles.captionPreviewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.captionPreviewImage, { backgroundColor: colors.divider, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: colors.textSecondary }}>Video Preview</Text>
                  </View>
                )}
              </View>
            )}

            {/* Caption Input */}
            <CaptionInputComponent
              onPost={handlePostStatus}
              onCancel={handleCancelUpload}
              colors={colors}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StatusFeed;

