import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import logger from '../utils/logger';

/**
 * Hook to handle deep links and URL routing
 */
export const useDeepLink = (navigationRef) => {
  const handleDeepLink = ({ url }) => {
    if (!url || !navigationRef.current) return;
    
    try {
      logger.log('🔗 Deep link received:', url);
      
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
      
      const { path, queryParams } = parsed;
      logger.log('🔗 Parsed:', { path, queryParams });
      
      // Handle referral link: /referral/:code
      if (path === 'referral' && queryParams?.code) {
        const referralCode = queryParams.code;
        setTimeout(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('Referral', { referralCode });
          }
        }, 500);
      } else if (path?.includes('referral/')) {
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
  };

  useEffect(() => {
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          handleDeepLink({ url: initialUrl });
        }
      } catch (error) {
        logger.error('Error getting initial URL:', error);
      }
    };
    
    handleInitialURL();
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription?.remove();
    };
  }, []);
};

