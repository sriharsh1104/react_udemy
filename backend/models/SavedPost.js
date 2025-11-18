const mongoose = require('mongoose');

const SavedPostSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
  },
  statusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Status',
    required: true,
    index: true,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to prevent duplicate saves
SavedPostSchema.index({ userEmail: 1, statusId: 1 }, { unique: true });

module.exports = mongoose.model('SavedPost', SavedPostSchema);

