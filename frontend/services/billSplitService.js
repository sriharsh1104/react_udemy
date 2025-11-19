import { showToastFromResponse } from '../utils/toast';
import apiService from './apiService';

class BillSplitService {
  async createBillSplit(billData) {
    try {
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/bills/create', billData, {}, 'Creating Bill...');
      
      showToastFromResponse(result, {
        successTitle: 'Bill Created',
        errorTitle: 'Failed to Create Bill',
      });
      return result;
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
      const params = new URLSearchParams({ roomId });
      if (groupId) {
        params.append('groupId', groupId);
      }
      
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get(`/bills?${params.toString()}`, {}, false);
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/bills/mark-paid', { billSplitId }, {}, 'Marking as Paid...');
      
      showToastFromResponse(result, {
        successTitle: 'Marked as Paid',
        errorTitle: 'Failed to Mark as Paid',
      });
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/bills/send-reminder', { roomId, contactEmail, groupId }, {}, 'Sending Reminder...');
      
      showToastFromResponse(result, {
        successTitle: 'Reminder Sent',
        errorTitle: 'Failed to Send Reminder',
      });
      return result;
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
