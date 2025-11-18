import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../contexts/ThemeContext';
import biometricService from '../../services/biometricService';

const BiometricLockScreen = ({ onAuthenticated }) => {
  const { colors, isDark } = useTheme();
  const [biometricType, setBiometricType] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkBiometricAndAuthenticate();
  }, []);

  const checkBiometricAndAuthenticate = async () => {
    setIsAuthenticating(true);
    setError('');

    try {
      // Get biometric type for display
      const availability = await biometricService.isBiometricAvailable();
      if (availability.available && availability.types) {
        setBiometricType(biometricService.getBiometricTypeName(availability.types));
      }

      // Attempt authentication
      const result = await biometricService.authenticate('Authenticate to unlock the app');
      
      if (result.success) {
        // Authentication successful
        onAuthenticated();
      } else {
        // Authentication failed or cancelled
        setError(result.error || 'Authentication failed');
        setIsAuthenticating(false);
      }
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      setError('An error occurred during authentication');
      setIsAuthenticating(false);
    }
  };

  const handleRetry = () => {
    checkBiometricAndAuthenticate();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          {biometricType ? `${biometricType} Required` : 'App Locked'}
        </Text>
        
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {biometricType 
            ? `Please authenticate using ${biometricType} to unlock the app`
            : 'Please authenticate to unlock the app'}
        </Text>

        {isAuthenticating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Waiting for authentication...
            </Text>
          </View>
        ) : (
          <>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.error || '#FF3B30' }]}>
                  {error}
                </Text>
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <Text
                style={[styles.retryButton, { color: colors.primary }]}
                onPress={handleRetry}
              >
                Try Again
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 24,
  },
  lockIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 8,
  },
  retryButton: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
});

export default BiometricLockScreen;

