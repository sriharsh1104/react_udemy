import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  TextInput,
  Animated,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import feedService from '../../../services/feedService';
import AlertModal from '../../common/AlertModal/AlertModal';
import ActionModal from '../../common/ActionModal/ActionModal';
import ConfirmationModal from '../../common/ConfirmationModal/ConfirmationModal';
import ForwardContactModal from '../ForwardContactModal/ForwardContactModal';
import useAlertModal from '../../../hooks/useAlertModal';
import styles from './StatusFeed.styles';
import FeedItem from './components/FeedItem';
import CaptionInputComponent from './components/CaptionInputComponent';
import StatusContentView from './components/StatusContentView';
import CommentsModal from './components/CommentsModal';
import UserProfileModal from './components/UserProfileModal';
import FullScreenImageModal from './components/FullScreenImageModal';
import PostMenuModal from './components/PostMenuModal';
import SearchResults from './components/SearchResults';
import FeedHeader from './components/FeedHeader';
import { useStatusFeedHandlers } from './hooks/useStatusFeedHandlers';
import { useStatusUpload } from './hooks/useStatusUpload';
import { useComments } from './hooks/useComments';
import { useSearch } from './hooks/useSearch';
import { useForwardPost } from './hooks/useForwardPost';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const StatusFeed = ({ userEmail, contacts = [] }) => {
  const { colors } = useTheme();
  const isFocused = useIsFocused(); // Check if screen is focused
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
  const [likedStatuses, setLikedStatuses] = useState(new Set());
  const doubleTapRefs = useRef({});
  const likeAnimations = useRef({});
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState(null);
  // Post menu state
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [savedPosts, setSavedPosts] = useState(new Set());

  useEffect(() => {
    // Only load feed when screen is focused
    if (isFocused) {
      loadFeed();
    }
  }, [contacts, userEmail, feedMode, isFocused]);

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
    if (hasMore && !loading) {
      loadFeed(page + 1, true);
    }
  };

  const handleRefresh = () => {
    loadFeed(1, false);
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
    await commentsHook.handleCommentPress(statusId, feed);
    setShowCommentsModal(true);
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
    searchHook.resetSearch();
    await handleUserProfilePress(email);
  };

  // Use hooks for handlers
  const feedHandlers = useStatusFeedHandlers({
    feed,
    setFeed,
    likedStatuses,
    setLikedStatuses,
    savedPosts,
    setSavedPosts,
    userEmail,
    showAlert,
  });

  const {
    uploadModal,
    setUploadModal,
    handleAddStatus,
    handlePostStatus,
    handleCancelUpload,
  } = useStatusUpload({
    loadFeed,
    showAlert,
    hideAlert,
  });

  const commentsHook = useComments({
    userEmail,
    feed,
    setFeed,
    showAlert,
  });

  const searchHook = useSearch();
  const { handleForwardPost: forwardPost } = useForwardPost({ userEmail, showAlert });

  const handleDoubleTapWithAnimation = (statusId) => {
    feedHandlers.handleDoubleTap(statusId, likeAnimations, feedHandlers.handleLike);
  };

  const handleFullScreenImage = (url) => {
    setFullScreenImageUrl(url);
    setShowFullScreenImage(true);
  };

  const renderFeedItem = ({ item }) => {
    return (
      <FeedItem
        item={item}
        isLiked={likedStatuses.has(item.statusId)}
        likedStatuses={likedStatuses}
        likeAnimations={likeAnimations}
        onLike={feedHandlers.handleLike}
        onDoubleTap={handleDoubleTapWithAnimation}
        onCommentPress={handleCommentPress}
        onUserProfilePress={handleUserProfilePress}
        onPostMenuPress={handlePostMenuPress}
        onFullScreenImage={handleFullScreenImage}
        colors={colors}
      />
    );
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
      <FeedHeader
        searchQuery={searchHook.searchQuery}
        onSearchChange={searchHook.setSearchQuery}
        onSearchFocus={() => {
          if (searchHook.searchQuery.trim()) {
            searchHook.setShowSearchResults(true);
          }
        }}
        onClearSearch={searchHook.resetSearch}
        feedMode={feedMode}
        onFeedModeChange={setFeedMode}
      />

      {/* Search Results */}
      <SearchResults
        visible={searchHook.showSearchResults}
        searchResults={searchHook.searchResults}
        loadingSearch={searchHook.loadingSearch}
        searchQuery={searchHook.searchQuery}
        onProfileVisit={handleProfileVisit}
      />

      {!searchHook.showSearchResults && (
      <FlatList
        data={feed}
        renderItem={renderFeedItem}
        keyExtractor={(item) => `feed-${item.statusId}`}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
          onScrollBeginDrag={() => {
            if (searchHook.showSearchResults) {
              searchHook.setShowSearchResults(false);
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
      <CommentsModal
        visible={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        commentsHook={commentsHook}
        userEmail={userEmail}
      />

      {/* Full-Screen Image Modal */}
      <FullScreenImageModal
        visible={showFullScreenImage}
        imageUrl={fullScreenImageUrl}
        onClose={() => {
          setShowFullScreenImage(false);
          setFullScreenImageUrl(null);
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        visible={showUserProfileModal}
        onClose={() => {
          setShowUserProfileModal(false);
          setSelectedUserEmail(null);
          setSelectedUserProfile(null);
        }}
        selectedUserEmail={selectedUserEmail}
        selectedUserProfile={selectedUserProfile}
        loadingProfile={loadingProfile}
        userEmail={userEmail}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        showAlert={showAlert}
      />

      {/* Post Menu Modal */}
      <PostMenuModal
        visible={showPostMenu}
        onClose={() => {
          setShowPostMenu(false);
          setSelectedPostId(null);
          setSelectedPost(null);
        }}
        selectedPost={selectedPost}
        userEmail={userEmail}
        savedPosts={savedPosts}
        onForward={handleForwardPost}
        onSave={handleSavePost}
        onDelete={handleDeletePostConfirm}
      />

      {/* Forward Modal */}
      <ForwardContactModal
        visible={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setSelectedPost(null);
        }}
        onSelectContacts={async (targets) => {
          await forwardPost(selectedPost, targets);
          setShowForwardModal(false);
          setSelectedPost(null);
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

