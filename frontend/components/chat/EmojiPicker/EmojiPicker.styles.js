import { StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../../constants';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.inputBackground,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeIcon: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchInput: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
  },
  categoryContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    maxHeight: 50,
  },
  categoryContent: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.receivedMessage,
    minHeight: 36,
    justifyContent: 'center',
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryIconActive: {
    marginRight: SPACING.xs / 2,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  emojiContainer: {
    flex: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.sm,
  },
  emojiItem: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xs,
  },
  emoji: {
    fontSize: 28,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
});

export default styles;

