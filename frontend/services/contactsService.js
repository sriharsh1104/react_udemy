import { showToastFromResponse } from '../utils/toast';
import apiService from './apiService';

class ContactsService {
  async searchUsers(query) {
    try {
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get(`/contacts/search?query=${encodeURIComponent(query)}`, {}, false);
      
      // Don't show toast for search (silent operation)
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Search Failed',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/contacts/check', { email }, {}, false);
      
      // Don't show toast for checkUserExists (silent operation)
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Check Failed',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get('/contacts', {}, false);
      
      // Don't show toast for getContacts (silent operation)
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Load Contacts',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get('/contacts/recent-chats', {}, false);
      
      // Don't show toast for getRecentChats (silent operation)
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Load Recent Chats',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/contacts', { contactEmail }, {}, 'Adding Contact...');
      
      showToastFromResponse(result, { 
        successTitle: 'Contact Added',
        errorTitle: 'Failed to Add Contact',
      });
      return result;
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
      // Use apiService.delete - loader and auth guard handled automatically
      const result = await apiService.delete('/contacts', { body: JSON.stringify({ contactEmail }) }, 'Removing Contact...');
      
      showToastFromResponse(result, { 
        successTitle: 'Contact Removed',
        errorTitle: 'Failed to Remove Contact',
      });
      return result;
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
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/contacts/mark-read', { contactEmail }, {}, false);
      
      // Don't show toast for markMessagesAsRead (silent operation)
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Mark as Read',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get(`/contacts/check-phone?phone=${encodeURIComponent(phone)}`, {}, false);
      
      // Don't show toast for checkPhoneRegistered (silent operation)
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Check Failed',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/contacts/check-phones-batch', { phones }, {}, false);
      
      // Don't show toast for checkPhonesBatch (silent operation)
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Check Failed',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get('/contacts/invite-link', {}, false);
      
      // Don't show toast for getInviteLink (silent operation)
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Get Invite Link',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/contacts/toggle-favorite', { contactEmail }, {}, false);
      
      // Don't show toast for toggleFavorite (silent operation)
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Update Favorite',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/contacts/delete-message', { messageId }, {}, 'Deleting Message...');
      
      showToastFromResponse(result, { 
        successTitle: 'Message Deleted',
        errorTitle: 'Failed to Delete Message',
      });
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/contacts/edit-message', { messageId, newMessage }, {}, 'Editing Message...');
      
      showToastFromResponse(result, { 
        successTitle: 'Message Edited',
        errorTitle: 'Failed to Edit Message',
      });
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/contacts/clear-chat', { contactEmail }, {}, 'Clearing Chat...');
      
      showToastFromResponse(result, { 
        successTitle: 'Chat Cleared',
        errorTitle: 'Failed to Clear Chat',
      });
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/contacts/delete-chat', { contactEmail }, {}, 'Deleting Chat...');
      
      showToastFromResponse(result, { 
        successTitle: 'Chat Deleted',
        errorTitle: 'Failed to Delete Chat',
      });
      return result;
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
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get(`/contacts/message-info/${messageId}`, {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Load Message Info',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/contacts/toggle-pin', { contactEmail }, {}, false);
      showToastFromResponse(result);
      return result;
    } catch (error) {
      console.error('Error toggling pin:', error);
      const errorResponse = { success: false, message: 'Network error' };
      showToastFromResponse(errorResponse, { errorTitle: 'Error' });
      return errorResponse;
    }
  }

  async toggleArchive(contactEmail) {
    try {
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/contacts/toggle-archive', { contactEmail }, {}, false);
      showToastFromResponse(result);
      return result;
    } catch (error) {
      console.error('Error toggling archive:', error);
      const errorResponse = { success: false, message: 'Network error' };
      showToastFromResponse(errorResponse, { errorTitle: 'Error' });
      return errorResponse;
    }
  }

  async toggleMute(contactEmail, mutedUntil = null) {
    try {
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/contacts/toggle-mute', { contactEmail, mutedUntil }, {}, false);
      showToastFromResponse(result);
      return result;
    } catch (error) {
      console.error('Error toggling mute:', error);
      const errorResponse = { success: false, message: 'Network error' };
      showToastFromResponse(errorResponse, { errorTitle: 'Error' });
      return errorResponse;
    }
  }

  async deleteContact(contactEmail) {
    try {
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/contacts/delete', { contactEmail }, {}, 'Deleting Contact...');
      showToastFromResponse(result);
      return result;
    } catch (error) {
      console.error('Error deleting contact:', error);
      const errorResponse = { success: false, message: 'Network error' };
      showToastFromResponse(errorResponse, { errorTitle: 'Error' });
      return errorResponse;
    }
  }
}

export default new ContactsService();
