import { StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../../constants';

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  countText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    flex: 1,
    marginLeft: SPACING.xs,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  actionButton: {
    padding: SPACING.xs,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 22,
  },
  deleteIcon: {
    // Keep same for now, can add red tint if needed
  },
});

export default styles;

