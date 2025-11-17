import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Modal, Alert } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import fileUploadService from '../../services/fileUploadService';

const MessageInput = ({ value, onChangeText, onSend, onFileSelect, userEmail, replyingTo, onCancelReply, editingMessage, onCancelEdit, onBillSplitPress }) => {
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const handleSend = () => {
    if (value.trim()) {
      onSend();
    }
  };
  
  const handleKeyPress = (e) => {
    // On web, detect Enter key without Shift to send message
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // For mobile: when multiline is false, Enter will trigger onSubmitEditing
  // For web: we use onKeyPress to handle Enter
  const shouldUseMultiline = Platform.OS === 'web';
  
  const handleAttachmentPress = () => {
    setShowAttachmentMenu(true);
  };
  
  const handleFileSelect = async (type) => {
    setShowAttachmentMenu(false);
    
    try {
      let file = null;
      
      switch (type) {
        case 'image':
          file = await fileUploadService.pickImage();
          break;
        case 'video':
          file = await fileUploadService.pickVideo();
          break;
        case 'audio':
          file = await fileUploadService.pickAudio();
          break;
        case 'pdf':
          file = await fileUploadService.pickPDF();
          break;
        default:
          return;
      }
      
      if (file && onFileSelect) {
        onFileSelect(file);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to select file');
    }
  };

  const handleTakePhoto = async () => {
    setShowAttachmentMenu(false);
    try {
      const file = await fileUploadService.takePhoto();
      if (file && onFileSelect) {
        onFileSelect(file);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to take photo');
    }
  };

  // Placeholder handlers for new options (backend functions will be added later)
  const handlePoll = () => {
    setShowAttachmentMenu(false);
    // TODO: Add poll functionality
    Alert.alert('Poll', 'Poll feature coming soon');
  };

  const handleLocation = () => {
    setShowAttachmentMenu(false);
    // TODO: Add location functionality
    Alert.alert('Location', 'Location feature coming soon');
  };

  const handleDocument = () => {
    setShowAttachmentMenu(false);
    // TODO: Add document picker functionality
    Alert.alert('Document', 'Document feature coming soon');
  };

  const handleContact = () => {
    setShowAttachmentMenu(false);
    // TODO: Add contact sharing functionality
    Alert.alert('Contact', 'Contact sharing feature coming soon');
  };

  // Extract message text from replyingTo (handle JSON file messages)
  const getReplyMessageText = () => {
    if (!replyingTo) return '';
    
    // Handle different message formats
    let messageText = '';
    if (typeof replyingTo.message === 'string') {
      messageText = replyingTo.message;
    } else if (replyingTo.message && typeof replyingTo.message === 'object') {
      messageText = replyingTo.message.message || replyingTo.message.text || JSON.stringify(replyingTo.message);
    } else {
      messageText = String(replyingTo.message || '');
    }
    
    if (!messageText) return '';
    
    try {
      const parsed = JSON.parse(messageText);
      if (parsed && parsed.type === 'file') {
        return `📎 ${parsed.fileName || 'File'}`;
      }
    } catch {
      // Not JSON, return as-is
    }
    return messageText.length > 50 
      ? messageText.substring(0, 50) + '...' 
      : messageText;
  };

  // Extract message text for editing display
  const getEditMessageText = () => {
    if (!editingMessage) return '';
    
    // Handle different message formats
    let messageText = '';
    if (typeof editingMessage.message === 'string') {
      messageText = editingMessage.message;
    } else if (editingMessage.message && typeof editingMessage.message === 'object') {
      messageText = editingMessage.message.message || editingMessage.message.text || JSON.stringify(editingMessage.message);
    } else {
      messageText = String(editingMessage.message || '');
    }
    
    if (!messageText) return '';
    
    try {
      const parsed = JSON.parse(messageText);
      if (parsed && parsed.type === 'file') {
        return `📎 ${parsed.fileName || 'File'}`;
      }
    } catch {
      // Not JSON, return as-is
    }
    return messageText.length > 50 
      ? messageText.substring(0, 50) + '...' 
      : messageText;
  };

  return (
    <View style={styles.container}>
      {editingMessage && (
        <View style={[styles.replyContainer, styles.editContainer]}>
          <View style={styles.replyContent}>
            <View style={[styles.replyIndicator, { backgroundColor: COLORS.primary }]} />
            <View style={styles.replyTextContainer}>
              <Text style={styles.replyLabel}>
                Editing message
              </Text>
              <Text style={styles.replyMessage} numberOfLines={1}>
                {getEditMessageText()}
              </Text>
            </View>
          </View>
          {onCancelEdit && (
            <TouchableOpacity 
              style={styles.cancelReplyButton}
              onPress={onCancelEdit}
            >
              <Text style={styles.cancelReplyIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {replyingTo && !editingMessage && (
        <View style={styles.replyContainer}>
          <View style={styles.replyContent}>
            <View style={styles.replyIndicator} />
            <View style={styles.replyTextContainer}>
              <Text style={styles.replyLabel}>
                {replyingTo.senderEmail === userEmail ? 'You' : 'Replying to'}
              </Text>
              <Text style={styles.replyMessage} numberOfLines={1}>
                {getReplyMessageText()}
              </Text>
            </View>
          </View>
          {onCancelReply && (
            <TouchableOpacity 
              style={styles.cancelReplyButton}
              onPress={onCancelReply}
            >
              <Text style={styles.cancelReplyIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.inputWrapper}>
        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={handleTakePhoto}
          activeOpacity={0.7}
        >
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.attachmentButton}
          onPress={handleAttachmentPress}
          activeOpacity={0.7}
        >
          <Text style={styles.attachmentIcon}>📎</Text>
        </TouchableOpacity>
        
        {onBillSplitPress && (
          <TouchableOpacity 
            style={styles.billSplitButton}
            onPress={onBillSplitPress}
            activeOpacity={0.7}
          >
            <Text style={styles.billSplitIcon}>💰</Text>
          </TouchableOpacity>
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor={COLORS.inputPlaceholder}
          value={value}
          onChangeText={onChangeText}
          multiline={shouldUseMultiline}
          maxLength={1000}
          textAlignVertical="center"
          onSubmitEditing={!shouldUseMultiline ? handleSend : undefined}
          blurOnSubmit={false}
          returnKeyType="send"
          onKeyPress={handleKeyPress}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !value.trim() && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={!value.trim()}
          activeOpacity={0.7}
        >
          <View style={styles.sendIcon}>
            <Text style={styles.sendIconText}>➤</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Attachment Menu Modal */}
      <Modal
        visible={showAttachmentMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachmentMenu(false)}
        >
          <View style={styles.attachmentMenu} onStartShouldSetResponder={() => true}>
            {/* Row 1 */}
            <View style={styles.menuRow}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleFileSelect('image')}
              >
                <Text style={styles.menuIcon}>🖼️</Text>
                <Text style={styles.menuText}>Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleTakePhoto}
              >
                <Text style={styles.menuIcon}>📷</Text>
                <Text style={styles.menuText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleLocation}
              >
                <Text style={styles.menuIcon}>📍</Text>
                <Text style={styles.menuText}>Location</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleContact}
              >
                <Text style={styles.menuIcon}>👤</Text>
                <Text style={styles.menuText}>Contact</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2 */}
            <View style={styles.menuRow}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleDocument}
              >
                <Text style={styles.menuIcon}>📄</Text>
                <Text style={styles.menuText}>Document</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleFileSelect('audio')}
              >
                <Text style={styles.menuIcon}>🎵</Text>
                <Text style={styles.menuText}>Audio</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handlePoll}
              >
                <Text style={styles.menuIcon}>📊</Text>
                <Text style={styles.menuText}>Poll</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleFileSelect('video')}
              >
                <Text style={styles.menuIcon}>🎥</Text>
                <Text style={styles.menuText}>Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.inputBackground,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.sm,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
    minHeight: 44,
    maxHeight: 100,
  },
  cameraButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  cameraIcon: {
    fontSize: 20,
    color: COLORS.text,
  },
  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  attachmentIcon: {
    fontSize: 20,
    color: COLORS.text,
  },
  billSplitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  billSplitIcon: {
    fontSize: 20,
    color: COLORS.text,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    paddingHorizontal: SPACING.sm,
    paddingVertical: Platform.OS === 'ios' ? SPACING.xs : SPACING.xs / 2,
    maxHeight: 80,
    minHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  sendIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIconText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  attachmentMenu: {
    backgroundColor: COLORS.inputBackground,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  menuItem: {
    alignItems: 'center',
    padding: SPACING.sm,
    minWidth: 70,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  menuText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.receivedMessage,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  replyContent: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  replyIndicator: {
    width: 3,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: SPACING.sm,
  },
  replyTextContainer: {
    flex: 1,
  },
  replyLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2,
  },
  replyMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  cancelReplyButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  cancelReplyIcon: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  editContainer: {
    backgroundColor: COLORS.primary + '20', // Light tint for edit mode
  },
});

export default MessageInput;
