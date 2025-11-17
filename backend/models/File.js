const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
    enum: ['image', 'video', 'audio', 'pdf'],
  },
  mimeType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: String,
    required: true,
    index: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  downloaded: {
    type: Boolean,
    default: false,
  },
  downloadedAt: {
    type: Date,
  },
  downloadedBy: {
    type: String,
  },
});

// Don't auto-delete files - keep them on server
// Removed TTL index - files will stay on server

module.exports = mongoose.model('File', FileSchema);

