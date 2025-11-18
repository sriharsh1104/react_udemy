import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, Modal, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS } from '../../../constants';
import fileUploadService from '../../../services/fileUploadService';
import EmojiPicker from '../EmojiPicker';
import GIFPicker from '../GIFPicker';
import styles from './MessageInput.styles';

const MessageInput = ({ value, onChangeText, onSend, onFileSelect, userEmail, replyingTo, onCancelReply, editingMessage, onCancelEdit, onBillSplitPress }) => {
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGIFPicker, setShowGIFPicker] = useState(false);

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

  const handleEmojiSelect = (emoji) => {
    onChangeText(value + emoji);
    setShowEmojiPicker(false);
  };

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
      
      const file = {
        uri: fileUri,
        type: 'image',
        name: `gif_${Date.now()}.gif`,
        mimeType: 'image/gif',
        size: fileSize,
      };
      
      // Use the existing file upload handler
      if (onFileSelect) {
        onFileSelect(file);
      }
    } catch (error) {
      console.error('Error handling GIF:', error);
      Alert.alert('Error', 'Failed to send GIF. Please try again.');
    }
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
        
        <TouchableOpacity 
          style={styles.emojiButton}
          onPress={() => {
            setShowGIFPicker(false);
            setShowEmojiPicker(!showEmojiPicker);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.emojiIcon}>😊</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.gifButton}
          onPress={() => {
            setShowEmojiPicker(false);
            setShowGIFPicker(!showGIFPicker);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.gifIcon}>GIF</Text>
        </TouchableOpacity>
        
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
    </View>
  );
};

export default MessageInput;

