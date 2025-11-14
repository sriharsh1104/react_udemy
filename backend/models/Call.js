const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  callerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  receiverEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: null, // null for group calls
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null, // null for private calls
  },
  type: {
    type: String,
    enum: ['audio', 'video'],
    required: true,
  },
  direction: {
    type: String,
    enum: ['outgoing', 'incoming'],
    required: true,
  },
  status: {
    type: String,
    enum: ['ringing', 'connecting', 'completed', 'missed', 'declined', 'busy', 'failed', 'cancelled'],
    default: 'ringing',
  },
  duration: {
    type: Number, // in seconds
    default: 0,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  endedAt: {
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
  // Additional metadata
  callerName: {
    type: String,
    default: '',
  },
  receiverName: {
    type: String,
    default: '',
  },
  groupName: {
    type: String,
    default: '',
  },
  // WebRTC session info
  sessionId: {
    type: String,
    default: null,
  },
  // Network/device info
  callerDeviceInfo: {
    type: String,
    default: null,
  },
  receiverDeviceInfo: {
    type: String,
    default: null,
  },
});

// Indexes for efficient queries
CallSchema.index({ callerEmail: 1, createdAt: -1 });
CallSchema.index({ receiverEmail: 1, createdAt: -1 });
CallSchema.index({ groupId: 1, createdAt: -1 });
CallSchema.index({ status: 1 });
CallSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Call', CallSchema);

