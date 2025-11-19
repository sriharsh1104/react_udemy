import { StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../../constants';

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    maxWidth: '85%',
  },
  sentContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.message,
    maxWidth: '100%',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sentBubble: {
    backgroundColor: COLORS.sentMessage,
    borderBottomRightRadius: BORDER_RADIUS.xs, // WhatsApp-style tail
  },
  receivedBubble: {
    backgroundColor: COLORS.receivedMessage,
    borderBottomLeftRadius: BORDER_RADIUS.xs, // WhatsApp-style tail
  },
  billSplitBubble: {
    // Additional styling for bill split messages if needed
  },
  username: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    paddingHorizontal: SPACING.sm,
  },
  messageText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 20,
  },
  sentText: {
    color: COLORS.white,
  },
  receivedText: {
    color: COLORS.text,
  },
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  timestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginLeft: SPACING.xs,
  },
  sentTimestamp: {
    color: COLORS.white,
    opacity: 0.8,
  },
  receivedTimestamp: {
    color: COLORS.textSecondary,
  },
  systemContainer: {
    alignSelf: 'center',
    backgroundColor: COLORS.systemMessage,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.sm,
    maxWidth: '90%',
  },
  systemText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fileContainer: {
    alignItems: 'center',
    padding: SPACING.md,
    minWidth: 200,
  },
  fileIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  fileName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  fileSize: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginBottom: SPACING.xs,
  },
  downloadText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  fileImage: {
    width: 250,
    height: 250,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  fileVideo: {
    width: 250,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  videoContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  downloadButtonOverlay: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BORDER_RADIUS.full,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  downloadIcon: {
    fontSize: 18,
    color: COLORS.white,
  },
  fileInfoContainer: {
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  tickMark: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginLeft: SPACING.xs / 2,
  },
  tickMarkSent: {
    color: COLORS.white,
    opacity: 0.6,
  },
  tickMarkDelivered: {
    color: COLORS.white,
    opacity: 0.8,
  },
  tickMarkRead: {
    color: '#4FC3F7', // Light blue color for read messages (WhatsApp style)
    opacity: 1,
  },
  retryButton: {
    marginLeft: SPACING.xs,
    padding: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  retryIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  pinnedBubble: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
  },
  pinnedIcon: {
    fontSize: 14,
    marginRight: SPACING.xs / 2,
  },
  pinnedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontStyle: 'italic',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  menuButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  menuIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedContainer: {
    opacity: 0.7,
    backgroundColor: COLORS.primary + '20', // Semi-transparent primary color
  },
  replyReference: {
    borderLeftWidth: 3,
    paddingLeft: SPACING.sm,
    marginBottom: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
  },
  replySenderName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2,
  },
  replyMessageText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  deletedMessage: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  editedLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontStyle: 'italic',
    marginTop: SPACING.xs / 2,
  },
  callBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  callIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  callMessageTextContainer: {
    flex: 1,
  },
  callDurationText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs / 2,
  },
  billSplitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  billSplitIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  billSplitTitleContainer: {
    flex: 1,
  },
  billSplitTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs / 2,
  },
  billSplitTotal: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  billSplitDetails: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
  },
  billSplitYourAmount: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.sm,
  },
  markPaidButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  markPaidButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'center',
  },
  paidBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
  },
  paidText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default styles;

