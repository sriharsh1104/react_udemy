import { showToastFromResponse } from '../utils/toast';
import apiService from './apiService';

class SettingsService {
  async setPassword(password) {
    try {
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/settings/set-password', { password }, {}, 'Setting Password...');
      
      showToastFromResponse(result, {
        successTitle: 'Password Set',
        errorTitle: 'Failed to Set Password',
      });
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/settings/change-password', { currentPassword, newPassword }, {}, 'Changing Password...');
      
      showToastFromResponse(result, {
        successTitle: 'Password Changed',
        errorTitle: 'Failed to Change Password',
      });
      return result;
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
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get('/settings/password-status', {}, false);
      
      // Don't show toast for checkPasswordStatus (silent operation)
      if (!result.success) {
        showToastFromResponse(result, {
          errorTitle: 'Failed to Check Password Status',
          showSuccess: false,
        });
      }
      return result;
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

  async getOfflineMode() {
    try {
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get('/settings/offline-mode', {}, false);
      return result;
    } catch (error) {
      console.error('Error getting offline mode:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        offlineMode: false,
      };
    }
  }

  async toggleOfflineMode(offlineMode) {
    try {
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/settings/offline-mode', { offlineMode }, {}, 'Updating Offline Mode...');
      
      showToastFromResponse(result, {
        successTitle: 'Offline Mode Updated',
        errorTitle: 'Failed to Update Offline Mode',
      });
      return result;
    } catch (error) {
      console.error('Error toggling offline mode:', error);
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
