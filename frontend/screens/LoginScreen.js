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
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const result = await authService.sendOTP(email.trim());

    if (result.success) {
      setOtpSent(true);
      setStep('otp');
      Alert.alert('OTP Sent', 'Please check your email for the OTP code');
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
    const result = await authService.verifyOTP(email.trim(), otp.trim());

    if (result.success) {
      // Store auth token
      await AsyncStorage.setItem('authToken', result.token);
      await AsyncStorage.setItem('userEmail', result.email);
      
      // Directly login to chat section without alert
      onLogin(result.email, result.token);
    } else {
      Alert.alert('Error', result.message || 'Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    await handleSendOTP();
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setOtpSent(false);
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

        {step === 'email' ? (
          <>
            <Text style={styles.title}>Welcome to Chat</Text>
            <Text style={styles.subtitle}>Enter your email to receive OTP</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor={COLORS.inputPlaceholder}
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={handleSendOTP}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, (!email.trim() || loading) && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={!email.trim() || loading}
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
              <Text style={styles.emailText}>{email}</Text>
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
              onPress={handleBackToEmail}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>← Change Email</Text>
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

