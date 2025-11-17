import { StyleSheet, Platform, Dimensions } from 'react-native';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  smallScreenContent: {
    paddingVertical: SPACING.md,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    minHeight: Dimensions.get('window').height * 0.7,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconText: {
    fontSize: 50,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  mottoContainer: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  motto: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 28,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(99, 102, 241, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emailText: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  inputContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    borderWidth: 1,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: TYPOGRAPHY.fontSize.xxl,
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  resendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  resendLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  backButton: {
    marginTop: SPACING.xl,
    padding: SPACING.sm,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  methodToggle: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  methodToggleButton: {
    padding: SPACING.sm,
  },
  methodToggleText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  forgetPasswordButton: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  forgetPasswordText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  signupLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default styles;

