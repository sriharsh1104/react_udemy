import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'biometricLockEnabled';
const BIOMETRIC_LAST_AUTH_KEY = 'biometricLastAuth';

class BiometricService {
  /**
   * Check if biometric authentication is available on the device
   */
  async isBiometricAvailable() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return {
          available: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return {
          available: false,
          error: 'No biometric credentials enrolled. Please set up fingerprint/face ID in device settings.',
        };
      }

      return {
        available: true,
        types: await LocalAuthentication.supportedAuthenticationTypesAsync(),
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return {
        available: false,
        error: 'Error checking biometric availability',
      };
    }
  }

  /**
   * Get biometric type name for display
   */
  getBiometricTypeName(types) {
    if (!types || types.length === 0) {
      return 'Biometric';
    }

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }

    return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  }

  /**
   * Check if biometric lock is enabled
   */
  async isBiometricLockEnabled() {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric lock status:', error);
      return false;
    }
  }

  /**
   * Enable biometric lock
   */
  async enableBiometricLock() {
    try {
      // First check if biometric is available
      const availability = await this.isBiometricAvailable();
      if (!availability.available) {
        return {
          success: false,
          message: availability.error || 'Biometric authentication is not available',
        };
      }

      // Try to authenticate to save the biometric
      const result = await this.authenticate('Enable biometric lock');
      if (!result.success) {
        return result;
      }

      // Save the preference
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      await this.updateLastAuthTime();

      return {
        success: true,
        message: 'Biometric lock enabled successfully',
        biometricType: this.getBiometricTypeName(availability.types),
      };
    } catch (error) {
      console.error('Error enabling biometric lock:', error);
      return {
        success: false,
        message: 'Failed to enable biometric lock',
      };
    }
  }

  /**
   * Disable biometric lock
   */
  async disableBiometricLock() {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_LAST_AUTH_KEY);
      return {
        success: true,
        message: 'Biometric lock disabled successfully',
      };
    } catch (error) {
      console.error('Error disabling biometric lock:', error);
      return {
        success: false,
        message: 'Failed to disable biometric lock',
      };
    }
  }

  /**
   * Authenticate using biometric
   */
  async authenticate(reason = 'Authenticate to access the app') {
    try {
      const availability = await this.isBiometricAvailable();
      if (!availability.available) {
        return {
          success: false,
          error: availability.error || 'Biometric authentication is not available',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        await this.updateLastAuthTime();
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          error: result.error === 'user_cancel' 
            ? 'Authentication cancelled' 
            : 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: 'Authentication error occurred',
      };
    }
  }

  /**
   * Update last authentication time
   */
  async updateLastAuthTime() {
    try {
      await AsyncStorage.setItem(BIOMETRIC_LAST_AUTH_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error updating last auth time:', error);
    }
  }

  /**
   * Check if authentication is required (if enabled and not recently authenticated)
   * @param {number} gracePeriodMs - Time in milliseconds before requiring re-authentication (default: 0 = always require)
   */
  async isAuthenticationRequired(gracePeriodMs = 0) {
    try {
      const enabled = await this.isBiometricLockEnabled();
      if (!enabled) {
        return false;
      }

      // If grace period is 0, always require authentication
      if (gracePeriodMs === 0) {
        return true;
      }

      // Check if recently authenticated
      const lastAuthTime = await AsyncStorage.getItem(BIOMETRIC_LAST_AUTH_KEY);
      if (!lastAuthTime) {
        return true;
      }

      const timeSinceLastAuth = Date.now() - parseInt(lastAuthTime, 10);
      return timeSinceLastAuth > gracePeriodMs;
    } catch (error) {
      console.error('Error checking authentication requirement:', error);
      return true; // Default to requiring authentication on error
    }
  }

  /**
   * Clear authentication state (useful on logout)
   */
  async clearAuthenticationState() {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_LAST_AUTH_KEY);
    } catch (error) {
      console.error('Error clearing authentication state:', error);
    }
  }
}

export default new BiometricService();

