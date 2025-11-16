import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToastFromResponse } from '../utils/toast';
import { handleInvalidToken } from '../utils/apiHelper';

class ProfileService {
  async getProfile() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // Check for 401 Unauthorized (invalid token)
      if (response.status === 401) {
        await handleInvalidToken();
        return {
          success: false,
          message: 'Session expired. Please login again.',
        };
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return {
          success: true,
          profile: null,
        };
      }

      // Only parse JSON if response has content
      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Empty response or non-JSON
        return {
          success: true,
          profile: null,
        };
      }

      // Don't show toast for getProfile (silent operation)
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Load Profile',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async updateProfile(profileData) {
    try {
      console.log('📝 updateProfile called with data:', profileData);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('❌ No token found');
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      console.log('🔗 Making POST request to:', `${API_CONFIG.API_BASE}/profile`);
      console.log('📤 Request payload:', JSON.stringify(profileData));
      console.log('🔑 Token present:', !!token);
      
      const response = await fetch(`${API_CONFIG.API_BASE}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      
      // Check for 401 Unauthorized (invalid token)
      if (response.status === 401) {
        await handleInvalidToken();
        return {
          success: false,
          message: 'Session expired. Please login again.',
        };
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          showToastFromResponse(errorData, { 
            successTitle: 'Profile Updated',
            errorTitle: 'Failed to Update Profile',
          });
          return errorData;
        } catch (e) {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('✅ Profile update response:', data);
      showToastFromResponse(data, { 
        successTitle: 'Profile Updated',
        errorTitle: 'Failed to Update Profile',
      });
      return data;
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      const errorResponse = {
        success: false,
        message: error.message || 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async getContactProfile(contactEmail) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/profile/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: contactEmail }),
      });

      // Check for 401 Unauthorized (invalid token)
      if (response.status === 401) {
        await handleInvalidToken();
        return {
          success: false,
          message: 'Session expired. Please login again.',
        };
      }

      const data = await response.json();
      // Don't show toast for getContactProfile (silent operation)
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Load Contact Profile',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting contact profile:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }
}

export default new ProfileService();

