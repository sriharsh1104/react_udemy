import { showToastFromResponse } from '../utils/toast';
import apiService from './apiService';

class StreakService {
  /**
   * Get all active streaks for the current user
   */
  async getMyStreaks() {
    try {
      const result = await apiService.get('/streaks', {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Load Streaks',
          showSuccess: false,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error getting streaks:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  /**
   * Get streak between current user and a specific contact
   * @param {string} contactEmail - The contact's email
   */
  async getStreakWithContact(contactEmail) {
    try {
      const result = await apiService.get('/streaks/with-contact', { contactEmail }, false);
      
      if (!result.success) {
        // Don't show toast for this - it's a silent operation
        // Many contacts won't have streaks, so errors are expected
      }
      
      return result;
    } catch (error) {
      console.error('Error getting streak with contact:', error);
      return {
        success: false,
        streak: null,
      };
    }
  }

  /**
   * Manually reset a streak (optional feature)
   * @param {string} contactEmail - The contact's email
   */
  async resetStreak(contactEmail) {
    try {
      const result = await apiService.post('/streaks/reset', { contactEmail }, {}, 'Resetting Streak...');
      
      showToastFromResponse(result, { 
        successTitle: 'Streak Reset',
        errorTitle: 'Failed to Reset Streak',
      });
      
      return result;
    } catch (error) {
      console.error('Error resetting streak:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }
}

export default new StreakService();

