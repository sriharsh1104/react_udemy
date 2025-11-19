import { useCallback } from 'react';
import logger from '../utils/logger';

/**
 * Hook for managing biometric authentication lock
 */
export const useBiometric = (setShowBiometricLock) => {
  const checkBiometricLock = useCallback(async () => {
    try {
      const biometricService = (await import('../services/biometricService')).default;
      const isRequired = await biometricService.isAuthenticationRequired(0);
      
      if (isRequired) {
        setShowBiometricLock(true);
        return false; // Authentication required
      }
      return true; // No authentication required
    } catch (error) {
      logger.error('Error checking biometric lock:', error);
      return true; // On error, allow access
    }
  }, [setShowBiometricLock]);

  const handleBiometricAuthenticated = useCallback(() => {
    setShowBiometricLock(false);
  }, [setShowBiometricLock]);

  return {
    checkBiometricLock,
    handleBiometricAuthenticated,
  };
};

