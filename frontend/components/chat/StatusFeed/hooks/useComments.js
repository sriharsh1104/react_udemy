import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import feedService from '../../../../services/feedService';
import fileUploadService from '../../../../services/fileUploadService';
import * as FileSystem from 'expo-file-system/legacy';

export const useComments = ({ userEmail, feed, setFeed, showAlert }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedStatusOwner, setSelectedStatusOwner] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGIFPicker, setShowGIFPicker] = useState(false);

  const handleCommentPress = useCallback(async (statusId, feedItems) => {
    setSelectedStatus(statusId);
    setLoadingComments(true);
    setReplyingToCommentId(null);
    setReplyText('');
    setExpandedReplies(new Set());
    
    const feedItem = feedItems.find(item => item.statusId === statusId);
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
  }, []);

  const handleAddComment = useCallback(async () => {
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
          const newExpanded = new Set(expandedReplies);
          newExpanded.add(replyingToCommentId);
          setExpandedReplies(newExpanded);
        } else {
          setComments(prev => [...prev, result.comment]);
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
  }, [selectedStatus, replyingToCommentId, replyText, commentText, userEmail, expandedReplies, setFeed]);

  const handleCommentKeyPress = useCallback((e) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  }, [handleAddComment]);

  const handleEmojiSelect = useCallback((emoji) => {
    if (replyingToCommentId) {
      setReplyText(replyText + emoji);
    } else {
      setCommentText(commentText + emoji);
    }
    setShowEmojiPicker(false);
  }, [replyingToCommentId, replyText, commentText]);

  const handleGIFSelect = useCallback(async (gifUrl) => {
    setShowGIFPicker(false);
    
    try {
      let fileUri;
      let fileSize = 0;
      
      if (Platform.OS === 'web') {
        const response = await fetch(gifUrl);
        const blob = await response.blob();
        fileUri = URL.createObjectURL(blob);
        fileSize = blob.size || 0;
      } else {
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
  }, [replyingToCommentId, replyText, commentText, showAlert]);

  const handleTakePhoto = useCallback(async () => {
    try {
      const file = await fileUploadService.takePhoto();
      if (file) {
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
  }, [replyingToCommentId, replyText, commentText, showAlert]);

  const handleReplyPress = useCallback((commentId) => {
    setReplyingToCommentId(commentId);
    setReplyText('');
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingToCommentId(null);
    setReplyText('');
  }, []);

  const handleToggleReplies = useCallback((commentId) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  }, [expandedReplies]);

  const handleCommentLike = useCallback(async (commentId, isReply = false, replyId = null) => {
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
  }, [selectedStatus]);

  const handlePinComment = useCallback(async (commentId) => {
    if (!selectedStatus) return;
    
    try {
      const result = await feedService.togglePinComment(selectedStatus, commentId);
      if (result.success) {
        const commentsResult = await feedService.getComments(selectedStatus);
        if (commentsResult.success) {
          setComments(commentsResult.comments || []);
        }
      }
    } catch (error) {
      console.error('Error pinning comment:', error);
    }
  }, [selectedStatus]);

  const resetComments = useCallback(() => {
    setComments([]);
    setCommentText('');
    setReplyingToCommentId(null);
    setReplyText('');
    setExpandedReplies(new Set());
    setSelectedStatusOwner(null);
    setShowEmojiPicker(false);
    setShowGIFPicker(false);
  }, []);

  return {
    comments,
    setComments,
    commentText,
    setCommentText,
    loadingComments,
    replyingToCommentId,
    replyText,
    setReplyText,
    expandedReplies,
    selectedStatus,
    selectedStatusOwner,
    showEmojiPicker,
    setShowEmojiPicker,
    showGIFPicker,
    setShowGIFPicker,
    handleCommentPress,
    handleAddComment,
    handleCommentKeyPress,
    handleEmojiSelect,
    handleGIFSelect,
    handleTakePhoto,
    handleReplyPress,
    handleCancelReply,
    handleToggleReplies,
    handleCommentLike,
    handlePinComment,
    resetComments,
  };
};

