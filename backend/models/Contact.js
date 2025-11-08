const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
  },
  contactEmail: {
    type: String,
    required: true,
    index: true,
  },
  isFavorite: {
    type: Boolean,
    default: false,
    index: true,
  },
  isPinned: {
    type: Boolean,
    default: false,
    index: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true,
  },
  isMuted: {
    type: Boolean,
    default: false,
    index: true,
  },
  mutedUntil: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure unique contact pairs
ContactSchema.index({ userEmail: 1, contactEmail: 1 }, { unique: true });

module.exports = mongoose.model('Contact', ContactSchema);

