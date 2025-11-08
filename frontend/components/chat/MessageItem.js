import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import fileUploadService from '../../services/fileUploadService';

const MessageItem = ({ message, username, timestamp, isSystemMessage, isSent, status, messageId, isPinned, isCreator, onPin, onUnpin, groupId, onSelect, isSelected, isGroup, replyTo, replyToMessage, replyToSender, userEmail }) => {
  const [fileData, setFileData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [localFileUri, setLocalFileUri] = useState(null);
  
  // Determine if message is sent by current user (for WhatsApp-like alignment)
  const isMyMessage = isSent !== undefined ? isSent : false;
  
  // Default status to 'sent' if not provided
  const messageStatus = status || 'sent';
  
  // Default isSelected to false if not provided
  const isMessageSelected = isSelected || false;
  
  // Check if message is a file message
  useEffect(() => {
    try {
      const parsed = JSON.parse(message);
      if (parsed && parsed.type === 'file') {
        setFileData(parsed);
        // Check if file is already downloaded locally
        checkLocalFile(parsed.fileId, parsed.fileName);
      }
    } catch {
      // Not a JSON message, treat as regular text
    }
  }, [message]);
  
  const checkLocalFile = async (fileId, fileName) => {
    try {
      const localUri = `${FileSystem.documentDirectory}${fileId}_${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        setLocalFileUri(localUri);
      }
    } catch (error) {
      console.error('Error checking local file:', error);
    }
  };
  
  const handleDownload = async () => {
    if (!fileData || downloading) return;
    
    setDownloading(true);
    try {
      const result = await fileUploadService.downloadFile(
        fileData.fileId,
        fileData.fileName,
        fileData.fileType
      );
      
      setLocalFileUri(result.localUri);
      
      // Delete file from server after download
      await fileUploadService.deleteFileFromServer(fileData.fileId);
      
      Alert.alert('Success', 'File downloaded successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to download file');
    } finally {
      setDownloading(false);
    }
  };
  
  if (isSystemMessage) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message}</Text>
      </View>
    );
  }

  // Handle long press to select message
  const handleLongPress = () => {
    if (onSelect) {
      onSelect({
        message,
        messageId,
        isSent,
        isPinned,
        isCreator,
        isGroup,
        timestamp,
      });
    }
  };

  // Render file message
  if (fileData) {
    // Video player component
    const VideoPlayer = ({ uri }) => {
      const player = useVideoPlayer(uri, (player) => {
        player.loop = false;
        player.muted = false;
      });
      
      return (
        <VideoView
          player={player}
          style={styles.fileVideo}
          nativeControls
          contentFit="contain"
        />
      );
    };
    
    return (
      <TouchableOpacity
        style={[
          styles.container,
          isMyMessage ? styles.sentContainer : styles.receivedContainer,
          isMessageSelected && styles.selectedContainer,
        ]}
        onLongPress={handleLongPress}
        onPress={() => isMessageSelected && onSelect && onSelect(null)} // Deselect on tap if selected
        activeOpacity={0.7}
      >
        {!isMyMessage && (
          <Text style={styles.username} numberOfLines={1}>{username}</Text>
        )}
        <View style={[styles.bubble, isMyMessage ? styles.sentBubble : styles.receivedBubble]}>
          {/* Reply Reference */}
          {replyTo && replyToMessage && (
            <View style={[styles.replyReference, { borderLeftColor: isMyMessage ? COLORS.white : COLORS.primary }]}>
              <Text style={[styles.replySenderName, { color: isMyMessage ? COLORS.white : COLORS.primary }]} numberOfLines={1}>
                {replyToSender === userEmail ? 'You' : (replyToSender ? replyToSender.split('@')[0] : 'Unknown')}
              </Text>
              <Text style={[styles.replyMessageText, { color: isMyMessage ? COLORS.white : COLORS.textSecondary }]} numberOfLines={1}>
                {replyToMessage.length > 50 ? replyToMessage.substring(0, 50) + '...' : replyToMessage}
              </Text>
            </View>
          )}
          <View style={styles.messageHeader}>
            {onMenuPress && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => onMenuPress({
                  message,
                  messageId,
                  isSent,
                  isPinned,
                  isCreator,
                  isGroup,
                })}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.menuIcon, { color: isMyMessage ? COLORS.white : COLORS.textSecondary }]}>
                  ⋮
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Display image if downloaded */}
          {fileData.fileType === 'image' && localFileUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: localFileUri }} style={styles.fileImage} resizeMode="cover" />
              <TouchableOpacity 
                style={styles.downloadButtonOverlay}
                onPress={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.downloadIcon}>⬇️</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          
          {/* Display video if downloaded */}
          {fileData.fileType === 'video' && localFileUri && (
            <View style={styles.videoContainer}>
              <VideoPlayer uri={localFileUri} />
              <TouchableOpacity 
                style={styles.downloadButtonOverlay}
                onPress={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.downloadIcon}>⬇️</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          
          {/* Show file info and download button for non-image/video files or when not downloaded */}
          {(!localFileUri || (fileData.fileType !== 'image' && fileData.fileType !== 'video')) && (
            <TouchableOpacity 
              style={styles.fileContainer}
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color={isMyMessage ? COLORS.white : COLORS.primary} />
              ) : (
                <>
                  <Text style={styles.fileIcon}>
                    {fileData.fileType === 'image' ? '🖼️' : 
                     fileData.fileType === 'video' ? '🎥' : 
                     fileData.fileType === 'audio' ? '🎵' : '📄'}
                  </Text>
                  <Text style={[styles.fileName, isMyMessage ? styles.sentText : styles.receivedText]}>
                    {fileData.fileName}
                  </Text>
                  <Text style={[styles.fileSize, isMyMessage ? styles.sentTimestamp : styles.receivedTimestamp]}>
                    {(fileData.fileSize / 1024 / 1024).toFixed(2)} MB
                  </Text>
                  <Text style={[styles.downloadText, isMyMessage ? styles.sentTimestamp : styles.receivedTimestamp]}>
                    Tap to download
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {/* Show download option for images/videos that are displayed but can be re-downloaded */}
          {(fileData.fileType === 'image' || fileData.fileType === 'video') && localFileUri && (
            <View style={styles.fileInfoContainer}>
              <Text style={[styles.fileName, isMyMessage ? styles.sentText : styles.receivedText]}>
                {fileData.fileName}
              </Text>
              <Text style={[styles.fileSize, isMyMessage ? styles.sentTimestamp : styles.receivedTimestamp]}>
                {(fileData.fileSize / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
          )}
          
          <View style={styles.timestampContainer}>
            <Text style={[styles.timestamp, isMyMessage ? styles.sentTimestamp : styles.receivedTimestamp]}>
              {new Date(timestamp).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </Text>
            {/* Show tick marks for sent messages */}
            {isMyMessage && (
              <Text style={[
                styles.tickMark,
                status === 'read' ? styles.tickMarkRead : 
                status === 'delivered' ? styles.tickMarkDelivered : 
                styles.tickMarkSent
              ]}>
                {status === 'read' || status === 'delivered' ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
  
  // Render regular text message
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isMyMessage ? styles.sentContainer : styles.receivedContainer,
        isMessageSelected && styles.selectedContainer,
      ]}
      onLongPress={handleLongPress}
      onPress={() => isMessageSelected && onSelect && onSelect(null)} // Deselect on tap if selected
      activeOpacity={0.7}
    >
      {!isMyMessage && (
        <Text style={styles.username} numberOfLines={1}>{username}</Text>
      )}
      <View style={[styles.bubble, isMyMessage ? styles.sentBubble : styles.receivedBubble]}>
        {/* Reply Reference */}
        {replyTo && replyToMessage && (
          <View style={[styles.replyReference, { borderLeftColor: isMyMessage ? COLORS.white : COLORS.primary }]}>
            <Text style={[styles.replySenderName, { color: isMyMessage ? COLORS.white : COLORS.primary }]} numberOfLines={1}>
              {replyToSender === userEmail ? 'You' : (replyToSender ? replyToSender.split('@')[0] : 'Unknown')}
            </Text>
            <Text style={[styles.replyMessageText, { color: isMyMessage ? COLORS.white : COLORS.textSecondary }]} numberOfLines={1}>
              {replyToMessage.length > 50 ? replyToMessage.substring(0, 50) + '...' : replyToMessage}
            </Text>
          </View>
        )}
        <Text style={[styles.messageText, isMyMessage ? styles.sentText : styles.receivedText]}>
          {message}
        </Text>
        <View style={styles.timestampContainer}>
          <Text style={[styles.timestamp, isMyMessage ? styles.sentTimestamp : styles.receivedTimestamp]}>
            {new Date(timestamp).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </Text>
          {/* Show tick marks for sent messages */}
          {isMyMessage && (
            <Text style={[
              styles.tickMark,
              messageStatus === 'read' ? styles.tickMarkRead : 
              messageStatus === 'delivered' ? styles.tickMarkDelivered : 
              styles.tickMarkSent
            ]}>
              {messageStatus === 'read' || messageStatus === 'delivered' ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    maxWidth: '85%',
  },
  sentContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.message,
    maxWidth: '100%',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sentBubble: {
    backgroundColor: COLORS.sentMessage,
    borderBottomRightRadius: BORDER_RADIUS.xs, // WhatsApp-style tail
  },
  receivedBubble: {
    backgroundColor: COLORS.receivedMessage,
    borderBottomLeftRadius: BORDER_RADIUS.xs, // WhatsApp-style tail
  },
  username: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    paddingHorizontal: SPACING.sm,
  },
  messageText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 20,
  },
  sentText: {
    color: COLORS.white,
  },
  receivedText: {
    color: COLORS.text,
  },
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  timestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginLeft: SPACING.xs,
  },
  sentTimestamp: {
    color: COLORS.white,
    opacity: 0.8,
  },
  receivedTimestamp: {
    color: COLORS.textSecondary,
  },
  systemContainer: {
    alignSelf: 'center',
    backgroundColor: COLORS.systemMessage,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.sm,
    maxWidth: '90%',
  },
  systemText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fileContainer: {
    alignItems: 'center',
    padding: SPACING.md,
    minWidth: 200,
  },
  fileIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  fileName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  fileSize: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginBottom: SPACING.xs,
  },
  downloadText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  fileImage: {
    width: 250,
    height: 250,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  fileVideo: {
    width: 250,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  videoContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  downloadButtonOverlay: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BORDER_RADIUS.full,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  downloadIcon: {
    fontSize: 18,
    color: COLORS.white,
  },
  fileInfoContainer: {
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  tickMark: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginLeft: SPACING.xs / 2,
  },
  tickMarkSent: {
    color: COLORS.white,
    opacity: 0.6,
  },
  tickMarkDelivered: {
    color: COLORS.white,
    opacity: 0.8,
  },
  tickMarkRead: {
    color: '#4FC3F7', // Light blue color for read messages (WhatsApp style)
    opacity: 1,
  },
  pinnedBubble: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
  },
  pinnedIcon: {
    fontSize: 14,
    marginRight: SPACING.xs / 2,
  },
  pinnedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontStyle: 'italic',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  menuButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  menuIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedContainer: {
    opacity: 0.7,
    backgroundColor: COLORS.primary + '20', // Semi-transparent primary color
  },
  replyReference: {
    borderLeftWidth: 3,
    paddingLeft: SPACING.sm,
    marginBottom: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
  },
  replySenderName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2,
  },
  replyMessageText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
});

export default MessageItem;
