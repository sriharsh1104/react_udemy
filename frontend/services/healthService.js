import { showToastFromResponse } from '../utils/toast';
import apiService from './apiService';

class HealthService {
  async getHealthProfile() {
    try {
      const result = await apiService.get('/health/profile', {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Load Health Profile',
          showSuccess: false,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error getting health profile:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async updateHealthProfile(profileData) {
    try {
      const result = await apiService.put('/health/profile', profileData, {}, 'Updating Health Profile...');
      
      showToastFromResponse(result, { 
        successTitle: 'Health Profile Updated',
        errorTitle: 'Failed to Update Health Profile',
      });
      
      return result;
    } catch (error) {
      console.error('Error updating health profile:', error);
      const errorResponse = {
        success: false,
        message: error.message || 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async updateSteps(steps) {
    try {
      const result = await apiService.post('/health/steps', { steps }, {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Update Steps',
          showSuccess: false,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating steps:', error);
      const errorResponse = {
        success: false,
        message: error.message || 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }
}

export default new HealthService();
