import { useEffect, useCallback } from 'react';
import * as Linking from 'expo-linking';
import logger from '../utils/logger';

/**
 * Hook for handling deep links
 */
export const useDeepLink = (navigationRef) => {
  const handleDeepLink = useCallback(({ url }) => {
    if (!url) return;
    
    try {
      logger.log('🔗 Deep link received:', url);
      
      // Parse URL - handle both expo-linking format and direct URLs
      let parsed;
      try {
        parsed = Linking.parse(url);
      } catch (e) {
        // Fallback: manual parsing for web URLs
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const codeMatch = pathname.match(/\/referral\/([^/?]+)/);
        if (codeMatch && codeMatch[1]) {
          const referralCode = codeMatch[1];
          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('Referral', { referralCode });
            }
          }, 500);
        }
        return;
      }
      
      const { path, queryParams, hostname } = parsed;
      logger.log('🔗 Parsed:', { path, queryParams, hostname });
      
      // Handle referral link: /referral/:code
      if (path === 'referral' && queryParams?.code) {
        const referralCode = queryParams.code;
        setTimeout(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('Referral', { referralCode });
          }
        }, 500);
      } else if (path?.includes('referral/')) {
        // Handle format: /referral/CODE
        const codeMatch = path.match(/referral\/([^/?]+)/);
        if (codeMatch && codeMatch[1]) {
          const referralCode = codeMatch[1];
          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('Referral', { referralCode });
            }
          }, 500);
        }
      } else if (path && path.startsWith('/referral/')) {
        // Handle format: /referral/CODE (when path starts with /)
        const codeMatch = path.match(/\/referral\/([^/?]+)/);
        if (codeMatch && codeMatch[1]) {
          const referralCode = codeMatch[1];
          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('Referral', { referralCode });
            }
          }, 500);
        }
      }
    } catch (error) {
      logger.error('Error handling deep link:', error);
    }
  }, [navigationRef]);

  const handleInitialURL = useCallback(async () => {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      }
    } catch (error) {
      logger.error('Error getting initial URL:', error);
    }
  }, [handleDeepLink]);

  useEffect(() => {
    handleInitialURL();
    
    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription?.remove();
    };
  }, [handleInitialURL, handleDeepLink]);

  return { handleDeepLink };
};

