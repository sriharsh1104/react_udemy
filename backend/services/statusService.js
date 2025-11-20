const Status = require('../models/Status');
const File = require('../models/File');
const Contact = require('../models/Contact');

class StatusService {
  // Create a new status
  async createStatus(userEmail, fileId, statusType, caption = '', tags = [], postType = 'status') {
    try {
      const status = new Status({
        userEmail,
        fileId,
        statusType,
        caption: caption || '',
        tags: Array.isArray(tags) ? tags : [],
        postType: postType || 'status', // 'status' for WhatsApp-style, 'feed' for Instagram-style
      });
      await status.save();
      return status;
    } catch (error) {
      console.error('Error creating status:', error);
      throw error;
    }
  }

  // Get statuses for contacts (only contacts who have status)
  async getStatusesForContacts(userEmail) {
    try {
      // Get all contacts
      const contacts = await Contact.find({ userEmail }).lean();
      const contactEmails = contacts.map(c => c.contactEmail);
      
      // Get statuses from contacts (last 24 hours) - only WhatsApp-style statuses, not feed posts
      const statuses = await Status.find({
        userEmail: { $in: contactEmails },
        expiresAt: { $gt: new Date() },
        postType: 'status', // Only show status updates, not feed posts
      })
        .sort({ createdAt: -1 })
        .lean();

      // Group statuses by user
      const statusesByUser = {};
      statuses.forEach(status => {
        if (!statusesByUser[status.userEmail]) {
          statusesByUser[status.userEmail] = [];
        }
        statusesByUser[status.userEmail].push(status);
      });

      // Get file info for each status
      const fileIds = statuses.map(s => s.fileId);
      const files = await File.find({ fileId: { $in: fileIds } }).lean();
      const fileMap = {};
      files.forEach(file => {
        fileMap[file.fileId] = file;
      });

      // Get contact names
      const contactMap = {};
      contacts.forEach(contact => {
        contactMap[contact.contactEmail] = contact.name || contact.contactEmail.split('@')[0];
      });

      // Combine status with file info and check if viewed
      const result = [];
      for (const [contactEmail, userStatuses] of Object.entries(statusesByUser)) {
        // Sort statuses: unviewed first (oldest first), then viewed (oldest first)
        const sortedStatuses = userStatuses.sort((a, b) => {
          const aViewed = a.viewers.some(v => v.viewerEmail === userEmail);
          const bViewed = b.viewers.some(v => v.viewerEmail === userEmail);
          
          // If one is viewed and other is not, unviewed comes first
          if (aViewed !== bViewed) {
            return aViewed ? 1 : -1; // unviewed (false) comes first
          }
          
          // Both have same viewed status, sort by createdAt ascending (oldest first)
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        // Get the first status (which will be oldest unviewed, or oldest viewed if all viewed)
        const firstStatus = sortedStatuses[0];
        
        // Check if any status is unviewed
        const hasUnviewed = sortedStatuses.some(status => 
          !status.viewers.some(v => v.viewerEmail === userEmail)
        );
        
        // Get all statuses with file info (already sorted)
        const allStatuses = sortedStatuses.map(status => {
          const file = fileMap[status.fileId];
          return {
            statusId: status._id.toString(),
            fileId: status.fileId,
            statusType: status.statusType,
            statusUrl: file ? `/api/files/view/${file.fileId}` : null,
            statusTime: this.getTimeAgo(status.createdAt),
            viewersCount: status.viewers.length,
            createdAt: status.createdAt,
            isViewed: status.viewers.some(v => v.viewerEmail === userEmail),
          };
        });
        
        result.push({
          email: contactEmail,
          name: contactMap[contactEmail] || contactEmail.split('@')[0],
          statusId: firstStatus._id.toString(), // First status ID (oldest unviewed or oldest viewed)
          fileId: firstStatus.fileId, // First status fileId for avatar
          statusType: firstStatus.statusType,
          statusUrl: fileMap[firstStatus.fileId] ? `/api/files/view/${fileMap[firstStatus.fileId].fileId}` : null,
          statusTime: this.getTimeAgo(firstStatus.createdAt),
          hasUnviewedStatus: hasUnviewed,
          viewersCount: firstStatus.viewers.length,
          createdAt: firstStatus.createdAt,
          allStatuses: allStatuses, // All statuses array (sorted: unviewed oldest first, then viewed oldest first)
          statusCount: allStatuses.length, // Total count
        });
      }

      // Sort result: contacts with unviewed statuses first, then by oldest status first
      result.sort((a, b) => {
        // If one has unviewed and other doesn't, unviewed comes first
        if (a.hasUnviewedStatus !== b.hasUnviewedStatus) {
          return a.hasUnviewedStatus ? -1 : 1; // unviewed (true) comes first
        }
        
        // Both have same unviewed status, sort by oldest status first
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      return result;
    } catch (error) {
      console.error('Error getting statuses for contacts:', error);
      throw error;
    }
  }

  // Get user's own statuses (all active statuses - multiple allowed)
  async getUserStatus(userEmail) {
    try {
      const statuses = await Status.find({
        userEmail,
        expiresAt: { $gt: new Date() },
        postType: 'status', // Only show status updates, not feed posts
      })
        .sort({ createdAt: 1 }) // Oldest first (first loaded = first displayed)
        .lean();

      if (!statuses || statuses.length === 0) return null;

      // Get file info for all statuses
      const fileIds = statuses.map(s => s.fileId);
      const files = await File.find({ fileId: { $in: fileIds } }).lean();
      const fileMap = {};
      files.forEach(file => {
        fileMap[file.fileId] = file;
      });

      // Return all statuses as array (already sorted oldest first)
      const statusList = statuses.map(status => {
        const file = fileMap[status.fileId];
        return {
          statusId: status._id.toString(),
          fileId: status.fileId,
          statusType: status.statusType,
          statusUrl: file ? `/api/files/view/${file.fileId}` : null,
          statusTime: this.getTimeAgo(status.createdAt),
          viewersCount: status.viewers.length,
          createdAt: status.createdAt,
          email: userEmail, // Add email for frontend to check if it's own status
        };
      });

      // Return first status info for backward compatibility, but include allStatuses array
      return {
        ...statusList[0], // First status (oldest) for backward compatibility
        allStatuses: statusList, // All statuses array (oldest first)
        statusCount: statusList.length,
      };
    } catch (error) {
      console.error('Error getting user status:', error);
      throw error;
    }
  }

  // Mark status as viewed
  async markAsViewed(statusId, viewerEmail) {
    try {
      const status = await Status.findById(statusId);
      if (!status) {
        throw new Error('Status not found');
      }

      // Check if already viewed
      const alreadyViewed = status.viewers.some(v => v.viewerEmail === viewerEmail);
      if (alreadyViewed) {
        return status;
      }

      // Add viewer
      status.viewers.push({
        viewerEmail,
        viewedAt: new Date(),
      });

      await status.save();
      
      // Streak updates removed - streaks only work with dedicated streak button
      
      return status;
    } catch (error) {
      console.error('Error marking status as viewed:', error);
      throw error;
    }
  }

  // Get viewers list for a status
  async getViewers(statusId, ownerEmail) {
    try {
      const status = await Status.findById(statusId).lean();
      if (!status) {
        throw new Error('Status not found');
      }

      // Only owner can see viewers
      if (status.userEmail !== ownerEmail) {
        throw new Error('Unauthorized');
      }

      // Get viewer names from User model
      const User = require('../models/User');
      const viewerEmails = status.viewers.map(v => v.viewerEmail);
      const users = await User.find({ email: { $in: viewerEmails } }).lean();
      const userMap = {};
      users.forEach(user => {
        userMap[user.email] = user.name || user.email.split('@')[0];
      });

      // Combine viewers with names
      const viewersWithNames = status.viewers.map(viewer => ({
        viewerEmail: viewer.viewerEmail,
        viewerName: userMap[viewer.viewerEmail] || viewer.viewerEmail.split('@')[0],
        viewedAt: viewer.viewedAt,
      }));

      return viewersWithNames;
    } catch (error) {
      console.error('Error getting viewers:', error);
      throw error;
    }
  }

  // Helper: Get time ago string
  getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
}

module.exports = new StatusService();

