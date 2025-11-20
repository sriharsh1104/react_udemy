const mongoose = require('mongoose');

const StreakSchema = new mongoose.Schema({
  user1Email: {
    type: String,
    required: true,
    index: true,
  },
  user2Email: {
    type: String,
    required: true,
    index: true,
  },
  streakCount: {
    type: Number,
    default: 0,
  },
  lastInteractionDate: {
    type: Date,
    default: null,
  },
  // Track who sent the last interaction (to ensure both users interact)
  lastInteractionBy: {
    type: String, // user1Email or user2Email
    default: null,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  // Track if streak is currently active (not broken)
  isActive: {
    type: Boolean,
    default: false,
  },
  // Track consecutive days both users have interacted
  consecutiveDays: {
    type: Number,
    default: 0,
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

// Compound index to ensure unique streak pairs (order-independent)
StreakSchema.index({ user1Email: 1, user2Email: 1 }, { unique: true });

// Index for querying all streaks for a user
StreakSchema.index({ user1Email: 1, isActive: 1 });
StreakSchema.index({ user2Email: 1, isActive: 1 });

// Helper method to get the other user's email
StreakSchema.methods.getOtherUser = function(userEmail) {
  return this.user1Email === userEmail ? this.user2Email : this.user1Email;
};

// Helper method to check if a user is part of this streak
StreakSchema.methods.hasUser = function(userEmail) {
  return this.user1Email === userEmail || this.user2Email === userEmail;
};

module.exports = mongoose.model('Streak', StreakSchema);

