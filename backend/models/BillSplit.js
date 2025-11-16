const mongoose = require('mongoose');

const BillSplitSchema = new mongoose.Schema({
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
    index: true,
  },
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false,
    index: true,
  },
  createdBy: {
    type: String, // Email of user who created the bill
    required: true,
    index: true,
  },
  billName: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR', // Default currency
  },
  splits: [{
    userEmail: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      default: null, // Percentage if split by percentage
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  }],
  status: {
    type: String,
    enum: ['pending', 'partially_paid', 'fully_paid', 'cancelled'],
    default: 'pending',
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
BillSplitSchema.index({ roomId: 1, createdAt: -1 });
BillSplitSchema.index({ groupId: 1, createdAt: -1 });
BillSplitSchema.index({ createdBy: 1, status: 1 });
BillSplitSchema.index({ 'splits.userEmail': 1, status: 1 });

module.exports = mongoose.model('BillSplit', BillSplitSchema);

