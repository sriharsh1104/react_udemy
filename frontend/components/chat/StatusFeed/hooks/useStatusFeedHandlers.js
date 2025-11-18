import { useCallback } from 'react';
import { Animated } from 'react-native';
import feedService from '../../../../services/feedService';
import logger from '../../../../utils/logger';

export const useStatusFeedHandlers = ({
  feed,
  setFeed,
  likedStatuses,
  setLikedStatuses,
  savedPosts,
  setSavedPosts,
  userEmail,
  showAlert,
}) => {
  const handleLike = useCallback(async (statusId) => {
    const isLiked = likedStatuses.has(statusId);
    const newLikedStatuses = new Set(likedStatuses);
    if (isLiked) {
      newLikedStatuses.delete(statusId);
    } else {
      newLikedStatuses.add(statusId);
    }
    setLikedStatuses(newLikedStatuses);

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

    try {
      await feedService.toggleLike(statusId);
    } catch (error) {
      console.error('Error toggling like:', error);
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
  }, [likedStatuses, setLikedStatuses, setFeed]);

  const handleDoubleTap = useCallback((statusId, likeAnimations, handleLike) => {
    if (!likedStatuses.has(statusId)) {
      handleLike(statusId);
      
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
  }, [likedStatuses]);

  const handleSavePost = useCallback(async (statusId) => {
    const isSaved = savedPosts.has(statusId);
    const newSavedPosts = new Set(savedPosts);
    
    if (isSaved) {
      newSavedPosts.delete(statusId);
    } else {
      newSavedPosts.add(statusId);
    }
    setSavedPosts(newSavedPosts);
    
    setFeed(prev => prev.map(item => {
      if (item.statusId === statusId) {
        return {
          ...item,
          isSaved: !isSaved,
        };
      }
      return item;
    }));
    
    try {
      await feedService.toggleSavePost(statusId);
    } catch (error) {
      console.error('Error toggling save post:', error);
      setSavedPosts(savedPosts);
      setFeed(prev => prev.map(item => {
        if (item.statusId === statusId) {
          return {
            ...item,
            isSaved,
          };
        }
        return item;
      }));
    }
  }, [savedPosts, setSavedPosts, setFeed]);

  const handleDeletePost = useCallback(async (statusId, setFeed) => {
    try {
      const result = await feedService.deleteStatus(statusId);
      if (result.success) {
        setFeed(prev => prev.filter(item => item.statusId !== statusId));
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (error) {
      logger.error('Error deleting post:', error);
      return { success: false, message: 'Failed to delete post' };
    }
  }, []);

  return {
    handleLike,
    handleDoubleTap,
    handleSavePost,
    handleDeletePost,
  };
};

