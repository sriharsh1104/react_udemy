import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/common/Button';
import authService from '../../services/authService';
import { showToastFromResponse } from '../../utils/toast';
import styles from './styles';

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

export default ReferralScreen;

