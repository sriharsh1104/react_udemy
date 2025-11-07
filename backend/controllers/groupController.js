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

          return {
            ...group,
            members: memberProfiles,
            unreadCount,
            isFavorite: isFavorite || false,
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

      await chatService.markGroupMessagesAsRead(userEmail, groupId);

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
}

module.exports = new GroupController();

