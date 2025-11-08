import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/common/Button';
import PasswordInput from '../components/common/PasswordInput';
import AnimatedBackground from '../components/common/AnimatedBackground';
import GLoader from '../components/common/GLoader';
import authService from '../services/authService';

const LoginScreen = ({ onLogin }) => {
  const { colors, isDark } = useTheme();
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('identifier'); // 'identifier', 'otp', 'password', 'forget-password', 'reset-password'
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'password'
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('email'); // 'email' or 'phone'

  const isEmail = (text) => text.includes('@');
  const isValidPhone = (text) => /^\+?[1-9]\d{1,14}$/.test(text.replace(/\s/g, ''));

  const handleSendOTP = async () => {
    const trimmedId = identifier.trim();
    
    if (!trimmedId) {
      Alert.alert('Required', 'Please enter your email or phone number');
      return;
    }

    const isEmailInput = isEmail(trimmedId);
    
    if (isEmailInput && !trimmedId.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!isEmailInput && !isValidPhone(trimmedId)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    setLoginType(isEmailInput ? 'email' : 'phone');
    setLoading(true);
    
    const result = isEmailInput 
      ? await authService.sendOTP(trimmedId)
      : await authService.sendOTP(null, trimmedId);

    if (result.success) {
      setStep('otp');
      // Toast already shown by authService
    } else {
      // Toast already shown by authService
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    const trimmedId = identifier.trim();
    const result = loginType === 'email'
      ? await authService.verifyOTP(trimmedId, otp.trim())
      : await authService.verifyOTP(null, otp.trim(), trimmedId);

    if (result.success) {
      // Store auth token
      await AsyncStorage.setItem('authToken', result.token);
      await AsyncStorage.setItem('userEmail', result.email);
      
      // Pass profile with isProfileComplete flag
      const profileWithComplete = result.profile 
        ? { ...result.profile, isProfileComplete: result.isProfileComplete }
        : null;
      
      // Directly login to chat section without alert
      onLogin(result.email, result.token, profileWithComplete, result.isProfileComplete);
    } else {
      // Toast already shown by authService
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    await handleSendOTP();
  };

  const handleBackToIdentifier = () => {
    setStep('identifier');
    setOtp('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLoginWithPassword = async () => {
    const trimmedId = identifier.trim();
    
    if (!trimmedId || !password.trim()) {
      Alert.alert('Required', 'Please enter your email/phone and password');
      return;
    }

    const isEmailInput = isEmail(trimmedId);
    setLoginType(isEmailInput ? 'email' : 'phone');
    setLoading(true);
    
    const result = isEmailInput 
      ? await authService.loginWithPassword(trimmedId, null, password)
      : await authService.loginWithPassword(null, trimmedId, password);

    if (result.success) {
      // Store auth token
      await AsyncStorage.setItem('authToken', result.token);
      await AsyncStorage.setItem('userEmail', result.email);
      
      // Pass profile with isProfileComplete flag
      const profileWithComplete = result.profile 
        ? { ...result.profile, isProfileComplete: result.isProfileComplete }
        : null;
      
      // Directly login to chat section
      onLogin(result.email, result.token, profileWithComplete, result.isProfileComplete);
    } else {
      setLoading(false);
    }
  };

  const handleForgetPassword = async () => {
    const trimmedId = identifier.trim();
    
    if (!trimmedId) {
      Alert.alert('Required', 'Please enter your email or phone number');
      return;
    }

    const isEmailInput = isEmail(trimmedId);
    setLoginType(isEmailInput ? 'email' : 'phone');
    setLoading(true);
    
    const result = isEmailInput 
      ? await authService.forgetPassword(trimmedId, null)
      : await authService.forgetPassword(null, trimmedId);

    if (result.success) {
      setStep('reset-password');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirm password do not match');
      return;
    }

    setLoading(true);
    const trimmedId = identifier.trim();
    const result = loginType === 'email'
      ? await authService.resetPassword(trimmedId, null, otp.trim(), newPassword)
      : await authService.resetPassword(null, trimmedId, otp.trim(), newPassword);

    if (result.success) {
      // After password reset, go back to login
      setStep('identifier');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setPassword('');
      Alert.alert('Success', 'Password reset successfully. Please login with your new password.');
    }
    setLoading(false);
  };

  const screenHeight = Dimensions.get('window').height;
  const isSmallScreen = screenHeight < 700;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <AnimatedBackground />
      <GLoader visible={loading} message="Please wait..." />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isSmallScreen && styles.smallScreenContent]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.icon, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}>
            <Text style={styles.iconText}>📧</Text>
          </View>
        </View>

        {step === 'identifier' ? (
          <>
            {/* <Text style={[styles.title, { color: colors.text }]}>Welcome to Chat</Text> */}
            <View style={styles.mottoContainer}>
              <Text style={[styles.motto, { color: colors.primary }]}>
                "Connect with Confidence,{"\n"}Privacy by Design"
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your email or phone number</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { backgroundColor: '#1E3A5F', color: colors.text, borderColor: '#FFFFFF', borderWidth: 1 }]}
                placeholder="email@example.com or +1234567890"
                placeholderTextColor="#B0C4DE"
                value={identifier}
                onChangeText={setIdentifier}
                onSubmitEditing={loginMethod === 'otp' ? handleSendOTP : handleLoginWithPassword}
                keyboardType={isEmail(identifier) ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                editable={!loading}
              />
            </View>

            {loginMethod === 'password' && (
              <View style={styles.inputContainer}>
                <PasswordInput
                  placeholder="Password"
                  placeholderTextColor="#B0C4DE"
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleLoginWithPassword}
                  returnKeyType="send"
                  editable={!loading}
                />
              </View>
            )}

            <Button
              title={loginMethod === 'otp' ? 'Send OTP' : 'Login'}
              onPress={loginMethod === 'otp' ? handleSendOTP : handleLoginWithPassword}
              variant="primary"
              size="large"
              loading={loading}
              disabled={!identifier.trim() || (loginMethod === 'password' && !password.trim()) || loading}
              fullWidth
            />

            <View style={styles.methodToggle}>
              <TouchableOpacity
                onPress={() => {
                  setLoginMethod(loginMethod === 'otp' ? 'password' : 'otp');
                  setPassword('');
                }}
                style={styles.methodToggleButton}
              >
                <Text style={[styles.methodToggleText, { color: colors.textSecondary }]}>
                  {loginMethod === 'otp' ? 'Login with Password' : 'Login with OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            {loginMethod === 'password' && (
              <TouchableOpacity
                onPress={() => {
                  setStep('forget-password');
                  setPassword('');
                }}
                style={styles.forgetPasswordButton}
              >
                <Text style={[styles.forgetPasswordText, { color: colors.primary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : step === 'otp' ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Enter OTP</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={[styles.emailText, { color: colors.primary }]}>{identifier}</Text>
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.otpInput, { backgroundColor: '#1E3A5F', color: colors.text, borderColor: '#FFFFFF', borderWidth: 1 }]}
                placeholder="000000"
                placeholderTextColor="#B0C4DE"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                onSubmitEditing={handleVerifyOTP}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                editable={!loading}
                autoFocus
              />
            </View>

            <Button
              title="Verify OTP"
              onPress={handleVerifyOTP}
              variant="primary"
              size="large"
              loading={loading}
              disabled={!otp.trim() || loading}
              fullWidth
            />

            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: colors.textSecondary }]}>Didn't receive OTP? </Text>
              <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                <Text style={[styles.resendLink, { color: colors.primary }]}>Resend</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToIdentifier}
              disabled={loading}
            >
              <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>← Change {loginType === 'email' ? 'Email' : 'Phone'}</Text>
            </TouchableOpacity>
          </>
        ) : step === 'forget-password' ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Forgot Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your email or phone number to receive OTP
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { backgroundColor: '#1E3A5F', color: colors.text, borderColor: '#FFFFFF', borderWidth: 1 }]}
                placeholder="email@example.com or +1234567890"
                placeholderTextColor="#B0C4DE"
                value={identifier}
                onChangeText={setIdentifier}
                onSubmitEditing={handleForgetPassword}
                keyboardType={isEmail(identifier) ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                editable={!loading}
              />
            </View>

            <Button
              title="Send OTP"
              onPress={handleForgetPassword}
              variant="primary"
              size="large"
              loading={loading}
              disabled={!identifier.trim() || loading}
              fullWidth
            />

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setStep('identifier');
                setPassword('');
              }}
              disabled={loading}
            >
              <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>← Back to Login</Text>
            </TouchableOpacity>
          </>
        ) : step === 'reset-password' ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter OTP sent to{'\n'}
              <Text style={[styles.emailText, { color: colors.primary }]}>{identifier}</Text>
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.otpInput, { backgroundColor: '#1E3A5F', color: colors.text, borderColor: '#FFFFFF', borderWidth: 1 }]}
                placeholder="000000"
                placeholderTextColor="#B0C4DE"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="next"
                editable={!loading}
                autoFocus
              />
            </View>

            <View style={styles.inputContainer}>
              <PasswordInput
                placeholder="New Password"
                placeholderTextColor="#B0C4DE"
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <PasswordInput
                placeholder="Confirm Password"
                placeholderTextColor="#B0C4DE"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onSubmitEditing={handleResetPassword}
                returnKeyType="done"
                editable={!loading}
              />
            </View>

            <Button
              title="Reset Password"
              onPress={handleResetPassword}
              variant="primary"
              size="large"
              loading={loading}
              disabled={!otp.trim() || !newPassword.trim() || !confirmPassword.trim() || loading}
              fullWidth
            />

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setStep('forget-password');
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              disabled={loading}
            >
              <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>← Back</Text>
            </TouchableOpacity>
          </>
        ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
});

export default LoginScreen;

