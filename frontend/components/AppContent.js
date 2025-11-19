import React, { useState, useEffect, useRef } from 'react';
import { StatusBar, Platform } from 'expo-status-bar';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../contexts/ThemeContext';
import logger from '../utils/logger';
import { setGlobalLogoutHandler } from '../utils/apiHelper';
import { setupBrowserTitle } from '../utils/browserTitle';
import { toastConfig } from '../config/toast';
import { useAuth } from '../hooks/useAuth';
import { useBiometric } from '../hooks/useBiometric';
import { useDeepLink } from '../hooks/useDeepLink';
import AppNavigator from './AppNavigator';

/**
 * Main app content component that manages app state and lifecycle
 */
const AppContent = ({ navigationRef: externalNavRef }) => {
  const { isDark } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBiometricLock, setShowBiometricLock] = useState(false);
  const navigationRef = externalNavRef || useRef(null);
  const appState = useRef(AppState.currentState);

  // Initialize biometric hook
  const { checkBiometricLock, handleBiometricAuthenticated } = useBiometric(
    setShowBiometricLock
  );

  // Initialize auth hook
  const {
    isLoggedIn,
    userEmail,
    profile,
    setProfile,
    setIsLoggedIn,
    setUserEmail,
    checkAuthStatus,
    handleLogin,
    handleLogout,
    handleInvalidTokenLogout,
  } = useAuth(navigationRef, checkBiometricLock);

  // Setup deep link handling
  useDeepLink(navigationRef);

  // Setup browser title (web only)
  useEffect(() => {
    const cleanup = setupBrowserTitle();
    return cleanup;
  }, []);

  // Use ref to prevent double calls in React 18 dev mode
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      
      // Set global logout handler for invalid token
      setGlobalLogoutHandler(handleInvalidTokenLogout);
      
      // One-time migration: Clear old random salts to use new deterministic salts
      const migrateEncryptionSalts = async () => {
        try {
          const encryptionService = (await import('../services/encryptionService')).default;
          const migrationKey = 'encryption_salt_migration_v2';
          const hasMigrated = await AsyncStorage.getItem(migrationKey);
          
          if (!hasMigrated) {
            logger.log('🔄 Migrating encryption salts to deterministic version...');
            await encryptionService.clearAllSalts();
            await AsyncStorage.setItem(migrationKey, 'true');
            logger.log('✅ Encryption salt migration completed');
          }
        } catch (error) {
          logger.error('Error migrating encryption salts:', error);
        }
      };
      
      migrateEncryptionSalts();
      checkAuthStatus();
      
      // Setup app state listener for biometric lock
      const handleAppStateChange = async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active' &&
          isLoggedIn
        ) {
          // App came to foreground and user is logged in - check biometric lock
          const biometricService = (await import('../services/biometricService')).default;
          const isRequired = await biometricService.isAuthenticationRequired(0);
          
          if (isRequired) {
            setShowBiometricLock(true);
          }
        }
        appState.current = nextAppState;
      };

      const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
      
      return () => {
        appStateSubscription?.remove();
        // Clear global logout handler on unmount
        setGlobalLogoutHandler(null);
      };
    }
  }, [isLoggedIn, checkAuthStatus, handleInvalidTokenLogout]);

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutWithCleanup = async () => {
    await handleLogout();
    setShowLogoutModal(false);
    setShowBiometricLock(false);
  };

  return (
    <>
      <AppNavigator
        navigationRef={navigationRef}
        userEmail={userEmail}
        profile={profile}
        setProfile={setProfile}
        showLogoutModal={showLogoutModal}
        setShowLogoutModal={setShowLogoutModal}
        showBiometricLock={showBiometricLock}
        handleLogin={handleLogin}
        handleLogout={handleLogoutWithCleanup}
        handleLogoutPress={handleLogoutPress}
        handleBiometricAuthenticated={handleBiometricAuthenticated}
      />
      <StatusBar style={isDark ? "light" : "dark"} />
      <Toast 
        position="top"
        topOffset={60}
        config={toastConfig}
      />
    </>
  );
};

export default AppContent;

