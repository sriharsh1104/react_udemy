import apiService from './apiService';

class CallService {
  async getCallHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.contactEmail) queryParams.append('contactEmail', params.contactEmail);
      if (params.groupId) queryParams.append('groupId', params.groupId);
      
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get(`/calls/history?${queryParams}`, {}, false);
      
      return result;
    } catch (error) {
      console.error('Error fetching call history:', error);
      return {
        success: false,
        calls: [],
        message: error.message || 'Failed to fetch call history',
      };
    }
  }
}

export default new CallService();
