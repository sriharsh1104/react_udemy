const groupService = require('../services/groupService');
const userService = require('../services/userService');
const userProfileService = require('../services/userProfileService');
const chatService = require('../services/chatService');

class GroupController {
  // Create a new group
  async createGroup(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { name, members } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Group name is required',
        });
      }

      if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one member is required',
        });
      }

      // Validate that all members exist
      const validMembers = [];
      for (const memberEmail of members) {
        const profile = await userProfileService.getProfileByEmail(memberEmail);
        if (profile) {
          validMembers.push(memberEmail);
        }
      }

      if (validMembers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid members found',
        });
      }

      const group = await groupService.createGroup(name, userEmail, validMembers);

      // Emit socket event to notify all group members about new group
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io && group) {
        // Notify all members about the new group
        const allMembers = group.members || [];
        allMembers.forEach((memberEmail) => {
          const memberSocketId = userService.getSocketByEmail(memberEmail);
          if (memberSocketId) {
            io.to(memberSocketId).emit('groupsUpdated', {
              groupId: group._id.toString(),
              action: 'created',
              group,
            });
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Group created successfully',
        group,
      });
    } catch (error) {
      console.error('Error in createGroup:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Get all groups for a user
  async getGroups(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      const groups = await groupService.getUserGroups(userEmail);

      // Enrich groups with member profiles, unread count, and favorite status
      const enrichedGroups = await Promise.all(
        groups.map(async (group) => {
          const memberProfiles = await Promise.all(
            group.members.map(async (email) => {
              const profile = await userProfileService.getProfileByEmail(email);
              return {
                email,
                name: profile?.name || email.split('@')[0],
              };
            })
          );

          // Get unread count for this group
          const unreadCount = await chatService.getGroupUnreadCount(userEmail, group._id.toString());
          
          // Check if user has favorited this group
          const isFavorite = group.favorites && group.favorites.includes(userEmail);
          // Check if user has pinned this group
          const isPinned = group.pinnedBy && group.pinnedBy.includes(userEmail);
          // Check if user has archived this group
          const isArchived = group.archivedBy && group.archivedBy.includes(userEmail);
          // Check if user has muted this group
          const isMuted = group.mutedBy && group.mutedBy.includes(userEmail);

          return {
            ...group,
            members: memberProfiles,
            unreadCount,
            isFavorite: isFavorite || false,
            isPinned: isPinned || false,
            isArchived: isArchived || false,
            isMuted: isMuted || false,
          };
        })
      );

      res.status(200).json({
        success: true,
        message: `Found ${enrichedGroups.length} group(s)`,
        groups: enrichedGroups,
      });
    } catch (error) {
      console.error('Error in getGroups:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get group by ID
  async getGroup(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { groupId } = req.params;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      const group = await groupService.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
        });
      }

      // Check if user is a member
      const isMember = await groupService.isMember(groupId, userEmail);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group',
        });
      }

      // Enrich with member profiles
      const memberProfiles = await Promise.all(
        group.members.map(async (email) => {
          const profile = await userProfileService.getProfileByEmail(email);
          return {
            email,
            name: profile?.name || email.split('@')[0],
          };
        })
      );

      res.status(200).json({
        success: true,
        group: {
          ...group,
          members: memberProfiles,
        },
      });
    } catch (error) {
      console.error('Error in getGroup:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Add members to group
  async addMembers(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { groupId, members } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one member is required',
        });
      }

      // Validate that all members exist
      const validMembers = [];
      for (const memberEmail of members) {
        const profile = await userProfileService.getProfileByEmail(memberEmail);
        if (profile) {
          validMembers.push(memberEmail);
        }
      }

      if (validMembers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid members found',
        });
      }

      const group = await groupService.addMembers(groupId, userEmail, validMembers);

      res.status(200).json({
        success: true,
        message: 'Members added successfully',
        group,
      });
    } catch (error) {
      console.error('Error in addMembers:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Remove member from group
  async removeMember(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { groupId, memberEmail } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!memberEmail) {
        return res.status(400).json({
          success: false,
          message: 'Member email is required',
        });
      }

      const group = await groupService.removeMember(groupId, userEmail, memberEmail);

      res.status(200).json({
        success: true,
        message: 'Member removed successfully',
        group,
      });
    } catch (error) {
      console.error('Error in removeMember:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Update group name
  async updateGroupName(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { groupId, name } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Group name is required',
        });
      }

      const group = await groupService.updateGroupName(groupId, userEmail, name);

      res.status(200).json({
        success: true,
        message: 'Group name updated successfully',
        group,
      });
    } catch (error) {
      console.error('Error in updateGroupName:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Delete group
  async deleteGroup(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { groupId } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      await groupService.deleteGroup(groupId, userEmail);

      res.status(200).json({
        success: true,
        message: 'Group deleted successfully',
      });
    } catch (error) {
      console.error('Error in deleteGroup:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Toggle favorite status for a group
  async toggleFavorite(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { groupId } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'Group ID is required',
        });
      }

      const group = await groupService.toggleFavorite(groupId, userEmail);
      
      // Check if user has favorited this group
      const isFavorite = group.favorites && group.favorites.includes(userEmail);

      res.status(200).json({
        success: true,
        message: isFavorite ? 'Group marked as favorite' : 'Group removed from favorites',
        group: {
          _id: group._id,
          name: group.name,
          isFavorite: isFavorite,
        },
      });
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Mark group messages as read
  async markGroupMessagesAsRead(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { groupId } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'Group ID is required',
        });
      }

      const result = await chatService.markGroupMessagesAsRead(userEmail, groupId);
      
      // Emit socket events to notify senders about read receipts
      if (result.success && result.messages && result.messages.length > 0) {
        const SocketService = require('../services/socketService');
        const io = SocketService.getIO();
        const group = await groupService.getGroupById(groupId);
        
        if (io && group) {
          const roomId = `group_${groupId}`;
          const allMembers = group.members || [];
          
          // For each updated message, calculate new status and notify
          for (const msg of result.messages) {
            const readBy = msg.readBy || [];
            const totalMembers = allMembers.length;
            const readCount = readBy.length;
            
            // Calculate status: if all members have read (including sender), status is 'read'
            // If some have read (more than just sender), status is 'delivered', else 'sent'
            let calculatedStatus = 'sent';
            if (readCount >= totalMembers) { // All members including sender
              calculatedStatus = 'read';
            } else if (readCount > 1) { // More than just sender has read
              calculatedStatus = 'delivered';
            }
            
            // Get the full message to find sender
            const fullMessage = await chatService.getMessageById(msg._id);
            if (fullMessage) {
              // Notify all group members about the read status update
              io.to(roomId).emit('groupMessageReadUpdate', {
                messageId: msg._id.toString(),
                readBy: readBy,
                status: calculatedStatus,
                groupId: groupId,
              });
            }
          }
        }
      }

      res.status(200).json({
        success: true,
        message: 'Messages marked as read',
      });
    } catch (error) {
      console.error('Error in markGroupMessagesAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Generate or get invite link for a group
  async generateInviteLink(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { groupId } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'Group ID is required',
        });
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:19006';
      const result = await groupService.generateInviteLink(groupId, userEmail, frontendUrl);

      res.status(200).json({
        success: true,
        inviteLink: result.inviteLink,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      console.error('Error in generateInviteLink:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Reset invite link for a group
  async resetInviteLink(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { groupId } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'Group ID is required',
        });
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:19006';
      const result = await groupService.resetInviteLink(groupId, userEmail, frontendUrl);

      res.status(200).json({
        success: true,
        message: 'Invite link reset successfully',
        inviteLink: result.inviteLink,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      console.error('Error in resetInviteLink:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Join group via invite link
  async joinGroupViaLink(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { inviteToken } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!inviteToken) {
        return res.status(400).json({
          success: false,
          message: 'Invite token is required',
        });
      }

      const result = await groupService.joinGroupViaLink(inviteToken, userEmail);

      if (result.alreadyMember) {
        return res.status(200).json({
          success: true,
          message: 'You are already a member of this group',
          group: result.group,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Successfully joined the group',
        group: result.group,
      });
    } catch (error) {
      console.error('Error in joinGroupViaLink:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Get group info by invite token (for preview before joining)
  async getGroupByInviteToken(req, res) {
    try {
      const { inviteToken } = req.params;

      if (!inviteToken) {
        return res.status(400).json({
          success: false,
          message: 'Invite token is required',
        });
      }

      const group = await groupService.getGroupByInviteToken(inviteToken);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired invite link',
        });
      }

      // Return only basic info (name, member count) without member emails for privacy
      res.status(200).json({
        success: true,
        group: {
          _id: group._id,
          name: group.name,
          memberCount: group.members?.length || 0,
        },
      });
    } catch (error) {
      console.error('Error in getGroupByInviteToken:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Pin a group message
  async pinMessage(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { messageId, groupId } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!messageId || !groupId) {
        return res.status(400).json({
          success: false,
          message: 'Message ID and Group ID are required',
        });
      }

      const chatService = require('../services/chatService');
      const message = await chatService.pinMessage(messageId, userEmail, groupId);

      // Emit socket event to notify all group members
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io) {
        const roomId = `group_${groupId}`;
        io.to(roomId).emit('messagePinned', {
          groupId,
          messageId: message._id,
          message: message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Message pinned successfully',
        pinnedMessage: message,
      });
    } catch (error) {
      console.error('Error in pinMessage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Unpin a group message
  async unpinMessage(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { messageId, groupId } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!messageId || !groupId) {
        return res.status(400).json({
          success: false,
          message: 'Message ID and Group ID are required',
        });
      }

      const chatService = require('../services/chatService');
      const message = await chatService.unpinMessage(messageId, userEmail, groupId);

      // Emit socket event to notify all group members
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io) {
        const roomId = `group_${groupId}`;
        io.to(roomId).emit('messageUnpinned', {
          groupId,
          messageId: message._id,
          message: message,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Message unpinned successfully',
        unpinnedMessage: message,
      });
    } catch (error) {
      console.error('Error in unpinMessage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Get pinned messages for a group
  async getPinnedMessages(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { groupId } = req.params;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'Group ID is required',
        });
      }

      // Verify user is a member of the group
      const isMember = await groupService.isMember(groupId, userEmail);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group',
        });
      }

      const chatService = require('../services/chatService');
      const pinnedMessages = await chatService.getPinnedMessages(groupId);

      res.status(200).json({
        success: true,
        pinnedMessages,
      });
    } catch (error) {
      console.error('Error in getPinnedMessages:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete a group message
  async deleteMessage(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { messageId } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message: 'Message ID is required',
        });
      }

      const chatService = require('../services/chatService');
      const deletedMessage = await chatService.deleteMessage(messageId, userEmail);

      // Emit socket event to notify all group members
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io && deletedMessage) {
        const roomId = `group_${deletedMessage.groupId}`;
          io.to(roomId).emit('messageDeleted', {
          groupId: deletedMessage.groupId,
            messageId: messageId,
          });
      }

      res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Edit a group message
  async editMessage(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { messageId, newMessage } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!messageId || !newMessage) {
        return res.status(400).json({
          success: false,
          message: 'Message ID and new message are required',
        });
      }

      const chatService = require('../services/chatService');
      const editedMessage = await chatService.editMessage(messageId, userEmail, newMessage);

      // Emit socket event to notify all group members
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io && editedMessage) {
        const roomId = `group_${editedMessage.groupId}`;
        io.to(roomId).emit('messageEdited', {
          messageId: messageId,
          groupId: editedMessage.groupId,
          newMessage: newMessage,
          editedAt: editedMessage.editedAt,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Message edited successfully',
        data: editedMessage,
      });
    } catch (error) {
      console.error('Error in editMessage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Clear chat for a user in a group
  async clearChat(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { groupId } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'Group ID is required',
        });
      }

      await groupService.clearChat(groupId, userEmail);

      // Emit socket event to refresh chat (messages will be filtered on next load)
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io) {
        const roomId = `group_${groupId}`;
        // Notify user to refresh chat
        io.to(roomId).emit('chatCleared', {
          groupId,
          roomId,
          clearedBy: userEmail,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Chat cleared successfully',
      });
    } catch (error) {
      console.error('Error in clearChat:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Get message info (read receipts, delivery status) - same as contactsController but for groups
  async getMessageInfo(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { messageId } = req.params;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message: 'Message ID is required',
        });
      }

      const message = await chatService.getMessageById(messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
        });
      }

      // Check if user is a member of the group
      if (message.groupId) {
        const isMember = await groupService.isMember(message.groupId.toString(), userEmail);
        if (!isMember) {
          return res.status(403).json({
            success: false,
            message: 'You are not a member of this group',
          });
        }
      }

      // Get read receipts info
      let readReceipts = [];
      let notRead = [];
      let notDelivered = [];

      if (message.messageType === 'group' && message.groupId) {
        // For group messages, check all members
        const group = await groupService.getGroupById(message.groupId.toString());
        if (group) {
          const allMembers = group.members || [];
          const readBy = message.readBy || [];
          
          allMembers.forEach(memberEmail => {
            if (memberEmail === message.senderEmail) {
              // Sender doesn't need to read their own message
              return;
            }
            
            if (readBy.includes(memberEmail)) {
              readReceipts.push(memberEmail);
            } else {
              // Check if message was delivered (has deliveredAt timestamp)
              if (message.deliveredAt) {
                notRead.push(memberEmail);
              } else {
                notDelivered.push(memberEmail);
              }
            }
          });
        }
      } else {
        // For private messages
        if (message.receiverEmail) {
          const readBy = message.readBy || [];
          if (readBy.includes(message.receiverEmail)) {
            readReceipts.push(message.receiverEmail);
          } else {
            if (message.deliveredAt) {
              notRead.push(message.receiverEmail);
            } else {
              notDelivered.push(message.receiverEmail);
            }
          }
        }
      }

      res.status(200).json({
        success: true,
        messageInfo: {
          messageId: message._id,
          senderEmail: message.senderEmail,
          timestamp: message.timestamp,
          status: message.status,
          deliveredAt: message.deliveredAt,
          readReceipts,
          notRead,
          notDelivered,
          messageType: message.messageType,
        },
      });
    } catch (error) {
      console.error('Error in getMessageInfo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Pin/Unpin a group chat
  async togglePin(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { groupId } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'Group ID is required',
        });
      }

      const group = await groupService.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
        });
      }

      const isMember = await groupService.isMember(groupId, userEmail);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group',
        });
      }

      const isPinned = group.pinnedBy && group.pinnedBy.includes(userEmail);
      if (isPinned) {
        group.pinnedBy = group.pinnedBy.filter(email => email !== userEmail);
      } else {
        if (!group.pinnedBy) {
          group.pinnedBy = [];
        }
        group.pinnedBy.push(userEmail);
      }
      await group.save();

      res.status(200).json({
        success: true,
        message: !isPinned ? 'Group pinned' : 'Group unpinned',
        group: {
          _id: group._id,
          isPinned: !isPinned,
        },
      });
    } catch (error) {
      console.error('Error in togglePin:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Archive/Unarchive a group chat
  async toggleArchive(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { groupId } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'Group ID is required',
        });
      }

      const group = await groupService.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
        });
      }

      const isMember = await groupService.isMember(groupId, userEmail);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group',
        });
      }

      const isArchived = group.archivedBy && group.archivedBy.includes(userEmail);
      if (isArchived) {
        group.archivedBy = group.archivedBy.filter(email => email !== userEmail);
      } else {
        if (!group.archivedBy) {
          group.archivedBy = [];
        }
        group.archivedBy.push(userEmail);
      }
      await group.save();

      res.status(200).json({
        success: true,
        message: !isArchived ? 'Group archived' : 'Group unarchived',
        group: {
          _id: group._id,
          isArchived: !isArchived,
        },
      });
    } catch (error) {
      console.error('Error in toggleArchive:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Mute/Unmute a group chat
  async toggleMute(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { groupId, mutedUntil } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'Group ID is required',
        });
      }

      const group = await groupService.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
        });
      }

      const isMember = await groupService.isMember(groupId, userEmail);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group',
        });
      }

      const isMuted = group.mutedBy && group.mutedBy.includes(userEmail);
      if (isMuted) {
        group.mutedBy = group.mutedBy.filter(email => email !== userEmail);
        // Remove from muteSettings
        if (group.muteSettings) {
          group.muteSettings = group.muteSettings.filter(setting => setting.userEmail !== userEmail);
        }
      } else {
        if (!group.mutedBy) {
          group.mutedBy = [];
        }
        if (!group.muteSettings) {
          group.muteSettings = [];
        }
        group.mutedBy.push(userEmail);
        // Update or add muteSettings
        const existingSetting = group.muteSettings.find(s => s.userEmail === userEmail);
        if (existingSetting) {
          existingSetting.mutedUntil = mutedUntil ? new Date(mutedUntil) : null;
        } else {
          group.muteSettings.push({
            userEmail,
            mutedUntil: mutedUntil ? new Date(mutedUntil) : null,
          });
        }
      }
      await group.save();

      res.status(200).json({
        success: true,
        message: !isMuted ? 'Group muted' : 'Group unmuted',
        group: {
          _id: group._id,
          isMuted: !isMuted,
        },
      });
    } catch (error) {
      console.error('Error in toggleMute:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }
}

module.exports = new GroupController();

