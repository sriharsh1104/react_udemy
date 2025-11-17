import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './AlertModal.styles';

/**
 * Reusable Alert Modal Component
 * Works on both React Native and Web
 * 
 * @param {boolean} visible - Whether modal is visible
 * @param {string} title - Modal title (default: "Alert")
 * @param {string} message - Alert message
 * @param {string} buttonText - Button text (default: "OK")
 * @param {function} onClose - Callback when user closes the alert
 * @param {string} type - Alert type ('default' | 'success' | 'error' | 'warning' | 'info')
 */
const AlertModal = ({
  visible,
  title = 'Alert',
  message,
  buttonText = 'OK',
  onClose,
  type = 'default', // 'default' | 'success' | 'error' | 'warning' | 'info'
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return '#10B981'; // Green
      case 'error':
        return '#EF4444'; // Red
      case 'warning':
        return '#F59E0B'; // Orange
      case 'info':
        return '#3B82F6'; // Blue
      default:
        return colors.primary;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {getIcon() && (
            <View style={[styles.iconContainer, { backgroundColor: getButtonColor() + '20' }]}>
              <Text style={[styles.icon, { color: getButtonColor() }]}>{getIcon()}</Text>
            </View>
          )}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: getButtonColor() }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;

