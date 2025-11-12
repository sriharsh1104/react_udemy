import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToastFromResponse } from '../utils/toast';

class GroupService {
  async createGroup(name, members) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          members,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Group Created',
        errorTitle: 'Failed to Create Group',
      });
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async getGroups() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Load Groups',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting groups:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async getGroup(groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/${groupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Load Group',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting group:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async addMembers(groupId, members) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/add-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
          members,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Members Added',
        errorTitle: 'Failed to Add Members',
      });
      return data;
    } catch (error) {
      console.error('Error adding members:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async removeMember(groupId, memberEmail) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/remove-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
          memberEmail,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Member Removed',
        errorTitle: 'Failed to Remove Member',
      });
      return data;
    } catch (error) {
      console.error('Error removing member:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async updateGroupName(groupId, name) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/update-name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
          name,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Group Name Updated',
        errorTitle: 'Failed to Update Group Name',
      });
      return data;
    } catch (error) {
      console.error('Error updating group name:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async deleteGroup(groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Group Deleted',
        errorTitle: 'Failed to Delete Group',
      });
      return data;
    } catch (error) {
      console.error('Error deleting group:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async toggleFavorite(groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/toggle-favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
        }),
      });

      const data = await response.json();
      // Don't show toast for favorite toggle (to avoid too many notifications)
      if (!data.success) {
        showToastFromResponse(data, { 
          successTitle: 'Favorite Updated',
          errorTitle: 'Failed to Update Favorite',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error toggling group favorite:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async markMessagesAsRead(groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Mark Messages as Read',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error marking group messages as read:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async generateInviteLink(groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/generate-invite-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Generate Invite Link',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error generating invite link:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async resetInviteLink(groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/reset-invite-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Invite Link Reset',
        errorTitle: 'Failed to Reset Invite Link',
      });
      return data;
    } catch (error) {
      console.error('Error resetting invite link:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async joinGroupViaLink(inviteToken) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/join-via-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          inviteToken,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Joined Group',
        errorTitle: 'Failed to Join Group',
      });
      return data;
    } catch (error) {
      console.error('Error joining group via link:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async pinMessage(messageId, groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/pin-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId,
          groupId,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Message Pinned',
        errorTitle: 'Failed to Pin Message',
      });
      return data;
    } catch (error) {
      console.error('Error pinning message:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async unpinMessage(messageId, groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/unpin-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId,
          groupId,
        }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Message Unpinned',
        errorTitle: 'Failed to Unpin Message',
      });
      return data;
    } catch (error) {
      console.error('Error unpinning message:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async getPinnedMessages(groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/${groupId}/pinned-messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { 
          errorTitle: 'Failed to Load Pinned Messages',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting pinned messages:', error);
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
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/delete-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId,
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

  async editMessage(messageId, newMessage) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/edit-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId,
          newMessage,
        }),
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

  async clearChat(groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/clear-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
        }),
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

  async getMessageInfo(messageId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/message-info/${messageId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  async togglePin(groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'No token found' };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/toggle-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId }),
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

  async toggleArchive(groupId) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'No token found' };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/toggle-archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId }),
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

  async toggleMute(groupId, mutedUntil = null) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'No token found' };
      }
      
      const response = await fetch(`${API_CONFIG.API_BASE}/groups/toggle-mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId, mutedUntil }),
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
}

export default new GroupService();

