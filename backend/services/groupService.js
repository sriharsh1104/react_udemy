const Group = require('../models/Group');
const { ERROR_MESSAGES } = require('../constants');

class GroupService {
  // Create a new group
  async createGroup(name, createdBy, members) {
    try {
      // Ensure creator is in members
      const allMembers = [...new Set([createdBy, ...members])];
      
      const group = new Group({
        name: name.trim(),
        createdBy,
        members: allMembers,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await group.save();
      return group.toObject();
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  // Get all groups for a user
  async getUserGroups(userEmail) {
    try {
      const groups = await Group.find({ members: userEmail })
        .sort({ updatedAt: -1 })
        .lean();
      return groups;
    } catch (error) {
      console.error('Error getting user groups:', error);
      return [];
    }
  }

  // Get group by ID
  async getGroupById(groupId) {
    try {
      const group = await Group.findById(groupId).lean();
      return group;
    } catch (error) {
      console.error('Error getting group:', error);
      return null;
    }
  }

  // Add members to group
  async addMembers(groupId, userEmail, newMembers) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
      }

      // Check if user is a member
      if (!group.members.includes(userEmail)) {
        throw new Error('Only group members can add new members');
      }

      // Add new members (avoid duplicates)
      const existingMembers = new Set(group.members);
      newMembers.forEach(member => existingMembers.add(member));
      group.members = Array.from(existingMembers);
      group.updatedAt = new Date();
      
      await group.save();
      return group.toObject();
    } catch (error) {
      console.error('Error adding members:', error);
      throw error;
    }
  }

  // Remove member from group
  async removeMember(groupId, userEmail, memberToRemove) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
      }

      // Check if user is a member
      if (!group.members.includes(userEmail)) {
        throw new Error('Only group members can remove members');
      }

      // Creator can remove anyone, members can only remove themselves
      if (group.createdBy !== userEmail && userEmail !== memberToRemove) {
        throw new Error('You can only remove yourself from the group');
      }

      // If creator is being removed, transfer creator role to next oldest member
      if (group.createdBy === memberToRemove) {
        // Get remaining members (excluding the creator being removed)
        const remainingMembers = group.members.filter(m => m !== memberToRemove);
        
        if (remainingMembers.length === 0) {
          throw new Error('Cannot remove creator when no other members exist. Delete the group instead.');
        }

        // Find the oldest member (first in the members array, excluding creator)
        // Sort by creation date or use first member in array
        // Since we don't have join date, we'll use the first member in the array (oldest by insertion)
        const newCreator = remainingMembers[0];
        group.createdBy = newCreator;
      }

      group.members = group.members.filter(m => m !== memberToRemove);
      group.updatedAt = new Date();
      
      await group.save();
      return group.toObject();
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  // Update group name
  async updateGroupName(groupId, userEmail, newName) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
      }

      // Only creator can update name
      if (group.createdBy !== userEmail) {
        throw new Error('Only group creator can update group name');
      }

      group.name = newName.trim();
      group.updatedAt = new Date();
      
      await group.save();
      return group.toObject();
    } catch (error) {
      console.error('Error updating group name:', error);
      throw error;
    }
  }

  // Delete group
  async deleteGroup(groupId, userEmail) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
      }

      // Only creator can delete group
      if (group.createdBy !== userEmail) {
        throw new Error('Only group creator can delete the group');
      }

      await Group.deleteOne({ _id: groupId });
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  // Check if user is member of group
  async isMember(groupId, userEmail) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return false;
      }
      return group.members.includes(userEmail);
    } catch (error) {
      console.error('Error checking membership:', error);
      return false;
    }
  }

  // Toggle favorite status for a group
  async toggleFavorite(groupId, userEmail) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
      }

      // Check if user is a member
      if (!group.members.includes(userEmail)) {
        throw new Error('Only group members can favorite/unfavorite the group');
      }

      // Initialize favorites array if it doesn't exist
      if (!group.favorites) {
        group.favorites = [];
      }

      // Toggle favorite status
      const isFavorite = group.favorites && group.favorites.includes(userEmail);
      if (isFavorite) {
        // Remove from favorites
        group.favorites = group.favorites.filter(email => email !== userEmail);
      } else {
        // Add to favorites
        if (!group.favorites) {
          group.favorites = [];
        }
        group.favorites.push(userEmail);
      }

      group.updatedAt = new Date();
      await group.save();

      return group.toObject();
    } catch (error) {
      console.error('Error toggling group favorite:', error);
      throw error;
    }
  }

  // Generate or get invite link for a group
  async generateInviteLink(groupId, userEmail, frontendUrl) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
      }

      // Check if user is a member
      if (!group.members.includes(userEmail)) {
        throw new Error('Only group members can generate invite links');
      }

      // If link exists and is not expired, return existing link
      if (group.inviteLink && group.inviteLinkExpiry && group.inviteLinkExpiry > new Date()) {
        const fullLink = `${frontendUrl}/group-invite/${group.inviteLink}`;
        return {
          inviteLink: fullLink,
          expiresAt: group.inviteLinkExpiry,
        };
      }

      // Generate new invite link token (using crypto for secure random token)
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');

      // Set expiry to 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Store only the token in database
      group.inviteLink = token;
      group.inviteLinkExpiry = expiryDate;
      group.updatedAt = new Date();
      await group.save();

      const fullLink = `${frontendUrl}/group-invite/${token}`;
      return {
        inviteLink: fullLink,
        expiresAt: group.inviteLinkExpiry,
      };
    } catch (error) {
      console.error('Error generating invite link:', error);
      throw error;
    }
  }

  // Reset invite link (expires old one and generates new)
  async resetInviteLink(groupId, userEmail, frontendUrl) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
      }

      // Check if user is a member
      if (!group.members.includes(userEmail)) {
        throw new Error('Only group members can reset invite links');
      }

      // Generate new invite link token
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');

      // Set expiry to 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Old link is automatically expired by setting new token
      group.inviteLink = token;
      group.inviteLinkExpiry = expiryDate;
      group.updatedAt = new Date();
      await group.save();

      const fullLink = `${frontendUrl}/group-invite/${token}`;
      return {
        inviteLink: fullLink,
        expiresAt: group.inviteLinkExpiry,
      };
    } catch (error) {
      console.error('Error resetting invite link:', error);
      throw error;
    }
  }

  // Join group via invite link
  async joinGroupViaLink(inviteToken, userEmail) {
    try {
      // Find group by invite token (stored in inviteLink field)
      const group = await Group.findOne({ inviteLink: inviteToken });
      
      if (!group) {
        throw new Error('Invalid invite link');
      }

      // Check if link is expired
      if (group.inviteLinkExpiry && group.inviteLinkExpiry < new Date()) {
        throw new Error('Invite link has expired');
      }

      // Check if user is already a member
      if (group.members.includes(userEmail)) {
        return {
          group: group.toObject(),
          alreadyMember: true,
        };
      }

      // Add user to group
      group.members.push(userEmail);
      group.updatedAt = new Date();
      await group.save();

      return {
        group: group.toObject(),
        alreadyMember: false,
      };
    } catch (error) {
      console.error('Error joining group via link:', error);
      throw error;
    }
  }

  // Get group by invite token
  async getGroupByInviteToken(inviteToken) {
    try {
      const group = await Group.findOne({ inviteLink: inviteToken }).lean();
      
      if (!group) {
        return null;
      }

      // Check if link is expired
      if (group.inviteLinkExpiry && group.inviteLinkExpiry < new Date()) {
        return null;
      }

      return group;
    } catch (error) {
      console.error('Error getting group by invite token:', error);
      return null;
    }
  }

  // Clear chat for a user in a group
  async clearChat(groupId, userEmail) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
      }

      // Check if user is a member
      if (!group.members.includes(userEmail)) {
        throw new Error('Only group members can clear chat');
      }

      // Initialize clearedBy array if it doesn't exist
      if (!group.clearedBy) {
        group.clearedBy = [];
      }

      // Remove existing entry for this user if any
      group.clearedBy = group.clearedBy.filter(
        entry => entry.userEmail !== userEmail
      );

      // Add new cleared entry
      group.clearedBy.push({
        userEmail,
        clearedAt: new Date(),
      });

      group.updatedAt = new Date();
      await group.save();

      return group.toObject();
    } catch (error) {
      console.error('Error clearing group chat:', error);
      throw error;
    }
  }

  // Get clearedAt timestamp for a user in a group
  async getClearedAt(groupId, userEmail) {
    try {
      const group = await Group.findById(groupId).lean();
      if (!group || !group.clearedBy) {
        return null;
      }

      const clearedEntry = group.clearedBy.find(
        entry => entry.userEmail === userEmail
      );

      return clearedEntry?.clearedAt || null;
    } catch (error) {
      console.error('Error getting clearedAt for group:', error);
      return null;
    }
  }
}

module.exports = new GroupService();

