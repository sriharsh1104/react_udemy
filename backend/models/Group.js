const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  members: [{
    type: String, // Array of email addresses
    required: true,
  }],
  createdBy: {
    type: String, // Email of creator
    required: true,
    index: true,
  },
  favorites: [{
    type: String, // Array of user emails who favorited this group
    index: true,
  }],
  inviteLink: {
    type: String,
    default: null,
    index: true,
  },
  inviteLinkExpiry: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for member search
GroupSchema.index({ members: 1 });

module.exports = mongoose.model('Group', GroupSchema);

