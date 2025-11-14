import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

class CallService {
  async getCallHistory(params = {}) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          calls: [],
          message: 'No token found',
        };
      }

      const queryParams = new URLSearchParams();
      if (params.contactEmail) queryParams.append('contactEmail', params.contactEmail);
      if (params.groupId) queryParams.append('groupId', params.groupId);
      
      const response = await fetch(`${API_CONFIG.API_BASE}/calls/history?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch call history');
      }

      const data = await response.json();
      return data;
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

