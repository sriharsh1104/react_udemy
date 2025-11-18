import { StyleSheet, Platform, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../constants';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    height: Platform.OS === 'web' ? '90%' : SCREEN_HEIGHT * 0.9, // Responsive height
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : '100%', // Limit width on web
    alignSelf: 'center', // Center on web
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl + 20 : SPACING.xl, // Extra padding for iOS safe area
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  contactSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  avatar: {
    width: SCREEN_WIDTH < 360 ? 70 : 80, // Smaller on small screens
    height: SCREEN_WIDTH < 360 ? 70 : 80,
    borderRadius: SCREEN_WIDTH < 360 ? 35 : 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  contactName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  contactEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  phoneNumbersContainer: {
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  contactPhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    marginTop: SPACING.xs / 2,
  },
  section: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  groupAvatar: {
    width: SCREEN_WIDTH < 360 ? 44 : 48, // Responsive sizing
    height: SCREEN_WIDTH < 360 ? 44 : 48,
    borderRadius: SCREEN_WIDTH < 360 ? 22 : 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  groupAvatarText: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  groupMembers: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  groupArrow: {
    fontSize: 20,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
  },
  mediaItem: {
    width: SCREEN_WIDTH < 360 ? '30%' : '31%', // Adjust for small screens
    aspectRatio: 1,
    margin: SCREEN_WIDTH < 360 ? '1.5%' : '1%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  mediaPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.receivedMessage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaIcon: {
    fontSize: 32,
  },
  viewMoreButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  viewMoreText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  loadingContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  followButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  followButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default styles;

