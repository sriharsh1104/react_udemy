import { showToastFromResponse } from '../utils/toast';
import apiService from './apiService';

class GroupService {
  async createGroup(name, members) {
    try {
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/groups', { name, members }, {}, 'Creating Group...');
      
      showToastFromResponse(result, { 
        successTitle: 'Group Created',
        errorTitle: 'Failed to Create Group',
      });
      return result;
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
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get('/groups', {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Load Groups',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get(`/groups/${groupId}`, {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Load Group',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/groups/add-members', { groupId, members }, {}, 'Adding Members...');
      
      showToastFromResponse(result, { 
        successTitle: 'Members Added',
        errorTitle: 'Failed to Add Members',
      });
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/groups/remove-member', { groupId, memberEmail }, {}, 'Removing Member...');
      
      showToastFromResponse(result, { 
        successTitle: 'Member Removed',
        errorTitle: 'Failed to Remove Member',
      });
      return result;
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
      // Use apiService.put - loader and auth guard handled automatically
      const result = await apiService.put('/groups/update-name', { groupId, name }, {}, 'Updating Group Name...');
      
      showToastFromResponse(result, { 
        successTitle: 'Group Name Updated',
        errorTitle: 'Failed to Update Group Name',
      });
      return result;
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
      // Use apiService.delete - loader and auth guard handled automatically
      const result = await apiService.delete('/groups', { body: JSON.stringify({ groupId }) }, 'Deleting Group...');
      
      showToastFromResponse(result, { 
        successTitle: 'Group Deleted',
        errorTitle: 'Failed to Delete Group',
      });
      return result;
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
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/groups/toggle-favorite', { groupId }, {}, false);
      
      // Don't show toast for favorite toggle (to avoid too many notifications)
      if (!result.success) {
        showToastFromResponse(result, { 
          successTitle: 'Favorite Updated',
          errorTitle: 'Failed to Update Favorite',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/groups/mark-read', { groupId }, {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Mark Messages as Read',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/groups/generate-invite-link', { groupId }, {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Generate Invite Link',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/groups/reset-invite-link', { groupId }, {}, 'Resetting Invite Link...');
      
      showToastFromResponse(result, { 
        successTitle: 'Invite Link Reset',
        errorTitle: 'Failed to Reset Invite Link',
      });
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/groups/join-via-link', { inviteToken }, {}, 'Joining Group...');
      
      showToastFromResponse(result, { 
        successTitle: 'Joined Group',
        errorTitle: 'Failed to Join Group',
      });
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/groups/pin-message', { messageId, groupId }, {}, 'Pinning Message...');
      
      showToastFromResponse(result, { 
        successTitle: 'Message Pinned',
        errorTitle: 'Failed to Pin Message',
      });
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/groups/unpin-message', { messageId, groupId }, {}, 'Unpinning Message...');
      
      showToastFromResponse(result, { 
        successTitle: 'Message Unpinned',
        errorTitle: 'Failed to Unpin Message',
      });
      return result;
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
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get(`/groups/${groupId}/pinned-messages`, {}, false);
      
      if (!result.success) {
        showToastFromResponse(result, { 
          errorTitle: 'Failed to Load Pinned Messages',
          showSuccess: false,
        });
      }
      return result;
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
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/groups/delete-message', { messageId }, {}, 'Deleting Message...');
      
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
      const result = await apiService.post('/groups/edit-message', { messageId, newMessage }, {}, 'Editing Message...');
      
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

  async clearChat(groupId) {
    try {
      // Use apiService.post - loader and auth guard handled automatically
      const result = await apiService.post('/groups/clear-chat', { groupId }, {}, 'Clearing Chat...');
      
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

  async getMessageInfo(messageId) {
    try {
      // Use apiService.get - loader disabled for silent operation, auth guard handled
      const result = await apiService.get(`/groups/message-info/${messageId}`, {}, false);
      
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

  async togglePin(groupId) {
    try {
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/groups/toggle-pin', { groupId }, {}, false);
      showToastFromResponse(result);
      return result;
    } catch (error) {
      console.error('Error toggling pin:', error);
      const errorResponse = { success: false, message: 'Network error' };
      showToastFromResponse(errorResponse, { errorTitle: 'Error' });
      return errorResponse;
    }
  }

  async toggleArchive(groupId) {
    try {
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/groups/toggle-archive', { groupId }, {}, false);
      showToastFromResponse(result);
      return result;
    } catch (error) {
      console.error('Error toggling archive:', error);
      const errorResponse = { success: false, message: 'Network error' };
      showToastFromResponse(errorResponse, { errorTitle: 'Error' });
      return errorResponse;
    }
  }

  async toggleMute(groupId, mutedUntil = null) {
    try {
      // Use apiService.post - loader disabled for silent operation, auth guard handled
      const result = await apiService.post('/groups/toggle-mute', { groupId, mutedUntil }, {}, false);
      showToastFromResponse(result);
      return result;
    } catch (error) {
      console.error('Error toggling mute:', error);
      const errorResponse = { success: false, message: 'Network error' };
      showToastFromResponse(errorResponse, { errorTitle: 'Error' });
      return errorResponse;
    }
  }
}

export default new GroupService();
