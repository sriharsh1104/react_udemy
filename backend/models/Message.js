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
  isPinned: {
    type: Boolean,
    default: false,
    index: true,
  },
  pinnedAt: {
    type: Date,
    default: null,
  },
  pinnedBy: {
    type: String, // Email of user who pinned the message
    default: null,
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  replyToMessage: {
    type: String, // Original message text (for quick reference)
    default: null,
  },
  replyToSender: {
    type: String, // Email of original message sender
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  editedAt: {
    type: Date,
    default: null,
  },
  editedMessage: {
    type: String, // Store edited message text
    default: null,
  },
  isCallMessage: {
    type: Boolean,
    default: false,
    index: true,
  },
  callRecord: {
    type: {
      sessionId: String,
      callerEmail: String,
      receiverEmail: String,
      type: String, // 'audio' or 'video'
      direction: String, // 'outgoing' or 'incoming'
      status: String, // 'completed', 'missed', 'declined', 'cancelled'
      duration: Number, // in seconds
      startedAt: Date,
      endedAt: Date,
    },
    // Optional field - no default or required needed
  },
  isBillSplit: {
    type: Boolean,
    default: false,
    index: true,
  },
  billSplitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillSplit',
    default: null,
  },
  isReminder: {
    type: Boolean,
    default: false,
    index: true,
  },
  isStreak: {
    type: Boolean,
    default: false,
    index: true,
  },
});

// Compound indexes for efficient querying
MessageSchema.index({ roomId: 1, timestamp: -1 }); // For paginated message retrieval
MessageSchema.index({ groupId: 1, timestamp: -1 }); // For group message pagination
MessageSchema.index({ groupId: 1, isPinned: 1 }); // For querying pinned messages
MessageSchema.index({ senderEmail: 1, timestamp: -1 }); // For user message history
MessageSchema.index({ receiverEmail: 1, read: 1, timestamp: -1 }); // For unread message queries
MessageSchema.index({ receiverEmail: 1, senderEmail: 1, read: 1 }); // For unread count queries
MessageSchema.index({ timestamp: -1 }); // For feed and general queries
MessageSchema.index({ expiresAt: 1 }); // For status expiration cleanup (if used for messages)

module.exports = mongoose.model('Message', MessageSchema);

