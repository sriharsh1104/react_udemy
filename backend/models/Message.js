const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  senderEmail: {
    type: String,
    required: true,
    index: true,
  },
  receiverEmail: {
    type: String,
    required: false, // Optional for group messages
    index: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false, // Optional for private messages
    index: true,
  },
  messageType: {
    type: String,
    enum: ['private', 'group'],
    default: 'private',
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  readBy: [{
    type: String, // Array of emails who have read the message
  }],
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
    index: true,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
});

// Compound index for efficient querying
MessageSchema.index({ roomId: 1, timestamp: 1 });
MessageSchema.index({ groupId: 1, timestamp: 1 });

module.exports = mongoose.model('Message', MessageSchema);

