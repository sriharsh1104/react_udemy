const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
  followerEmail: {
    type: String,
    required: true,
    index: true,
  },
  followingEmail: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'accepted', // For public accounts, default is accepted
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Compound index to ensure unique follow relationships
FollowSchema.index({ followerEmail: 1, followingEmail: 1 }, { unique: true });

module.exports = mongoose.model('Follow', FollowSchema);

