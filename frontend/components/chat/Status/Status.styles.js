import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STATUS_AVATAR_SIZE = SCREEN_WIDTH < 360 ? 50 : 56;
const STATUS_AVATAR_RADIUS = STATUS_AVATAR_SIZE / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusList: {
    padding: SPACING.md,
    paddingLeft: 0,
    paddingBottom: SPACING.xl,
  },
  myStatusHeader: {
    width: '100%',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    alignItems: 'flex-start',
  },
  myStatusItem: {
    alignItems: 'flex-start',
  },
  myStatusContainer: {
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  myStatusAvatar: {
    width: STATUS_AVATAR_SIZE,
    height: STATUS_AVATAR_SIZE,
    borderRadius: STATUS_AVATAR_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.receivedMessage,
  },
  myStatusAvatarImage: {
    width: STATUS_AVATAR_SIZE,
    height: STATUS_AVATAR_SIZE,
    borderRadius: STATUS_AVATAR_RADIUS,
    borderWidth: 2.5,
    borderColor: COLORS.divider,
  },
  addStatusIcon: {
    fontSize: SCREEN_WIDTH < 360 ? 22 : 26,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  addStatusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: SCREEN_WIDTH < 360 ? 20 : 22,
    height: SCREEN_WIDTH < 360 ? 20 : 22,
    borderRadius: SCREEN_WIDTH < 360 ? 10 : 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.background,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addStatusBadgeText: {
    fontSize: SCREEN_WIDTH < 360 ? 10 : 12,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  myStatusName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'left',
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  statusRow: {
    justifyContent: 'flex-start',
    marginBottom: SPACING.md,
    paddingLeft: 4,
    paddingRight: SPACING.md,
  },
  statusItem: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statusItemLast: {
    marginRight: 0,
  },
  statusAvatarContainer: {
    width: STATUS_AVATAR_SIZE,
    height: STATUS_AVATAR_SIZE,
    borderRadius: STATUS_AVATAR_RADIUS,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  statusAvatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusAvatarImage: {
    width: '100%',
    height: '100%',
  },
  statusAvatarText: {
    fontSize: SCREEN_WIDTH < 360 ? TYPOGRAPHY.fontSize.md : TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statusName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'center',
    marginTop: SPACING.xs,
    maxWidth: '100%',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  statusViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusContentView: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  statusVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  statusViewerInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  statusViewerName: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: 4,
  },
  statusViewerTime: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    opacity: 0.8,
  },
  statusNavigation: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonRight: {
    alignSelf: 'flex-end',
  },
  navButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
  },
});

export default styles;

