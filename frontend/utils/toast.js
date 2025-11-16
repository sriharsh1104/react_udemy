import Toast from 'react-native-toast-message';

/**
 * Show toast message based on API response
 * @param {Object} response - API response object with success and message fields
 * @param {Object} options - Optional configuration
 * @param {string} options.successTitle - Custom title for success toast
 * @param {string} options.errorTitle - Custom title for error toast
 * @param {boolean} options.showSuccess - Whether to show success toast (default: true)
 * @param {boolean} options.showError - Whether to show error toast (default: true)
 */
export const showToastFromResponse = (response, options = {}) => {
  const {
    successTitle = 'Success',
    errorTitle = 'Error',
    showSuccess = true,
    showError = true,
  } = options;

  if (!response) return;

  if (response.success && showSuccess) {
    // CRITICAL: Ensure text2 is always a string, not an object
    const messageText = typeof response.message === 'string' 
      ? response.message 
      : (response.message?.message || response.message?.text || String(response.message || 'Operation completed successfully'));
    
    Toast.show({
      type: 'success',
      text1: successTitle,
      text2: messageText,
      position: 'top',
    });
  } else if (!response.success && showError) {
    // CRITICAL: Ensure text2 is always a string, not an object
    const messageText = typeof response.message === 'string' 
      ? response.message 
      : (response.message?.message || response.message?.text || String(response.message || 'An error occurred'));
    
    Toast.show({
      type: 'error',
      text1: errorTitle,
      text2: messageText,
      position: 'top',
    });
  }
};

/**
 * Show success toast
 */
export const showSuccessToast = (title, message) => {
  Toast.show({
    type: 'success',
    text1: title || 'Success',
    text2: message || 'Operation completed successfully',
    position: 'top',
  });
};

/**
 * Show error toast
 */
export const showErrorToast = (title, message) => {
  Toast.show({
    type: 'error',
    text1: title || 'Error',
    text2: message || 'An error occurred',
    position: 'top',
  });
};

/**
 * Show info toast
 */
export const showInfoToast = (title, message) => {
  Toast.show({
    type: 'info',
    text1: title || 'Info',
    text2: message || '',
    position: 'top',
  });
};

