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
    required: true,
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
});

// Compound index for efficient querying
MessageSchema.index({ roomId: 1, timestamp: 1 });

module.exports = mongoose.model('Message', MessageSchema);

