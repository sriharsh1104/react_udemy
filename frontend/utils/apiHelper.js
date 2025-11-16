import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants';

// Global logout handler - will be set by App.js
let globalLogoutHandler = null;

export const setGlobalLogoutHandler = (handler) => {
  globalLogoutHandler = handler;
};

/**
 * Handle invalid token - clear storage and trigger logout
 */
export const handleInvalidToken = async () => {
  console.log('🔒 Invalid token detected - handling logout');
  
  // Clear local storage
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('userEmail');
  
  // Clear encryption keys
  try {
    const encryptionService = (await import('../services/encryptionService')).default;
    await encryptionService.clearAllKeys();
  } catch (error) {
    console.error('Error clearing encryption keys:', error);
  }
  
  // Call global logout handler if available
  if (globalLogoutHandler) {
    globalLogoutHandler();
  }
};

/**
 * Enhanced fetch wrapper that handles 401 (Unauthorized) responses
 * Automatically logs out user if token is invalid
 */
export const apiFetch = async (url, options = {}) => {
  try {
    // Get token from AsyncStorage
    const token = await AsyncStorage.getItem('authToken');
    
    // Add Authorization header if token exists
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Check for 401 Unauthorized
    if (response.status === 401) {
      console.log('🔒 401 Unauthorized - Token invalid or expired');
      
      // Clear local storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
      
      // Clear encryption keys
      try {
        const encryptionService = (await import('../services/encryptionService')).default;
        await encryptionService.clearAllKeys();
      } catch (error) {
        console.error('Error clearing encryption keys:', error);
      }
      
      // Call global logout handler if available
      if (globalLogoutHandler) {
        globalLogoutHandler();
      }
      
      // Return error response
      return {
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          message: 'Session expired. Please login again.',
        }),
      };
    }
    
    return response;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
};

/**
 * Helper to check if response indicates invalid token
 */
export const isInvalidToken = (response) => {
  return response.status === 401;
};

