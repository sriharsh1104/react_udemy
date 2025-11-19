import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import logger from '../utils/logger';
import authService from '../services/authService';
import { setGlobalLogoutHandler } from '../utils/apiHelper';

/**
 * Hook for managing authentication state and operations
 */
export const useAuth = (navigationRef, checkBiometricLock) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [profile, setProfile] = useState(null);

  const handleInvalidTokenLogout = useCallback(async () => {
    logger.log('🔒 Invalid token detected - logging out automatically');
    try {
      // Clear encryption keys
      const encryptionService = (await import('../services/encryptionService')).default;
      await encryptionService.clearAllKeys();
    } catch (error) {
      logger.error('Error clearing encryption keys:', error);
    }
    
    // Clear chat storage
    try {
      const chatStorageService = (await import('../services/chatStorageService')).default;
      await chatStorageService.clearAllChats();
    } catch (error) {
      logger.error('Error clearing chat storage:', error);
    }
    
    // Clear local storage
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userEmail');
    
    // Clear biometric authentication state
    const biometricService = (await import('../services/biometricService')).default;
    await biometricService.clearAuthenticationState();
    
    // Update state
    setIsLoggedIn(false);
    setUserEmail(null);
    setProfile(null);
    
    // Navigate to login
    if (navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
    
    // Show toast notification
    Toast.show({
      type: 'error',
      text1: 'Session Expired',
      text2: 'Your session has expired. Please login again.',
      position: 'top',
      topOffset: 60,
    });
  }, [navigationRef]);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const email = await AsyncStorage.getItem('userEmail');
      
      if (token && email) {
        setUserEmail(email);
        setIsLoggedIn(true);
        
        // Check if biometric lock is enabled and required
        const biometricPassed = await checkBiometricLock();
        if (!biometricPassed) {
          // Biometric lock screen will be shown
          return;
        }
        
        // Navigate to Chat - profile will be loaded when needed
        // Use requestAnimationFrame for smoother transition (prevents flicker)
        requestAnimationFrame(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('Chat');
          }
        });
      }
    } catch (error) {
      logger.error('Error checking auth status:', error);
    }
  }, [navigationRef, checkBiometricLock]);

  const handleLogin = useCallback(async (email, token, loginProfile, isProfileComplete) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    
    // Set profile with isProfileComplete flag
    const profileWithComplete = loginProfile 
      ? { ...loginProfile, isProfileComplete: isProfileComplete ?? loginProfile.isProfileComplete }
      : null;
    setProfile(profileWithComplete);
    
    // Check biometric lock after login
    const biometricPassed = await checkBiometricLock();
    if (!biometricPassed) {
      // Biometric lock screen will be shown
      return;
    }
    
    // Navigate based on profile completeness - ONLY navigate to Profile if incomplete
    setTimeout(() => {
      if (navigationRef.current) {
        // If profile is complete (true), go directly to Chat
        // If profile is incomplete (false/null), go to Profile
        if (isProfileComplete === true || (profileWithComplete && profileWithComplete.isProfileComplete === true)) {
          navigationRef.current.navigate('Chat');
        } else {
          navigationRef.current.navigate('Profile');
        }
      }
    }, 100);
  }, [navigationRef, checkBiometricLock]);

  const handleLogout = useCallback(async () => {
    try {
      // Get token before clearing
      const token = await AsyncStorage.getItem('authToken');
      
      // Call logout API
      if (token) {
        await authService.logout(token);
      }
      
      // Clear encryption keys
      const encryptionService = (await import('../services/encryptionService')).default;
      await encryptionService.clearAllKeys();
      
      // Clear chat storage
      const chatStorageService = (await import('../services/chatStorageService')).default;
      await chatStorageService.clearAllChats();
      
      // Clear local storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
      
      // Clear biometric authentication state
      const biometricService = (await import('../services/biometricService')).default;
      await biometricService.clearAuthenticationState();
      
      setIsLoggedIn(false);
      setUserEmail(null);
      setProfile(null);
      
      // Navigate to login
      if (navigationRef.current) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      logger.error('Error logging out:', error);
      // Even if API fails, clear local storage and logout
      try {
        const encryptionService = (await import('../services/encryptionService')).default;
        await encryptionService.clearAllKeys();
      } catch (e) {
        logger.error('Error clearing encryption keys:', e);
      }
      try {
        const chatStorageService = (await import('../services/chatStorageService')).default;
        await chatStorageService.clearAllChats();
      } catch (e) {
        logger.error('Error clearing chat storage:', e);
      }
      try {
        const biometricService = (await import('../services/biometricService')).default;
        await biometricService.clearAuthenticationState();
      } catch (e) {
        logger.error('Error clearing biometric state:', e);
      }
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
      setIsLoggedIn(false);
      setUserEmail(null);
      setProfile(null);
      if (navigationRef.current) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }
  }, [navigationRef]);

  return {
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
  };
};

