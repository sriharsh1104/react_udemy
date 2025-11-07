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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure unique contact pairs
ContactSchema.index({ userEmail: 1, contactEmail: 1 }, { unique: true });

module.exports = mongoose.model('Contact', ContactSchema);

