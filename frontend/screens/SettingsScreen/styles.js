import { StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  section: {
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.md,
  },
  passwordForm: {
    marginTop: SPACING.md,
  },
  passwordInput: {
    marginBottom: SPACING.md,
  },
  input: {
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  themeOption: {
    flex: 1,
  },
  themeInfo: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontStyle: 'italic',
  },
  loadingSpinner: {
    marginVertical: SPACING.md,
  },
  linkContainer: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  linkText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  shareButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  shareButton: {
    flex: 1,
    minWidth: '45%',
  },
  inviteButton: {
    marginTop: SPACING.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  toggleInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  toggleLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
  },
  toggleDescription: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    lineHeight: 18,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    // Active state handled by backgroundColor
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default styles;

