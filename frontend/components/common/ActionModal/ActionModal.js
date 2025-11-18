import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './ActionModal.styles';

/**
 * Reusable Action Modal Component for multiple options
 * Works on both React Native and Web
 * 
 * @param {boolean} visible - Whether modal is visible
 * @param {string} title - Modal title
 * @param {string} message - Optional message
 * @param {Array} options - Array of options: [{ text: string, onPress: function, style?: 'default' | 'destructive' | 'cancel' }]
 * @param {function} onClose - Callback when user closes the modal
 */
const ActionModal = ({
  visible,
  title,
  message,
  options = [],
  onClose,
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {title && (
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          )}
          {message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          )}
          
          <View style={styles.optionsContainer}>
            {options.map((option, index) => {
              const isCancel = option.style === 'cancel';
              const isDestructive = option.style === 'destructive';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    index < options.length - 1 && styles.optionButtonBorder,
                    { borderColor: colors.divider },
                    isCancel && styles.cancelButton,
                  ]}
                  onPress={() => {
                    if (option.onPress) {
                      option.onPress();
                    }
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: isDestructive ? '#EF4444' : colors.text },
                      isCancel && styles.cancelText,
                    ]}
                  >
                    {option.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ActionModal;

