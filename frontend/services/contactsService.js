import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToastFromResponse } from '../utils/toast';

class ContactsService {
  async searchUsers(query) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/contacts/search?query=${encodeURIComponent(query)}&token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      // Don't show toast for search (silent operation)
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Search Failed',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error searching users:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async checkUserExists(email) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/contacts/check?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      // Don't show toast for checkUserExists (silent operation)
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Check Failed',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error checking user:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async getContacts() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/contacts?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      // Don't show toast for getContacts (silent operation)
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Load Contacts',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting contacts:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async addContact(contactEmail) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactEmail,
          token,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Contact Added',
        errorTitle: 'Failed to Add Contact',
      });
      return data;
    } catch (error) {
      console.error('Error adding contact:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async removeContact(contactEmail) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/contacts`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactEmail,
          token,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Contact Removed',
        errorTitle: 'Failed to Remove Contact',
      });
      return data;
    } catch (error) {
      console.error('Error removing contact:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async markMessagesAsRead(contactEmail) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/contacts/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactEmail,
          token,
        }),
      });

      const data = await response.json();
      // Don't show toast for markMessagesAsRead (silent operation)
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Mark as Read',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async checkPhoneRegistered(phone) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/contacts/check-phone?phone=${encodeURIComponent(phone)}&token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      // Don't show toast for checkPhoneRegistered (silent operation)
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Check Failed',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error checking phone:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async checkPhonesBatch(phones) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/contacts/check-phones-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phones,
          token,
        }),
      });

      const data = await response.json();
      // Don't show toast for checkPhonesBatch (silent operation)
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Check Failed',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error checking phones batch:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async getInviteLink() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/contacts/invite-link?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      // Don't show toast for getInviteLink (silent operation)
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Get Invite Link',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting invite link:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async toggleFavorite(contactEmail) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/contacts/toggle-favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactEmail,
          token,
        }),
      });

      const data = await response.json();
      // Don't show toast for toggleFavorite (silent operation)
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Update Favorite',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async deleteMessage(messageId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/contacts/delete-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          token,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Message Deleted',
        errorTitle: 'Failed to Delete Message',
      });
      return data;
    } catch (error) {
      console.error('Error deleting message:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async getMessageInfo(messageId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/contacts/message-info/${messageId}?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Load Message Info',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting message info:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }
}

export default new ContactsService();

