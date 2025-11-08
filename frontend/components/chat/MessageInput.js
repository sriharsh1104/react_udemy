import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Modal, Alert } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import fileUploadService from '../../services/fileUploadService';

const MessageInput = ({ value, onChangeText, onSend, onFileSelect, userEmail }) => {
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const handleSend = () => {
    if (value.trim()) {
      onSend();
    }
  };
  
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

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TouchableOpacity 
          style={styles.attachmentButton}
          onPress={handleAttachmentPress}
          activeOpacity={0.7}
        >
          <Text style={styles.attachmentIcon}>📎</Text>
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor={COLORS.inputPlaceholder}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={1000}
          textAlignVertical="center"
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
          <View style={styles.attachmentMenu}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFileSelect('image')}
            >
              <Text style={styles.menuIcon}>🖼️</Text>
              <Text style={styles.menuText}>Image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleFileSelect('video')}
            >
              <Text style={styles.menuIcon}>🎥</Text>
              <Text style={styles.menuText}>Video</Text>
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
              onPress={() => handleFileSelect('pdf')}
            >
              <Text style={styles.menuIcon}>📄</Text>
              <Text style={styles.menuText}>PDF</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  menuItem: {
    alignItems: 'center',
    padding: SPACING.md,
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
});

export default MessageInput;
