/**
 * Centralized error handling utility
 */

import logger from './logger';
import { showErrorToast } from './toast';

/**
 * Handle API errors
 */
export const handleApiError = (error, customMessage = null) => {
  logger.error('API Error:', error);
  
  let message = customMessage || 'An error occurred';
  
  if (error?.response?.status === 401) {
    message = 'Session expired. Please login again.';
  } else if (error?.response?.status === 403) {
    message = 'Access denied. You don\'t have permission.';
  } else if (error?.response?.status === 404) {
    message = 'Resource not found.';
  } else if (error?.response?.status >= 500) {
    message = 'Server error. Please try again later.';
  } else if (error?.message) {
    // Network errors
    if (error.message.includes('Network')) {
      message = 'Network error. Please check your connection.';
    } else if (error.message.includes('timeout')) {
      message = 'Request timeout. Please try again.';
    } else {
      message = error.message;
    }
  }
  
  return {
    success: false,
    message,
    error: error?.response?.data || error,
  };
};

/**
 * Handle encryption/decryption errors
 */
export const handleEncryptionError = (error) => {
  logger.error('Encryption Error:', error);
  return {
    success: false,
    message: 'Failed to process message. Please try again.',
    error,
  };
};

/**
 * Handle validation errors
 */
export const handleValidationError = (field, message) => {
  return {
    success: false,
    message: message || `Invalid ${field}`,
    field,
  };
};

/**
 * Show error toast from error object
 */
export const showError = (error, customTitle = 'Error') => {
  const errorMessage = error?.message || error?.error?.message || 'An error occurred';
  showErrorToast(customTitle, errorMessage);
};

/**
 * Handle and log error silently (for non-critical errors)
 */
export const handleSilentError = (error, context = '') => {
  logger.error(`Silent Error${context ? ` in ${context}` : ''}:`, error);
  // Don't show toast for silent errors
};

