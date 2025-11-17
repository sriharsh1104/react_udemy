import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import fileUploadService from '../../services/fileUploadService';
import FullScreenImageViewer from './FullScreenImageViewer';

const MessageItem = ({ message, username, timestamp, isSystemMessage, isSent, status, messageId, isPinned, isCreator, onPin, onUnpin, groupId, onSelect, isSelected, isGroup, replyTo, replyToMessage, replyToSender, userEmail, isDeleted, editedAt, onMenuPress, isCallMessage, callRecord, isBillSplit, billSplitData, onMarkAsPaid }) => {
  const [fileData, setFileData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [localFileUri, setLocalFileUri] = useState(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const autoDownloadAttempted = useRef(false); // Track if auto-download was attempted
  
  // Determine if message is sent by current user (for WhatsApp-like alignment)
  const isMyMessage = isSent !== undefined ? isSent : false;
  
  // Default status to 'sent' if not provided
  const messageStatus = status || 'sent';
  
  // Default isSelected to false if not provided
  const isMessageSelected = isSelected || false;
  
  // Check if message is a file message
  useEffect(() => {
    // Ensure message is a string before parsing
    const messageStr = typeof message === 'string' 
      ? message 
      : (message?.message || message?.text || String(message || ''));
    
    try {
      const parsed = JSON.parse(messageStr);
      if (parsed && parsed.type === 'file') {
        setFileData(parsed);
        
        // For sender: use localUri if available (from when file was picked)
        if (isMyMessage && parsed.localUri) {
          setLocalFileUri(parsed.localUri);
        } else {
          // For receiver or if no localUri: check if file is already downloaded locally
          checkLocalFile(parsed.fileId, parsed.fileName);
          
          // Auto-download images/videos for receiver (only once)
          if (!isMyMessage && (parsed.fileType === 'image' || parsed.fileType === 'video') && !autoDownloadAttempted.current) {
            autoDownloadAttempted.current = true;
            autoDownloadFile(parsed.fileId, parsed.fileName, parsed.fileType);
          }
        }
      }
    } catch {
      // Not a JSON message, treat as regular text
    }
  }, [message, isMyMessage]);
  
  const checkLocalFile = async (fileId, fileName) => {
    // Skip file system check on web - expo-file-system is not available on web
    if (Platform.OS === 'web') {
      return;
    }
    
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

  const autoDownloadFile = async (fileId, fileName, fileType) => {
    // Skip auto-download if already downloading
    if (downloading) return;
    
    // Check if already downloaded (for native platforms)
    if (Platform.OS !== 'web') {
      try {
        const localUri = `${FileSystem.documentDirectory}${fileId}_${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (fileInfo.exists) {
          setLocalFileUri(localUri);
          return;
        }
      } catch (error) {
        // Continue to download
      }
    }
    
    // Download the file (works for both web and native)
    setDownloading(true);
    try {
      const result = await fileUploadService.downloadFile(fileId, fileName, fileType);
      setLocalFileUri(result.localUri);
    } catch (error) {
      console.error('Error auto-downloading file:', error);
    } finally {
      setDownloading(false);
    }
  };
  
  const handleDownload = async () => {
    if (!fileData || downloading) return;
    
    // If already downloaded, just show success
    if (localFileUri) {
      Alert.alert('Success', 'File is already downloaded');
      return;
    }
    
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
    const systemMessageText = typeof message === 'string' 
      ? message 
      : (message?.message || message?.text || String(message || ''));
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{systemMessageText}</Text>
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
                {(() => {
                  const replyText = typeof replyToMessage === 'string' 
                    ? replyToMessage 
                    : (replyToMessage?.message || replyToMessage?.text || String(replyToMessage || ''));
                  
                  // Check if it's a file message and extract file name
                  try {
                    const parsed = JSON.parse(replyText);
                    if (parsed && parsed.type === 'file') {
                      return parsed.fileName || 'File';
                    }
                  } catch {
                    // Not JSON, use as-is
                  }
                  
                  return replyText.length > 50 ? replyText.substring(0, 50) + '...' : replyText;
                })()}
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
          {/* Show deleted message for image/video files */}
          {isDeleted && (fileData.fileType === 'image' || fileData.fileType === 'video') && (
            <Text style={[styles.messageText, isMyMessage ? styles.sentText : styles.receivedText, styles.deletedMessage]}>
              This message is deleted
            </Text>
          )}
          
          {/* Display image if downloaded */}
          {fileData.fileType === 'image' && localFileUri && !isDeleted && (
            <View style={styles.imageContainer}>
              <TouchableOpacity
                onPress={() => setShowFullScreen(true)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: localFileUri }} style={styles.fileImage} resizeMode="cover" />
              </TouchableOpacity>
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
          
          {/* Full screen image viewer */}
          {fileData.fileType === 'image' && (
            <FullScreenImageViewer
              visible={showFullScreen}
              imageUri={localFileUri}
              onClose={() => setShowFullScreen(false)}
            />
          )}
          
          {/* Display video if downloaded */}
          {fileData.fileType === 'video' && localFileUri && !isDeleted && (
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
            <>
              {isDeleted ? (
                <Text style={[styles.messageText, isMyMessage ? styles.sentText : styles.receivedText, styles.deletedMessage]}>
                  This message is deleted
                </Text>
              ) : (
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
            </>
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
  
  // Render bill split message
  if (isBillSplit) {
    // Ensure billSplitData is valid
    if (!billSplitData || typeof billSplitData !== 'object' || !billSplitData.billName) {
      // Fallback: render as regular message if bill split data is invalid
      console.warn('Bill split message but invalid billSplitData:', billSplitData);
      // Ensure message is a string for fallback rendering - convert to string and continue
      const fallbackMessage = typeof message === 'string' 
        ? message 
        : (message?.message || message?.text || JSON.stringify(message));
      // Continue to regular message rendering below - message will be handled there
    } else {
      const userSplit = billSplitData.splits?.find(s => s.userEmail === userEmail);
      const isPaid = userSplit?.paid || false;
      const userAmount = userSplit?.amount || 0;
      const totalAmount = billSplitData.totalAmount || 0;
      const status = billSplitData.status || 'pending';
    
    return (
      <TouchableOpacity
        style={[
          styles.container,
          isMyMessage ? styles.sentContainer : styles.receivedContainer,
          isMessageSelected && styles.selectedContainer,
        ]}
        onLongPress={handleLongPress}
        onPress={() => isMessageSelected && onSelect && onSelect(null)}
        activeOpacity={0.7}
      >
        {!isMyMessage && (
          <Text style={styles.username} numberOfLines={1}>{username}</Text>
        )}
        <View style={[styles.bubble, styles.billSplitBubble, isMyMessage ? styles.sentBubble : styles.receivedBubble]}>
          <View style={styles.billSplitHeader}>
            <Text style={styles.billSplitIcon}>💰</Text>
            <View style={styles.billSplitTitleContainer}>
              <Text style={[styles.billSplitTitle, isMyMessage ? styles.sentText : styles.receivedText]}>
                {billSplitData.billName || 'Bill Split'}
              </Text>
              <Text style={[styles.billSplitTotal, isMyMessage ? styles.sentTimestamp : styles.receivedTimestamp]}>
                Total: ₹{totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.billSplitDetails}>
            <Text style={[styles.billSplitYourAmount, isMyMessage ? styles.sentText : styles.receivedText]}>
              Your share: ₹{userAmount.toFixed(2)}
            </Text>
            
            {!isMyMessage && !isPaid && onMarkAsPaid && (
              <TouchableOpacity
                style={styles.markPaidButton}
                onPress={() => onMarkAsPaid(billSplitData._id)}
              >
                <Text style={styles.markPaidButtonText}>Mark as Paid</Text>
              </TouchableOpacity>
            )}
            
            {isPaid && (
              <View style={styles.paidBadge}>
                <Text style={styles.paidText}>✓ Paid</Text>
              </View>
            )}
          </View>
          
          <View style={styles.timestampContainer}>
            <Text style={[styles.timestamp, isMyMessage ? styles.sentTimestamp : styles.receivedTimestamp]}>
              {new Date(timestamp).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
    }
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
              {(() => {
                const replyText = typeof replyToMessage === 'string' 
                  ? replyToMessage 
                  : (replyToMessage?.message || replyToMessage?.text || String(replyToMessage || ''));
                
                // Check if it's a file message and extract file name
                try {
                  const parsed = JSON.parse(replyText);
                  if (parsed && parsed.type === 'file') {
                    return parsed.fileName || 'File';
                  }
                } catch {
                  // Not JSON, use as-is
                }
                
                return replyText.length > 50 ? replyText.substring(0, 50) + '...' : replyText;
              })()}
            </Text>
          </View>
        )}
        {isDeleted ? (
          <Text style={[styles.messageText, isMyMessage ? styles.sentText : styles.receivedText, styles.deletedMessage]}>
            This message is deleted
          </Text>
        ) : (
          <>
          {(() => {
            // Handle different message formats
            const messageStr = typeof message === 'string' 
              ? message 
              : (message?.message || message?.text || String(message || ''));
            
            // Check if it's a file message JSON - don't display JSON for file messages
            let displayText = messageStr;
            try {
              const parsed = JSON.parse(messageStr);
              if (parsed && parsed.type === 'file') {
                // Don't display JSON for file messages - the file will be displayed in the file section
                displayText = '';
              }
            } catch {
              // Not JSON, use as-is
            }
            
            // Only render text if there's content to show
            return displayText ? (
              <Text style={[styles.messageText, isMyMessage ? styles.sentText : styles.receivedText]}>
                {displayText}
              </Text>
            ) : null;
          })()}
            {editedAt && (
              <Text style={[styles.editedLabel, isMyMessage ? styles.sentTimestamp : styles.receivedTimestamp]}>
                (edited)
              </Text>
            )}
          </>
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
  deletedMessage: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  editedLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontStyle: 'italic',
    marginTop: SPACING.xs / 2,
  },
  callBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  callIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  callMessageTextContainer: {
    flex: 1,
  },
  callDurationText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs / 2,
  },
});

// Memoize MessageItem to prevent unnecessary re-renders
export default React.memo(MessageItem, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  // Only re-render if these props change
  return (
    prevProps.message === nextProps.message &&
    prevProps.timestamp === nextProps.timestamp &&
    prevProps.isSent === nextProps.isSent &&
    prevProps.status === nextProps.status &&
    prevProps.messageId === nextProps.messageId &&
    prevProps.isPinned === nextProps.isPinned &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDeleted === nextProps.isDeleted &&
    prevProps.editedAt === nextProps.editedAt &&
    prevProps.isCallMessage === nextProps.isCallMessage &&
    prevProps.isBillSplit === nextProps.isBillSplit
  );
});
