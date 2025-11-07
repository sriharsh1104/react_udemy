const Group = require('../models/Group');

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
        throw new Error('Group not found');
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
        throw new Error('Group not found');
      }

      // Check if user is a member
      if (!group.members.includes(userEmail)) {
        throw new Error('Only group members can remove members');
      }

      // Creator can remove anyone, members can only remove themselves
      if (group.createdBy !== userEmail && userEmail !== memberToRemove) {
        throw new Error('You can only remove yourself from the group');
      }

      // Cannot remove creator
      if (group.createdBy === memberToRemove) {
        throw new Error('Cannot remove group creator');
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
        throw new Error('Group not found');
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
        throw new Error('Group not found');
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
        throw new Error('Group not found');
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
}

module.exports = new GroupService();

