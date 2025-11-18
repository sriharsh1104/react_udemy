import { StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../../constants';

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
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    width: '100%',
  },
  optionButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  optionButtonBorder: {
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  cancelButton: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  cancelText: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default styles;

