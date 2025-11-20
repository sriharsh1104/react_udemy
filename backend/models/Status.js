const mongoose = require('mongoose');

const StatusSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
  },
  fileId: {
    type: String,
    required: true,
  },
  statusType: {
    type: String,
    required: true,
    enum: ['image', 'video'],
  },
  postType: {
    type: String,
    required: true,
    enum: ['status', 'feed'],
    default: 'status',
    index: true,
  },
  viewers: [{
    viewerEmail: {
      type: String,
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Only status posts expire after 24 hours, feed posts are permanent
      if (this.postType === 'status') {
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
      // Feed posts don't expire - set to null
      // MongoDB TTL index only deletes documents where expiresAt exists and is in the past
      // So null values won't be deleted
      return null;
    },
  },
  caption: {
    type: String,
    default: '',
  },
  tags: [{
    type: String,
  }],
  likes: [{
    userEmail: {
      type: String,
      required: true,
    },
    likedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  comments: [{
    userEmail: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    commentedAt: {
      type: Date,
      default: Date.now,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
    likes: [{
      userEmail: {
        type: String,
        required: true,
      },
      likedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    replies: [{
      userEmail: {
        type: String,
        required: true,
      },
      reply: {
        type: String,
        required: true,
      },
      repliedAt: {
        type: Date,
        default: Date.now,
      },
      likes: [{
        userEmail: {
          type: String,
          required: true,
        },
        likedAt: {
          type: Date,
          default: Date.now,
        },
      }],
    }],
  }],
});

// Index for finding statuses by user
StatusSchema.index({ userEmail: 1, createdAt: -1 });

// Index for finding unviewed statuses
StatusSchema.index({ userEmail: 1, 'viewers.viewerEmail': 1 });

// TTL index for auto-deleting expired status posts (only status posts, not feed posts)
// This index only affects documents where expiresAt exists and is in the past
// Feed posts have expiresAt: null, so they won't be deleted
StatusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Status', StatusSchema);

