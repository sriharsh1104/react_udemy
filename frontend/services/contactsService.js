import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToastFromResponse } from '../utils/toast';
import { handleInvalidToken, apiFetch } from '../utils/apiHelper';

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
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        showLoader: false, // Don't show loader for search (usually fast)
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
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/check`, {
        method: 'POST',
        body: JSON.stringify({ email }),
        showLoader: false, // Don't show loader for quick checks
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
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts`, {
        method: 'GET',
        loadingMessage: 'Loading contacts...',
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

  async getRecentChats() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/recent-chats`, {
        method: 'GET',
        loadingMessage: 'Loading recent chats...',
      });

      const data = await response.json();
      // Don't show toast for getRecentChats (silent operation)
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Load Recent Chats',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting recent chats:', error);
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
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts`, {
        method: 'POST',
        body: JSON.stringify({
          contactEmail,
        }),
        loadingMessage: 'Adding contact...',
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
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts`, {
        method: 'DELETE',
        body: JSON.stringify({
          contactEmail,
        }),
        loadingMessage: 'Removing contact...',
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
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/mark-read`, {
        method: 'POST',
        body: JSON.stringify({
          contactEmail,
        }),
        showLoader: false, // Don't show loader for silent operations
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
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/check-phone?phone=${encodeURIComponent(phone)}`, {
        method: 'GET',
        showLoader: false, // Don't show loader for quick checks
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
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/check-phones-batch`, {
        method: 'POST',
        body: JSON.stringify({
          phones,
        }),
        loadingMessage: 'Checking contacts...',
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
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/invite-link`, {
        method: 'GET',
        loadingMessage: 'Loading invite link...',
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
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/toggle-favorite`, {
        method: 'POST',
        body: JSON.stringify({
          contactEmail,
        }),
        showLoader: false, // Don't show loader for quick actions
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
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/delete-message`, {
        method: 'POST',
        body: JSON.stringify({
          messageId,
        }),
        loadingMessage: 'Deleting message...',
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

  async editMessage(messageId, newMessage) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/edit-message`, {
        method: 'POST',
        body: JSON.stringify({
          messageId,
          newMessage,
        }),
        loadingMessage: 'Editing message...',
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Message Edited',
        errorTitle: 'Failed to Edit Message',
      });
      return data;
    } catch (error) {
      console.error('Error editing message:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async clearChat(contactEmail) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/clear-chat`, {
        method: 'POST',
        body: JSON.stringify({
          contactEmail,
        }),
        loadingMessage: 'Clearing chat...',
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Chat Cleared',
        errorTitle: 'Failed to Clear Chat',
      });
      return data;
    } catch (error) {
      console.error('Error clearing chat:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async deleteChat(contactEmail) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/delete-chat`, {
        method: 'POST',
        body: JSON.stringify({
          contactEmail,
        }),
        loadingMessage: 'Deleting chat...',
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Chat Deleted',
        errorTitle: 'Failed to Delete Chat',
      });
      return data;
    } catch (error) {
      console.error('Error deleting chat:', error);
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
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/message-info/${messageId}`, {
        method: 'GET',
        loadingMessage: 'Loading message info...',
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

  async togglePin(contactEmail) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'No token found' };
      }
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/toggle-pin`, {
        method: 'POST',
        body: JSON.stringify({ contactEmail }),
        showLoader: false, // Don't show loader for quick actions
      });

      const data = await response.json();
      showToastFromResponse(data);
      return data;
    } catch (error) {
      console.error('Error toggling pin:', error);
      const errorResponse = { success: false, message: 'Network error' };
      showToastFromResponse(errorResponse, { errorTitle: 'Error' });
      return errorResponse;
    }
  }

  async toggleArchive(contactEmail) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'No token found' };
      }
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/toggle-archive`, {
        method: 'POST',
        body: JSON.stringify({ contactEmail }),
        showLoader: false, // Don't show loader for quick actions
      });

      const data = await response.json();
      showToastFromResponse(data);
      return data;
    } catch (error) {
      console.error('Error toggling archive:', error);
      const errorResponse = { success: false, message: 'Network error' };
      showToastFromResponse(errorResponse, { errorTitle: 'Error' });
      return errorResponse;
    }
  }

  async toggleMute(contactEmail, mutedUntil = null) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'No token found' };
      }
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/toggle-mute`, {
        method: 'POST',
        body: JSON.stringify({ contactEmail, mutedUntil }),
        showLoader: false, // Don't show loader for quick actions
      });

      const data = await response.json();
      showToastFromResponse(data);
      return data;
    } catch (error) {
      console.error('Error toggling mute:', error);
      const errorResponse = { success: false, message: 'Network error' };
      showToastFromResponse(errorResponse, { errorTitle: 'Error' });
      return errorResponse;
    }
  }

  async deleteContact(contactEmail) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'No token found' };
      }
      
      const response = await apiFetch(`${API_CONFIG.API_BASE}/contacts/delete`, {
        method: 'POST',
        body: JSON.stringify({ contactEmail }),
        loadingMessage: 'Deleting contact...',
      });

      const data = await response.json();
      showToastFromResponse(data);
      return data;
    } catch (error) {
      console.error('Error deleting contact:', error);
      const errorResponse = { success: false, message: 'Network error' };
      showToastFromResponse(errorResponse, { errorTitle: 'Error' });
      return errorResponse;
    }
  }
}

export default new ContactsService();

