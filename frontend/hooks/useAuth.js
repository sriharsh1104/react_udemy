import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import profileService from '../services/profileService';
import logger from '../utils/logger';
import Toast from 'react-native-toast-message';

/**
 * Hook to manage authentication state and operations
 */
export const useAuth = (navigationRef) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [profile, setProfile] = useState(null);

  const handleInvalidTokenLogout = useCallback(async () => {
    logger.log('🔒 Invalid token detected - logging out automatically');
    try {
      const encryptionService = (await import('../services/encryptionService')).default;
      await encryptionService.clearAllKeys();
    } catch (error) {
      logger.error('Error clearing encryption keys:', error);
    }
    
    try {
      const chatStorageService = (await import('../services/chatStorageService')).default;
      await chatStorageService.clearAllChats();
    } catch (error) {
      logger.error('Error clearing chat storage:', error);
    }
    
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userEmail');
    
    try {
      const biometricService = (await import('../services/biometricService')).default;
      await biometricService.clearAuthenticationState();
    } catch (error) {
      logger.error('Error clearing biometric state:', error);
    }
    
    setIsLoggedIn(false);
    setUserEmail(null);
    setProfile(null);
    
    if (navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
    
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
        
        if (navigationRef.current) {
          requestAnimationFrame(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('Chat');
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error checking auth status:', error);
    }
  }, [navigationRef]);

  const handleLogin = useCallback(async (email, token, loginProfile, isProfileComplete) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    
    const profileWithComplete = loginProfile 
      ? { ...loginProfile, isProfileComplete: isProfileComplete ?? loginProfile.isProfileComplete }
      : null;
    setProfile(profileWithComplete);
    
    setTimeout(() => {
      if (navigationRef.current) {
        if (isProfileComplete === true || (profileWithComplete && profileWithComplete.isProfileComplete === true)) {
          navigationRef.current.navigate('Chat');
        } else {
          navigationRef.current.navigate('Profile');
        }
      }
    }, 100);
  }, [navigationRef]);

  const handleLogout = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (token) {
        await authService.logout(token);
      }
      
      const encryptionService = (await import('../services/encryptionService')).default;
      await encryptionService.clearAllKeys();
      
      const chatStorageService = (await import('../services/chatStorageService')).default;
      await chatStorageService.clearAllChats();
      
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
      
      const biometricService = (await import('../services/biometricService')).default;
      await biometricService.clearAuthenticationState();
      
      setIsLoggedIn(false);
      setUserEmail(null);
      setProfile(null);
      
      if (navigationRef.current) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      logger.error('Error logging out:', error);
      // Fallback: clear local storage even if API fails
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

  const refreshProfile = useCallback(async () => {
    const profileResult = await profileService.getProfile();
    if (profileResult.success) {
      setProfile(profileResult.profile);
      return profileResult.profile;
    }
    return null;
  }, []);

  return {
    isLoggedIn,
    userEmail,
    profile,
    setProfile,
    setIsLoggedIn,
    setUserEmail,
    handleInvalidTokenLogout,
    checkAuthStatus,
    handleLogin,
    handleLogout,
    refreshProfile,
  };
};

