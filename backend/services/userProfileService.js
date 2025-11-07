const User = require('../models/User');

class UserProfileService {
  // Create or update user profile
  async createOrUpdateProfile(email, profileData) {
    try {
      const updateData = {
        email,
        updatedAt: new Date(),
      };
      
      // Only update fields that are provided
      if (profileData.name !== undefined) {
        updateData.name = profileData.name || '';
      }
      if (profileData.age !== undefined) {
        updateData.age = profileData.age || null;
      }
      if (profileData.phoneNumbers !== undefined) {
        updateData.phoneNumbers = profileData.phoneNumbers || [];
      }
      
      const profile = await User.findOneAndUpdate(
        { email },
        updateData,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
      
      if (!profile) {
        throw new Error('Failed to create/update profile');
      }
      
      return profile.toObject();
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      throw error;
    }
  }

  // Get user profile by email
  async getProfileByEmail(email) {
    try {
      if (!email) {
        console.error('getProfileByEmail: email is required');
        return null;
      }
      
      // Check if mongoose is connected
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.error('MongoDB not connected. ReadyState:', mongoose.connection.readyState);
        throw new Error('Database connection not available');
      }
      
      const profile = await User.findOne({ email });
      return profile ? profile.toObject() : null;
    } catch (error) {
      console.error('Error getting profile:', error);
      console.error('Error details:', error.message);
      throw error; // Re-throw to let controller handle it
    }
  }

  // Get email by phone number
  async getEmailByPhone(phone) {
    try {
      const user = await User.findOne({ phoneNumbers: phone.trim() });
      return user ? user.email : null;
    } catch (error) {
      console.error('Error getting email by phone:', error);
      return null;
    }
  }

  // Check if identifier (email or phone) exists
  async findUserByIdentifier(identifier) {
    try {
      // Check if it's an email
      if (identifier.includes('@')) {
        const profile = await this.getProfileByEmail(identifier);
        return {
          type: 'email',
          email: identifier,
          profile,
        };
      }
      
      // Check if it's a phone number
      const email = await this.getEmailByPhone(identifier);
      if (email) {
        const profile = await this.getProfileByEmail(email);
        return {
          type: 'phone',
          email,
          phone: identifier,
          profile,
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding user by identifier:', error);
      return null;
    }
  }

  // Check if profile is complete (has name and at least one phone number)
  async isProfileComplete(email) {
    try {
      const profile = await this.getProfileByEmail(email);
      if (!profile) return false;
      
      return !!(profile.name && profile.name.trim() && 
                profile.phoneNumbers && profile.phoneNumbers.length > 0);
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      return false;
    }
  }

  // Get all profiles (for debugging)
  async getAllProfiles() {
    try {
      const profiles = await User.find({});
      return profiles.map(p => p.toObject());
    } catch (error) {
      console.error('Error getting all profiles:', error);
      return [];
    }
  }
}

module.exports = new UserProfileService();
