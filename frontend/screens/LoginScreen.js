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
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../constants';
import authService from '../services/authService';

const LoginScreen = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('identifier'); // 'identifier' or 'otp'
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
      Alert.alert('OTP Sent', isEmailInput 
        ? 'Please check your email for the OTP code'
        : 'Please check your phone for the OTP code (check console for development)');
    } else {
      Alert.alert('Error', result.message || 'Failed to send OTP');
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
      Alert.alert('Error', result.message || 'Invalid OTP. Please try again.');
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
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>📧</Text>
          </View>
        </View>

        {step === 'identifier' ? (
          <>
            <Text style={styles.title}>Welcome to Chat</Text>
            <Text style={styles.subtitle}>Enter your email or phone number</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="email@example.com or +1234567890"
                placeholderTextColor={COLORS.inputPlaceholder}
                value={identifier}
                onChangeText={setIdentifier}
                onSubmitEditing={handleSendOTP}
                keyboardType={isEmail(identifier) ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, (!identifier.trim() || loading) && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={!identifier.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.emailText}>{identifier}</Text>
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="000000"
                placeholderTextColor={COLORS.inputPlaceholder}
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

            <TouchableOpacity
              style={[styles.button, (!otp.trim() || loading) && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={!otp.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive OTP? </Text>
              <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                <Text style={styles.resendLink}>Resend</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToIdentifier}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>← Change {loginType === 'email' ? 'Email' : 'Phone'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  iconText: {
    fontSize: 50,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  emailText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  inputContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: TYPOGRAPHY.fontSize.xxl,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  resendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  resendLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  backButton: {
    marginTop: SPACING.xl,
    padding: SPACING.sm,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});

export default LoginScreen;

