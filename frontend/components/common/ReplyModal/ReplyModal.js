import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './ReplyModal.styles';

const ReplyModal = ({ visible, notification, onSend, onClose }) => {
  const { colors } = useTheme();
  const [replyText, setReplyText] = useState('');

  const handleSend = () => {
    if (replyText.trim() && onSend) {
      onSend(replyText.trim());
      setReplyText('');
      onClose();
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    // On web, detect Enter key without Shift to send message
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setReplyText('');
    onClose();
  };

  if (!notification) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Reply</Text>
            <View style={styles.cancelButton} />
          </View>

          {/* Original Message Preview */}
          <View style={[styles.originalMessage, { backgroundColor: colors.receivedMessage }]}>
            <View style={styles.originalHeader}>
              <Text style={[styles.originalSender, { color: colors.text }]}>
                {notification.senderName || notification.senderEmail?.split('@')[0] || 'Unknown'}
              </Text>
            </View>
            <Text style={[styles.originalText, { color: colors.textSecondary }]} numberOfLines={3}>
              {notification.message}
            </Text>
          </View>

          {/* Reply Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.inputBackground,
                color: colors.inputText,
                borderColor: colors.divider,
              }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.inputPlaceholder}
              value={replyText}
              onChangeText={setReplyText}
              multiline={Platform.OS === 'web'}
              autoFocus
              maxLength={1000}
              onSubmitEditing={Platform.OS !== 'web' ? handleSend : undefined}
              blurOnSubmit={false}
              returnKeyType="send"
              onKeyPress={handleKeyPress}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { 
                  backgroundColor: replyText.trim() ? colors.primary : colors.textLight,
                }
              ]}
              onPress={handleSend}
              disabled={!replyText.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ReplyModal;

