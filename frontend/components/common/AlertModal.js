import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
    }),
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow || '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    width: '100%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
});

export default AlertModal;

