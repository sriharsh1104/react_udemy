import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants';
import logger from './logger';
import { handleApiError } from './errorHandler';

// Global logout handler - will be set by App.js
let globalLogoutHandler = null;

export const setGlobalLogoutHandler = (handler) => {
  globalLogoutHandler = handler;
};

// Global loading handlers - will be set by LoadingProvider
let globalLoadingHandlers = null;

export const setGlobalLoadingHandlers = (handlers) => {
  globalLoadingHandlers = handlers;
};

/**
 * Handle invalid token - clear storage and trigger logout
 */
export const handleInvalidToken = async () => {
  logger.log('🔒 Invalid token detected - handling logout');
  
  // Clear local storage
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('userEmail');
  
  // Clear encryption keys
  try {
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
  
  // Call global logout handler if available
  if (globalLogoutHandler) {
    globalLogoutHandler();
  }
};

/**
 * Enhanced fetch wrapper that handles 401 (Unauthorized) responses
 * Automatically logs out user if token is invalid
 * Includes timeout and retry logic
 */
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;

const fetchWithTimeout = (url, options, timeout = DEFAULT_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
};

export const apiFetch = async (url, options = {}, retryCount = 0) => {
  // Show loader unless explicitly disabled
  const showLoader = options.showLoader !== false;
  const loadingMessage = options.loadingMessage || 'Loading...';
  
  try {
    // Show loading indicator
    if (showLoader && globalLoadingHandlers) {
      globalLoadingHandlers.showLoading(loadingMessage);
    }
    
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
    
    // Get timeout from options or use default
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    
    // Make the request with timeout
    const response = await fetchWithTimeout(url, {
      ...options,
      headers,
    }, timeout);
    
    // Handle all status codes properly
    // 401 Unauthorized - Session expired
    if (response.status === 401) {
      logger.log('🔒 401 Unauthorized - Token invalid or expired');
      
      // Clear local storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
      
      // Clear encryption keys
      try {
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
      
      // Call global logout handler if available
      if (globalLogoutHandler) {
        globalLogoutHandler();
      }
      
      // Hide loader before returning
      if (showLoader && globalLoadingHandlers) {
        globalLoadingHandlers.hideLoading();
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
    
    // Handle 5xx server errors (502 Bad Gateway, 503 Service Unavailable, etc.)
    if (response.status >= 500) {
      logger.error(`Server error ${response.status}:`, url);
      // Response will be returned normally, error handling will be done by caller
    }
    
    // Hide loader on successful response (even if status is error like 400, 500, etc.)
    if (showLoader && globalLoadingHandlers) {
      globalLoadingHandlers.hideLoading();
    }
    
    return response;
  } catch (error) {
    // Hide loader on error
    if (showLoader && globalLoadingHandlers) {
      globalLoadingHandlers.hideLoading();
    }
    
    // Retry logic for network errors (not 401)
    if (retryCount < MAX_RETRIES && (error.message.includes('timeout') || error.message.includes('Network'))) {
      logger.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES}):`, url);
      // Exponential backoff: wait 1s, 2s, 4s...
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      return apiFetch(url, options, retryCount + 1);
    }
    
    logger.error('API fetch error:', error);
    throw handleApiError(error);
  }
};

/**
 * Helper to check if response indicates invalid token
 */
export const isInvalidToken = (response) => {
  return response.status === 401;
};

