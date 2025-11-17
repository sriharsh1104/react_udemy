import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './ConfirmationModal.styles';

/**
 * Reusable Confirmation Modal Component
 * Works on both React Native and Web
 * 
 * @param {boolean} visible - Whether modal is visible
 * @param {string} title - Modal title (default: "Confirm")
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Confirm button text (default: "Yes")
 * @param {string} cancelText - Cancel button text (default: "No")
 * @param {function} onConfirm - Callback when user confirms
 * @param {function} onCancel - Callback when user cancels
 * @param {string} confirmButtonStyle - Style for confirm button ('default' | 'destructive')
 */
const ConfirmationModal = ({
  visible,
  title = 'Confirm',
  message,
  confirmText = 'Yes',
  cancelText = 'No',
  onConfirm,
  onCancel,
  confirmButtonStyle = 'default', // 'default' or 'destructive'
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  const isDestructive = confirmButtonStyle === 'destructive';

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.divider }]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                isDestructive ? styles.destructiveButton : styles.confirmButton,
                isDestructive 
                  ? { backgroundColor: '#EF4444' } 
                  : { backgroundColor: colors.primary }
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;

