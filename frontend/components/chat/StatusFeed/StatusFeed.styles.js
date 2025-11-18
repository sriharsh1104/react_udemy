import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Feed Item Styles
  feedItem: {
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  feedAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  feedHeaderInfo: {
    flex: 1,
  },
  feedUserName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  feedTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  fabIcon: {
    fontSize: 28,
    color: COLORS.white,
  },
  userProfileModal: {
    height: '70%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.md,
  },
  profileLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  profileContent: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.xs,
  },
  profileEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.xs,
  },
  phoneNumbersContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  profilePhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.xs / 2,
  },
  profileAge: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.xs,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  privateBadge: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginLeft: SPACING.xs,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.divider,
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatNumber: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  profileStatLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.xs / 2,
  },
  followButton: {
    width: '80%',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    borderWidth: 1,
  },
  followButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  privateAccountNotice: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  privateAccountText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
  },
  headerContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  clearIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    padding: SPACING.xs,
  },
  feedModeContainer: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.md,
    padding: 2,
  },
  feedModeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  feedModeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  searchResultsContainer: {
    maxHeight: 300,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  searchAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  searchAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  searchResultEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: 2,
  },
  privateIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  noResultsContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  feedMediaContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedMedia: {
    width: SCREEN_WIDTH - (SPACING.md * 2),
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  doubleTapHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartEmoji: {
    fontSize: 60,
  },
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  feedActionButton: {
    marginRight: SPACING.md,
  },
  feedActionIcon: {
    fontSize: 28,
  },
  feedActionSpacer: {
    flex: 1,
  },
  feedLikes: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  feedCaption: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  feedCaptionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  feedCaptionUser: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  feedCommentsButton: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  feedCommentsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
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
    marginBottom: SPACING.lg,
  },
  addStatusButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  addStatusButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  viewersModal: {
    height: '70%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.md,
  },
  commentsModal: {
    height: '70%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.md,
  },
  commentsList: {
    flex: 1,
    padding: SPACING.md,
  },
  commentItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  commentAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
  },
  commentText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginBottom: SPACING.xs,
  },
  commentTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  emptyComments: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
    maxHeight: 100,
  },
  commentSendButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  commentSendText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: SPACING.xl,
  },
  viewersList: {
    flex: 1,
    padding: SPACING.md,
  },
  viewersCount: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.md,
  },
  noViewers: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  viewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  viewerAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  viewerInfo: {
    flex: 1,
  },
  viewerName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2,
  },
  viewerTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  infoButton: {
    padding: SPACING.sm,
  },
  infoButtonText: {
    fontSize: 20,
  },
  myStatusAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  captionModal: {
    height: '80%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.md,
  },
  captionPreviewContainer: {
    width: '100%',
    height: 200,
    marginVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionPreviewImage: {
    width: '90%',
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  captionInputScroll: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  captionInputContainer: {
    marginBottom: SPACING.md,
  },
  captionLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.sm,
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  captionCharCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  captionButtonContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  captionPostButton: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  captionPostButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  // Full-screen image modal
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCloseButton: {
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
  fullScreenCloseButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  // Comment row and actions
  commentRow: {
    flexDirection: 'row',
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  pinButton: {
    padding: SPACING.xs,
  },
  pinButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  commentActionIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginRight: SPACING.xs / 2,
  },
  commentActionCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  commentActionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  // Replies
  repliesContainer: {
    marginTop: SPACING.md,
    marginLeft: SPACING.md,
    paddingLeft: SPACING.md,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.divider,
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  replyAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  replyContent: {
    flex: 1,
  },
  replyUserName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs / 2,
  },
  replyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.xs / 2,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginLeft: SPACING.sm,
  },
  // Reply input
  replyInputContainer: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  replyInput: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    maxHeight: 80,
  },
  replyInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  replyCancelButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
  },
  replyCancelText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  replySendButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  replySendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default styles;

