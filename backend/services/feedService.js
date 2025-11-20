const Status = require('../models/Status');
const File = require('../models/File');
const User = require('../models/User');
const SavedPost = require('../models/SavedPost');
const followService = require('./followService');

class FeedService {
  // Get Instagram-like feed with private/public modes
  async getFeed(userEmail, page = 1, limitNum = 10, feedMode = 'public') {
    try {
      const skip = (page - 1) * limitNum;
      let statuses = [];

      if (feedMode === 'private') {
        // PRIVATE FEED - Only posts from users you follow
        const followingList = await followService.getFollowingList(userEmail);
        followingList.push(userEmail); // Include own posts
        
        statuses = await Status.find({
          userEmail: { $in: followingList },
          postType: 'feed', // Only show feed posts, not status updates
          // Feed posts are permanent, no expiration filter needed
      })
          .sort({ createdAt: -1 })
        .skip(skip)
          .limit(limitNum)
          .lean();
      } else {
        // PUBLIC FEED - Mix of followed users + random posts
        const followingList = await followService.getFollowingList(userEmail);
        followingList.push(userEmail); // Include own posts
        
        // Get posts from followed users
        const followedStatuses = await Status.find({
          userEmail: { $in: followingList },
          postType: 'feed', // Only show feed posts, not status updates
          // Feed posts are permanent, no expiration filter needed
        })
          .sort({ createdAt: -1 })
          .lean();

        // Get random posts from other users (excluding followed)
        const randomStatuses = await Status.find({
          userEmail: { $nin: followingList },
          postType: 'feed', // Only show feed posts, not status updates
          // Feed posts are permanent, no expiration filter needed
        })
          .sort({ createdAt: -1 })
          .limit(Math.max(limitNum - followedStatuses.length, 0))
        .lean();

        // Mix followed and random posts (followed first, then random)
        statuses = [...followedStatuses, ...randomStatuses]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(skip, skip + limitNum);
      }

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

      // Filter posts based on privacy settings
      const visibleStatuses = [];
      for (const status of statuses) {
        const canView = await followService.canViewPosts(userEmail, status.userEmail);
        if (canView) {
          visibleStatuses.push(status);
        }
      }

      // Get all saved posts for this user in one query
      const statusIds = visibleStatuses.map(s => s._id);
      const savedPosts = await SavedPost.find({
        userEmail,
        statusId: { $in: statusIds },
      }).lean();
      const savedPostIds = new Set(savedPosts.map(sp => sp.statusId.toString()));

      // Combine status with file info, user info, and interaction data
      const feedItems = visibleStatuses.map(status => {
        const file = fileMap[status.fileId];
        const user = userMap[status.userEmail] || {
          name: status.userEmail.split('@')[0],
          email: status.userEmail,
        };
        
        const isLiked = status.likes.some(like => like.userEmail === userEmail);
        const isViewed = status.viewers.some(v => v.viewerEmail === userEmail);
        const isSaved = savedPostIds.has(status._id.toString());
        
        return {
          statusId: status._id.toString(),
          userEmail: status.userEmail,
          userName: user.name,
          fileId: status.fileId,
          statusType: status.statusType,
          statusUrl: file ? `/api/files/view/${file.fileId}` : null,
          caption: status.caption || '',
          likesCount: status.likes.length,
          commentsCount: status.comments.length,
          viewersCount: status.viewers.length,
          isLiked,
          isViewed,
          isSaved,
          createdAt: status.createdAt,
          statusTime: this.getTimeAgo(status.createdAt),
        };
      });

      return {
        feed: feedItems,
        hasMore: feedItems.length === limitNum,
        page,
        total: feedItems.length,
        feedMode,
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
  async addComment(statusId, userEmail, comment, replyToCommentId = null) {
    try {
      if (!comment || comment.trim().length === 0) {
        throw new Error('Comment cannot be empty');
      }

      const status = await Status.findById(statusId);
      if (!status) {
        throw new Error('Status not found');
      }

      // If replying to a comment
      if (replyToCommentId) {
        const commentIndex = status.comments.findIndex(
          c => c._id.toString() === replyToCommentId
        );
        if (commentIndex === -1) {
          throw new Error('Comment not found');
        }

        // Add reply
        status.comments[commentIndex].replies.push({
          userEmail,
          reply: comment.trim(),
          repliedAt: new Date(),
          likes: [],
        });

        await status.save();
        
        // Get user info for the reply
        const user = await User.findOne({ email: userEmail }).lean();
        const replyData = status.comments[commentIndex].replies[status.comments[commentIndex].replies.length - 1];
        
        return {
          replyId: replyData._id.toString(),
          commentId: replyToCommentId,
          userEmail: replyData.userEmail,
          userName: user?.name || userEmail.split('@')[0],
          reply: replyData.reply,
          repliedAt: replyData.repliedAt,
          likesCount: 0,
          isReply: true,
        };
      } else {
        // Add new comment
        status.comments.push({
          userEmail,
          comment: comment.trim(),
          commentedAt: new Date(),
          isPinned: false,
          likes: [],
          replies: [],
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
          likesCount: 0,
          repliesCount: 0,
          isPinned: false,
          commentsCount: status.comments.length,
          isReply: false,
        };
      }
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

      // Get user info for all commenters and repliers
      const allUserEmails = new Set();
      status.comments.forEach(c => {
        allUserEmails.add(c.userEmail);
        if (c.replies && Array.isArray(c.replies)) {
          c.replies.forEach(r => allUserEmails.add(r.userEmail));
        }
      });
      
      const users = await User.find({ email: { $in: Array.from(allUserEmails) } }).lean();
      const userMap = {};
      users.forEach(user => {
        userMap[user.email] = user.name || user.email.split('@')[0];
      });

      // Format comments with user names, replies, likes, and pin status
      const comments = status.comments.map(comment => {
        const isLiked = comment.likes?.some(like => like.userEmail === userEmail) || false;
        
        const replies = (comment.replies || []).map(reply => {
          const isReplyLiked = reply.likes?.some(like => like.userEmail === userEmail) || false;
          return {
            replyId: reply._id.toString(),
            userEmail: reply.userEmail,
            userName: userMap[reply.userEmail] || reply.userEmail.split('@')[0],
            reply: reply.reply,
            repliedAt: reply.repliedAt,
            likesCount: reply.likes?.length || 0,
            isLiked: isReplyLiked,
            isOwnReply: reply.userEmail === userEmail,
          };
        });

        return {
          commentId: comment._id.toString(),
          userEmail: comment.userEmail,
          userName: userMap[comment.userEmail] || comment.userEmail.split('@')[0],
          comment: comment.comment,
          commentedAt: comment.commentedAt,
          isOwnComment: comment.userEmail === userEmail,
          isPinned: comment.isPinned || false,
          pinnedAt: comment.pinnedAt || null,
          likesCount: comment.likes?.length || 0,
          isLiked,
          repliesCount: replies.length,
          replies,
        };
      });

      // Sort: pinned first, then by date
      const sortedComments = comments.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(a.commentedAt) - new Date(b.commentedAt);
      });

      return sortedComments;
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  // Toggle like on a comment or reply
  async toggleCommentLike(statusId, commentId, userEmail, isReply = false, replyId = null) {
    try {
      const status = await Status.findById(statusId);
      if (!status) {
        throw new Error('Status not found');
      }

      const commentIndex = status.comments.findIndex(
        c => c._id.toString() === commentId
      );
      if (commentIndex === -1) {
        throw new Error('Comment not found');
      }

      if (isReply && replyId) {
        // Toggle like on reply
        const replyIndex = status.comments[commentIndex].replies.findIndex(
          r => r._id.toString() === replyId
        );
        if (replyIndex === -1) {
          throw new Error('Reply not found');
        }

        const reply = status.comments[commentIndex].replies[replyIndex];
        const likeIndex = reply.likes.findIndex(like => like.userEmail === userEmail);
        
        if (likeIndex > -1) {
          reply.likes.splice(likeIndex, 1);
        } else {
          reply.likes.push({
            userEmail,
            likedAt: new Date(),
          });
        }

        await status.save();
        
        return {
          isLiked: likeIndex === -1,
          likesCount: reply.likes.length,
        };
      } else {
        // Toggle like on comment
        const comment = status.comments[commentIndex];
        const likeIndex = comment.likes.findIndex(like => like.userEmail === userEmail);
        
        if (likeIndex > -1) {
          comment.likes.splice(likeIndex, 1);
        } else {
          comment.likes.push({
            userEmail,
            likedAt: new Date(),
          });
        }

        await status.save();
        
        return {
          isLiked: likeIndex === -1,
          likesCount: comment.likes.length,
        };
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  }

  // Pin/unpin a comment (only post owner can pin)
  async togglePinComment(statusId, commentId, userEmail) {
    try {
      const status = await Status.findById(statusId);
      if (!status) {
        throw new Error('Status not found');
      }

      // Only post owner can pin comments
      if (status.userEmail !== userEmail) {
        throw new Error('Unauthorized: Only post owner can pin comments');
      }

      const commentIndex = status.comments.findIndex(
        c => c._id.toString() === commentId
      );
      if (commentIndex === -1) {
        throw new Error('Comment not found');
      }

      const comment = status.comments[commentIndex];
      comment.isPinned = !comment.isPinned;
      comment.pinnedAt = comment.isPinned ? new Date() : null;

      await status.save();
      
      return {
        isPinned: comment.isPinned,
        pinnedAt: comment.pinnedAt,
      };
    } catch (error) {
      console.error('Error toggling pin:', error);
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

  // Delete a status/post
  async deleteStatus(statusId, userEmail) {
    try {
      const status = await Status.findById(statusId);
      if (!status) {
        throw new Error('Status not found');
      }

      // Only owner can delete their own post
      if (status.userEmail !== userEmail) {
        throw new Error('Unauthorized - You can only delete your own posts');
      }

      // Delete the associated file
      if (status.fileId) {
        const file = await File.findOne({ fileId: status.fileId });
        if (file && file.filePath) {
          const fs = require('fs');
          try {
            if (fs.existsSync(file.filePath)) {
              fs.unlinkSync(file.filePath);
            }
          } catch (fileError) {
            console.error('Error deleting file:', fileError);
            // Continue with status deletion even if file deletion fails
          }
        }
        // Delete file record from database
        await File.deleteOne({ fileId: status.fileId });
      }

      // Delete the status
      await Status.deleteOne({ _id: statusId });

      return {
        success: true,
        statusId: statusId.toString(),
      };
    } catch (error) {
      console.error('Error deleting status:', error);
      throw error;
    }
  }

  // Save/Unsave a post
  async toggleSavePost(statusId, userEmail) {
    try {
      const status = await Status.findById(statusId);
      if (!status) {
        throw new Error('Status not found');
      }

      // Check if already saved
      const existingSave = await SavedPost.findOne({ userEmail, statusId });
      
      if (existingSave) {
        // Unsave
        await SavedPost.deleteOne({ _id: existingSave._id });
        return {
          isSaved: false,
        };
      } else {
        // Save
        const savedPost = new SavedPost({
          userEmail,
          statusId,
        });
        await savedPost.save();
        return {
          isSaved: true,
        };
      }
    } catch (error) {
      console.error('Error toggling save post:', error);
      throw error;
    }
  }

  // Check if post is saved
  async isPostSaved(statusId, userEmail) {
    try {
      const savedPost = await SavedPost.findOne({ userEmail, statusId });
      return !!savedPost;
    } catch (error) {
      console.error('Error checking if post is saved:', error);
      return false;
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

