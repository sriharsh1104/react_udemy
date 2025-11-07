import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
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
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }
}

export default new ProfileService();

