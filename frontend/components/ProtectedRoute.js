import React, { useEffect, useState } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

/**
 * Protected Route Component - Auth Guard
 * Redirects to Login if user is not authenticated
 * Checks both isLoggedIn state and token in storage for reliability
 * 
 * @param {React.Component} children - Component to render if authenticated
 * @param {boolean} isLoggedIn - Authentication state from useAuth hook
 * @param {object} navigationRef - Navigation ref for programmatic navigation
 */
const ProtectedRoute = ({ children, isLoggedIn, navigationRef }) => {
  const navigation = useNavigation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthAndRedirect = async () => {
    try {
      // Check token in storage (source of truth)
      const token = await AsyncStorage.getItem('authToken');
      const email = await AsyncStorage.getItem('userEmail');
      
      // If no token or email, or isLoggedIn is false, redirect to login
      if (!token || !email || !isLoggedIn) {
        logger.log('🔒 Auth check failed - redirecting to Login');
        setIsAuthenticated(false);
        
        // Reset navigation stack to Login
        if (navigationRef?.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } else {
          // Fallback to navigation prop if ref not available
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
        return;
      }
      
      // User is authenticated
      setIsAuthenticated(true);
    } catch (error) {
      logger.error('Error checking auth in ProtectedRoute:', error);
      setIsAuthenticated(false);
      // On error, redirect to login for safety
      if (navigationRef?.current) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }
  };

  // Check auth on mount and when isLoggedIn changes
  useEffect(() => {
    checkAuthAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Check auth when screen is focused (handles token expiration during app usage)
  useFocusEffect(
    React.useCallback(() => {
      checkAuthAndRedirect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn])
  );

  // If not authenticated, don't render children (will redirect)
  if (!isAuthenticated || !isLoggedIn) {
    return null;
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;

