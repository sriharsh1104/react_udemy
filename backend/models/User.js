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
  height: {
    type: Number, // in cm
    default: null,
  },
  weight: {
    type: Number, // in kg
    default: null,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: null,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  phoneNumbers: [{
    type: String,
  }],
  password: {
    type: String,
    default: null, // null means password not set
  },
  googleId: {
    type: String,
    default: null, // Google OAuth ID
    sparse: true,
    index: true,
  },
  offlineMode: {
    type: Boolean,
    default: false, // false means online mode (default)
  },
  isPrivate: {
    type: Boolean,
    default: false, // false means public account (default)
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
    index: true,
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

