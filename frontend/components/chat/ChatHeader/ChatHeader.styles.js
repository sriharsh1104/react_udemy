import { StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../constants';

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.headerBackground,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.headerText,
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.offline,
    marginRight: SPACING.xs,
  },
  statusDotOnline: {
    backgroundColor: COLORS.online,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textTransform: 'lowercase',
  },
  sidebarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  sidebarButtonText: {
    fontSize: 20,
    color: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  profileButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
    padding: SPACING.xs,
  },
  profileButtonText: {
    fontSize: 24,
    color: COLORS.headerText,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  callButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  callButtonText: {
    fontSize: 18,
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : StatusBar.currentHeight + 60,
    paddingRight: SPACING.md,
  },
  dropdownContainer: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 180,
    paddingVertical: SPACING.xs,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownItem: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  dropdownItemText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.xs,
  },
  logoutItem: {
    // Logout styling
  },
  logoutText: {
    color: '#EF4444', // Red color for logout
  },
  destructiveItem: {
    // Destructive action styling
  },
  destructiveText: {
    color: '#EF4444', // Red color for destructive actions
  },
});

export default styles;

