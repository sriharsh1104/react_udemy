import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Animated } from 'react-native';
import { API_CONFIG } from '../../../../constants';
import { SPACING } from '../../../../constants';
import { Dimensions } from 'react-native';
import fileUploadService from '../../../../services/fileUploadService';
import styles from '../StatusFeed.styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FeedItem = ({ 
  item, 
  isLiked, 
  likedStatuses, 
  likeAnimations, 
  onLike, 
  onDoubleTap, 
  onCommentPress, 
  onUserProfilePress,
  onPostMenuPress,
  onFullScreenImage,
  colors 
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const isVideo = item.statusType === 'video';
  const lastTapRef = useRef(null);
  const tapTimeoutRef = useRef(null);
  
  // Load image URL with authentication token
  useEffect(() => {
    if (item.fileId && !isVideo) {
      fileUploadService.getFileViewUrl(item.fileId).then(url => {
        if (url) setImageUrl(url);
      }).catch(err => {
        console.error('Error loading image URL:', err);
        if (item.statusUrl) {
          const fallbackUrl = item.statusUrl.startsWith('http') 
            ? item.statusUrl 
            : `${API_CONFIG.BASE_URL}${item.statusUrl}`;
          setImageUrl(fallbackUrl);
        }
      });
    } else if (item.statusUrl) {
      const url = item.statusUrl.startsWith('http') 
        ? item.statusUrl 
        : `${API_CONFIG.BASE_URL}${item.statusUrl}`;
      setImageUrl(url);
    }
  }, [item.fileId, item.statusUrl, isVideo]);
  
  const statusUrl = imageUrl || (item.statusUrl?.startsWith('http') 
    ? item.statusUrl 
    : item.statusUrl 
      ? `${API_CONFIG.BASE_URL}${item.statusUrl}` 
      : null);
  
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
    
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }
    
    if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_PRESS_DELAY) {
      onDoubleTap(item.statusId);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = now;
      if (!isVideo && statusUrl) {
        tapTimeoutRef.current = setTimeout(() => {
          if (lastTapRef.current === now) {
            onFullScreenImage(statusUrl);
          }
          tapTimeoutRef.current = null;
        }, DOUBLE_PRESS_DELAY);
      }
    }
  };

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
              onPress={() => onUserProfilePress(item.userEmail)}
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
        <TouchableOpacity
          onPress={() => onPostMenuPress(item.statusId)}
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
          <View style={[styles.feedMedia, { backgroundColor: colors.divider, justifyContent: 'center', alignItems: 'center', minHeight: SCREEN_WIDTH - (SPACING.md * 2) }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.feedActions}>
        <TouchableOpacity
          onPress={() => onLike(item.statusId)}
          style={styles.feedActionButton}
        >
          <Text style={styles.feedActionIcon}>
            {isLiked ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onCommentPress(item.statusId)}
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
          onPress={() => onCommentPress(item.statusId)}
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

export default FeedItem;

