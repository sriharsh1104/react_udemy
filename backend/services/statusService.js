const Status = require('../models/Status');
const File = require('../models/File');
const Contact = require('../models/Contact');

class StatusService {
  // Create a new status
  async createStatus(userEmail, fileId, statusType) {
    try {
      const status = new Status({
        userEmail,
        fileId,
        statusType,
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
      
      // Get statuses from contacts (last 24 hours)
      const statuses = await Status.find({
        userEmail: { $in: contactEmails },
        expiresAt: { $gt: new Date() },
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
        const latestStatus = userStatuses[0]; // Most recent status
        const file = fileMap[latestStatus.fileId];
        const isViewed = latestStatus.viewers.some(v => v.viewerEmail === userEmail);
        
        result.push({
          email: contactEmail,
          name: contactMap[contactEmail] || contactEmail.split('@')[0],
          statusId: latestStatus._id.toString(),
          fileId: latestStatus.fileId,
          statusType: latestStatus.statusType,
          statusUrl: file ? `/api/files/download/${file.fileId}` : null,
          statusTime: this.getTimeAgo(latestStatus.createdAt),
          hasUnviewedStatus: !isViewed,
          viewersCount: latestStatus.viewers.length,
          createdAt: latestStatus.createdAt,
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting statuses for contacts:', error);
      throw error;
    }
  }

  // Get user's own status
  async getUserStatus(userEmail) {
    try {
      const status = await Status.findOne({
        userEmail,
        expiresAt: { $gt: new Date() },
      })
        .sort({ createdAt: -1 })
        .lean();

      if (!status) return null;

      const file = await File.findOne({ fileId: status.fileId }).lean();
      
      return {
        statusId: status._id.toString(),
        fileId: status.fileId,
        statusType: status.statusType,
        statusUrl: file ? `/api/files/download/${file.fileId}` : null,
        statusTime: this.getTimeAgo(status.createdAt),
        viewersCount: status.viewers.length,
        createdAt: status.createdAt,
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

