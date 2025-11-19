import { showToastFromResponse } from '../utils/toast';
import apiService from './apiService';

class ProfileService {
  async getProfile() {
    try {
      // Use apiService.get - loader will be shown automatically, auth guard is handled
      // Pass false to disable loader for silent operations
      const result = await apiService.get('/profile', {}, false);
      
      // Don't show toast for getProfile (silent operation)
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Load Profile',
          showSuccess: false,
        });
      }
      
      return result;
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
      console.log('🔗 Making POST request to: /profile');
      console.log('📤 Request payload:', JSON.stringify(profileData));
      
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/profile', profileData, {}, 'Updating Profile...');
      
      console.log('✅ Profile update response:', result);
      showToastFromResponse(result, { 
        successTitle: 'Profile Updated',
        errorTitle: 'Failed to Update Profile',
      });
      
      return result;
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
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/profile/contact', { email: contactEmail }, {}, false);
      
      // Don't show toast for getContactProfile (silent operation)
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Load Contact Profile',
          showSuccess: false,
        });
      }
      
      return result;
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

