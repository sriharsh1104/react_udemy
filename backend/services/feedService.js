const Status = require('../models/Status');
const File = require('../models/File');
const Contact = require('../models/Contact');
const User = require('../models/User');

class FeedService {
  // Get Instagram-like feed (all statuses from contacts in chronological order)
  async getFeed(userEmail, page = 1, limit = 10) {
    try {
      // Get all contacts
      const contacts = await Contact.find({ userEmail }).lean();
      const contactEmails = contacts.map(c => c.contactEmail);
      
      // Also include own statuses
      const allUserEmails = [...contactEmails, userEmail];
      
      // Get statuses from contacts (last 24 hours) with pagination
      const skip = (page - 1) * limit;
      const statuses = await Status.find({
        userEmail: { $in: allUserEmails },
        expiresAt: { $gt: new Date() },
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get file info for each status
      const fileIds = statuses.map(s => s.fileId);
      const files = await File.find({ fileId: { $in: fileIds } }).lean();
      const fileMap = {};
      files.forEach(file => {
        fileMap[file.fileId] = file;
      });

      // Get user info for each status
      const userEmails = [...new Set(statuses.map(s => s.userEmail))];
      const users = await User.find({ email: { $in: userEmails } }).lean();
      const userMap = {};
      users.forEach(user => {
        userMap[user.email] = {
          name: user.name || user.email.split('@')[0],
          email: user.email,
        };
      });

      // Get contact names
      const contactMap = {};
      contacts.forEach(contact => {
        contactMap[contact.contactEmail] = contact.name || contact.contactEmail.split('@')[0];
      });

      // Combine status with file info, user info, and interaction data
      const feedItems = statuses.map(status => {
        const file = fileMap[status.fileId];
        const user = userMap[status.userEmail] || {
          name: contactMap[status.userEmail] || status.userEmail.split('@')[0],
          email: status.userEmail,
        };
        
        const isLiked = status.likes.some(like => like.userEmail === userEmail);
        const isViewed = status.viewers.some(v => v.viewerEmail === userEmail);
        
        return {
          statusId: status._id.toString(),
          userEmail: status.userEmail,
          userName: user.name,
          fileId: status.fileId,
          statusType: status.statusType,
          statusUrl: file ? `/api/files/download/${file.fileId}` : null,
          caption: status.caption || '',
          likesCount: status.likes.length,
          commentsCount: status.comments.length,
          viewersCount: status.viewers.length,
          isLiked,
          isViewed,
          createdAt: status.createdAt,
          statusTime: this.getTimeAgo(status.createdAt),
        };
      });

      return {
        feed: feedItems,
        hasMore: statuses.length === limit,
        page,
        total: feedItems.length,
      };
    } catch (error) {
      console.error('Error getting feed:', error);
      throw error;
    }
  }

  // Like/Unlike a status
  async toggleLike(statusId, userEmail) {
    try {
      const status = await Status.findById(statusId);
      if (!status) {
        throw new Error('Status not found');
      }

      // Check if already liked
      const likeIndex = status.likes.findIndex(like => like.userEmail === userEmail);
      
      if (likeIndex > -1) {
        // Unlike
        status.likes.splice(likeIndex, 1);
      } else {
        // Like
        status.likes.push({
          userEmail,
          likedAt: new Date(),
        });
      }

      await status.save();
      
      return {
        isLiked: likeIndex === -1,
        likesCount: status.likes.length,
      };
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Add comment to status
  async addComment(statusId, userEmail, comment) {
    try {
      if (!comment || comment.trim().length === 0) {
        throw new Error('Comment cannot be empty');
      }

      const status = await Status.findById(statusId);
      if (!status) {
        throw new Error('Status not found');
      }

      // Add comment
      status.comments.push({
        userEmail,
        comment: comment.trim(),
        commentedAt: new Date(),
      });

      await status.save();
      
      // Get user info for the comment
      const user = await User.findOne({ email: userEmail }).lean();
      const commentData = status.comments[status.comments.length - 1];
      
      return {
        commentId: commentData._id.toString(),
        userEmail: commentData.userEmail,
        userName: user?.name || userEmail.split('@')[0],
        comment: commentData.comment,
        commentedAt: commentData.commentedAt,
        commentsCount: status.comments.length,
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Get comments for a status
  async getComments(statusId, userEmail) {
    try {
      const status = await Status.findById(statusId).lean();
      if (!status) {
        throw new Error('Status not found');
      }

      // Get user info for all commenters
      const commenterEmails = [...new Set(status.comments.map(c => c.userEmail))];
      const users = await User.find({ email: { $in: commenterEmails } }).lean();
      const userMap = {};
      users.forEach(user => {
        userMap[user.email] = user.name || user.email.split('@')[0];
      });

      // Format comments with user names
      const comments = status.comments.map(comment => ({
        commentId: comment._id.toString(),
        userEmail: comment.userEmail,
        userName: userMap[comment.userEmail] || comment.userEmail.split('@')[0],
        comment: comment.comment,
        commentedAt: comment.commentedAt,
        isOwnComment: comment.userEmail === userEmail,
      }));

      return comments.sort((a, b) => new Date(a.commentedAt) - new Date(b.commentedAt));
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  // Update status caption
  async updateCaption(statusId, userEmail, caption) {
    try {
      const status = await Status.findById(statusId);
      if (!status) {
        throw new Error('Status not found');
      }

      // Only owner can update caption
      if (status.userEmail !== userEmail) {
        throw new Error('Unauthorized');
      }

      status.caption = caption || '';
      await status.save();

      return {
        statusId: status._id.toString(),
        caption: status.caption,
      };
    } catch (error) {
      console.error('Error updating caption:', error);
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

module.exports = new FeedService();

