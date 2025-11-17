import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
    backgroundColor: COLORS.background,
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
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  activeTabButton: {
    // Active state styling handled by icon and label colors
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs / 2,
  },
  activeTabIcon: {
    // Icon color stays the same, but you can add transform or other effects
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  footer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});

export default styles;

