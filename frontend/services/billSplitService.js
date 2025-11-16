import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToastFromResponse } from '../utils/toast';

class BillSplitService {
  async createBillSplit(billData) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/bills/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(billData),
      });

      const data = await response.json();
      showToastFromResponse(data, {
        successTitle: 'Bill Created',
        errorTitle: 'Failed to Create Bill',
      });
      return data;
    } catch (error) {
      console.error('Error creating bill split:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async getBillSplits(roomId, groupId = null) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const params = new URLSearchParams({ roomId });
      if (groupId) {
        params.append('groupId', groupId);
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/bills?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting bill splits:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  async markAsPaid(billSplitId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/bills/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ billSplitId }),
      });

      const data = await response.json();
      showToastFromResponse(data, {
        successTitle: 'Marked as Paid',
        errorTitle: 'Failed to Mark as Paid',
      });
      return data;
    } catch (error) {
      console.error('Error marking as paid:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async sendReminder(roomId, contactEmail, groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/bills/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId, contactEmail, groupId }),
      });

      const data = await response.json();
      showToastFromResponse(data, {
        successTitle: 'Reminder Sent',
        errorTitle: 'Failed to Send Reminder',
      });
      return data;
    } catch (error) {
      console.error('Error sending reminder:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }
}

export default new BillSplitService();

