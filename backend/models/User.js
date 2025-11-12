const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    default: '',
  },
  age: {
    type: Number,
    default: null,
  },
  phoneNumbers: [{
    type: String,
  }],
  password: {
    type: String,
    default: null, // null means password not set
  },
  offlineMode: {
    type: Boolean,
    default: false, // false means online mode (default)
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

// Index for phone number search
UserSchema.index({ phoneNumbers: 1 });

module.exports = mongoose.model('User', UserSchema);

