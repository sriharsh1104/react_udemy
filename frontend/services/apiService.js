import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleInvalidToken } from '../utils/apiHelper';
import logger from '../utils/logger';

// Global loader handlers - will be set by LoaderContext
let globalShowLoader = null;
let globalHideLoader = null;

/**
 * Set global loader handlers
 */
export const setGlobalLoaderHandlers = (showLoader, hideLoader) => {
  globalShowLoader = showLoader;
  globalHideLoader = hideLoader;
};

/**
 * Default timeout for API requests
 */
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Fetch with timeout wrapper
 */
const fetchWithTimeout = (url, options, timeout = DEFAULT_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
};

/**
 * Parse response based on content type
 */
const parseResponse = async (response) => {
  // Handle 204 No Content - return null
  if (response.status === 204) {
    return null;
  }
  
  // Check if response has content
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') {
    return null;
  }
  
  const contentType = response.headers.get('content-type');
  
  // Handle JSON response
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      logger.error('Error parsing JSON response:', error);
      return null;
    }
  }
  
  // Handle text response
  if (contentType && contentType.includes('text/')) {
    try {
      return await response.text();
    } catch (error) {
      logger.error('Error parsing text response:', error);
      return null;
    }
  }
  
  // Handle blob response (for file downloads)
  if (contentType && (contentType.includes('image/') || contentType.includes('video/') || contentType.includes('audio/') || contentType.includes('application/pdf'))) {
    try {
      return await response.blob();
    } catch (error) {
      logger.error('Error parsing blob response:', error);
      return null;
    }
  }
  
  // Default: try to parse as JSON, fallback to text
  try {
    return await response.json();
  } catch {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
};

/**
 * Handle API response and check for auth errors
 */
const handleResponse = async (response, options = {}) => {
  // Check for 401 Unauthorized (invalid token)
  if (response.status === 401) {
    logger.log('🔒 401 Unauthorized - Token invalid or expired');
    await handleInvalidToken();
    return {
      success: false,
      message: 'Session expired. Please login again.',
      status: 401,
    };
  }

  // Parse response
  const data = await parseResponse(response);

  // If response is not ok, return error
  if (!response.ok) {
    // If data already has success field, return it as is
    if (data && typeof data === 'object' && 'success' in data) {
      return data;
    }
    return {
      success: false,
      message: data?.message || `HTTP ${response.status}: ${response.statusText}`,
      status: response.status,
      ...(data && typeof data === 'object' ? data : { data }),
    };
  }

  // If data already has success field, return it as is (for consistent API responses)
  if (data && typeof data === 'object' && 'success' in data) {
    return data;
  }

  // Return success response with data
  return {
    success: true,
    ...(data && typeof data === 'object' ? data : { data }),
    status: response.status,
  };
};

/**
 * Base API request method
 */
const apiRequest = async (url, options = {}, loaderMessage = null) => {
  try {
    // Show loader if handler is available
    if (globalShowLoader && loaderMessage !== false) {
      globalShowLoader(loaderMessage || 'Loading...');
    }

    // Get token from AsyncStorage
    const token = await AsyncStorage.getItem('authToken');
    
    // Prepare headers
    const headers = {
      ...options.headers,
    };

    // Add Content-Type if not set and body exists
    if (options.body && !headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Add Authorization header if token exists
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

    // Handle response
    const result = await handleResponse(response, options);

    return result;
  } catch (error) {
    logger.error('API request error:', error);
    
    // Handle network errors
    if (error.message.includes('timeout') || error.message.includes('Network')) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        error: error.message,
      };
    }

    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      error: error.message,
    };
  } finally {
    // Hide loader if handler is available
    if (globalHideLoader && loaderMessage !== false) {
      globalHideLoader();
    }
  }
};

/**
 * API Service Class
 */
class ApiService {
  /**
   * GET request
   */
  async get(endpoint, options = {}, loaderMessage = null) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.API_BASE}${endpoint}`;
    return apiRequest(url, {
      method: 'GET',
      ...options,
    }, loaderMessage);
  }

  /**
   * POST request
   */
  async post(endpoint, data = null, options = {}, loaderMessage = null) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.API_BASE}${endpoint}`;
    
    let body = null;
    if (data) {
      if (data instanceof FormData) {
        body = data;
      } else {
        body = JSON.stringify(data);
      }
    }

    return apiRequest(url, {
      method: 'POST',
      body,
      ...options,
    }, loaderMessage);
  }

  /**
   * PUT request
   */
  async put(endpoint, data = null, options = {}, loaderMessage = null) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.API_BASE}${endpoint}`;
    
    let body = null;
    if (data) {
      if (data instanceof FormData) {
        body = data;
      } else {
        body = JSON.stringify(data);
      }
    }

    return apiRequest(url, {
      method: 'PUT',
      body,
      ...options,
    }, loaderMessage);
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = null, options = {}, loaderMessage = null) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.API_BASE}${endpoint}`;
    
    let body = null;
    if (data) {
      if (data instanceof FormData) {
        body = data;
      } else {
        body = JSON.stringify(data);
      }
    }

    return apiRequest(url, {
      method: 'PATCH',
      body,
      ...options,
    }, loaderMessage);
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}, loaderMessage = null) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.API_BASE}${endpoint}`;
    return apiRequest(url, {
      method: 'DELETE',
      ...options,
    }, loaderMessage);
  }

  /**
   * Upload file (multipart/form-data)
   */
  async uploadFile(endpoint, formData, options = {}, loaderMessage = 'Uploading...') {
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.API_BASE}${endpoint}`;
    
    // Don't set Content-Type header for FormData - browser will set it with boundary
    const headers = {
      ...options.headers,
    };
    delete headers['Content-Type'];

    return apiRequest(url, {
      method: 'POST',
      body: formData,
      headers,
      ...options,
    }, loaderMessage);
  }

  /**
   * Download file
   */
  async downloadFile(endpoint, options = {}, loaderMessage = 'Downloading...') {
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.API_BASE}${endpoint}`;
    return apiRequest(url, {
      method: 'GET',
      ...options,
    }, loaderMessage);
  }
}

export default new ApiService();

