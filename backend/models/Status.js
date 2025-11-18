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
      // Status expires after 24 hours
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    },
    index: { expireAfterSeconds: 0 },
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

module.exports = mongoose.model('Status', StatusSchema);

