import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToastFromResponse } from '../utils/toast';

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
      
      const response = await fetch(`${API_CONFIG.API_BASE}/profile?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
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
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profileData,
          token,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Profile Updated',
        errorTitle: 'Failed to Update Profile',
      });
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
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

