const mongoose = require('mongoose');

const HealthDataSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  steps: {
    type: Number,
    default: 0,
  },
  caloriesBurnt: {
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

// Compound index to ensure one record per user per day
HealthDataSchema.index({ userEmail: 1, date: 1 }, { unique: true });

// Helper method to get today's date at midnight
HealthDataSchema.statics.getTodayDate = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

module.exports = mongoose.model('HealthData', HealthDataSchema);
