import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/common/Button';
import authService from '../services/authService';
import { showToastFromResponse } from '../utils/toast';

const ReferralScreen = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get referral code from route params
    const code = route?.params?.referralCode || route?.params?.code;
    if (code) {
      setReferralCode(code);
      setLoading(false);
    } else {
      // Try to extract from URL if not in params (for web)
      if (typeof window !== 'undefined' && window.location) {
        const path = window.location.pathname;
        const match = path.match(/\/referral\/([^/?]+)/);
        if (match && match[1]) {
          setReferralCode(match[1]);
          setLoading(false);
          return;
        }
      }
      setError('Invalid referral link');
      setLoading(false);
    }
  }, [route]);

  const handleContinue = () => {
    // Navigate to login screen
    navigation.navigate('Login', { referralCode });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading referral...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Invalid Referral Link</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <Button
            title="Go to Login"
            onPress={() => navigation.navigate('Login')}
            variant="primary"
            fullWidth
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🎁</Text>
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            You've been invited!
          </Text>
          
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Someone has invited you to join using referral code:
          </Text>
          
          <View style={[styles.codeContainer, { backgroundColor: colors.receivedMessage, borderColor: colors.primary }]}>
            <Text style={[styles.codeText, { color: colors.primary }]}>
              {referralCode}
            </Text>
          </View>
          
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Continue to create your account and start using the app!
          </Text>
          
          <Button
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            fullWidth
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  codeContainer: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    marginBottom: SPACING.xl,
    minWidth: 200,
    alignItems: 'center',
  },
  codeText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 2,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  button: {
    marginTop: SPACING.md,
  },
});

export default ReferralScreen;

