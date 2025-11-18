import { StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../../constants';

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
  emojiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  emojiIcon: {
    fontSize: 20,
    color: COLORS.text,
  },
  gifButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
    backgroundColor: COLORS.primary + '20',
  },
  gifIcon: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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

export default styles;

