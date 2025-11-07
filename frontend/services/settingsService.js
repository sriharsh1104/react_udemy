import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToastFromResponse } from '../utils/toast';

class SettingsService {
  async setPassword(password) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/settings/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          token,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, {
        successTitle: 'Password Set',
        errorTitle: 'Failed to Set Password',
      });
      return data;
    } catch (error) {
      console.error('Error setting password:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/settings/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          token,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, {
        successTitle: 'Password Changed',
        errorTitle: 'Failed to Change Password',
      });
      return data;
    } catch (error) {
      console.error('Error changing password:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async checkPasswordStatus() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/settings/password-status?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      // Don't show toast for checkPasswordStatus (silent operation)
      if (!data.success) {
        showToastFromResponse(data, {
          errorTitle: 'Failed to Check Password Status',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error checking password status:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }
}

export default new SettingsService();

