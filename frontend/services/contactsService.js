import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      return data;
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
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
      return data;
    } catch (error) {
      console.error('Error checking user:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
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
      return data;
    } catch (error) {
      console.error('Error getting contacts:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
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
      return data;
    } catch (error) {
      console.error('Error adding contact:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
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
      return data;
    } catch (error) {
      console.error('Error removing contact:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
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
      return data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
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
      return data;
    } catch (error) {
      console.error('Error checking phone:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
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
      return data;
    } catch (error) {
      console.error('Error checking phones batch:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
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
      return data;
    } catch (error) {
      console.error('Error getting invite link:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }
}

export default new ContactsService();

