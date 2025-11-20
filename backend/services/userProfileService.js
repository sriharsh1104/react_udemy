const User = require('../models/User');

class UserProfileService {
  // Generate unique referral code
  async generateReferralCode() {
    const crypto = require('crypto');
    let referralCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      referralCode = crypto.randomBytes(6).toString('hex').toUpperCase();
      const existingUser = await User.findOne({ referralCode });
      if (!existingUser) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      // Fallback: use timestamp + random
      referralCode = `REF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
    
    return referralCode;
  }

  // Create or update user profile
  async createOrUpdateProfile(email, profileData) {
    try {
      // Check if user exists
      const existingUser = await User.findOne({ email });
      const isNewUser = !existingUser;
      
      const updateData = {
        email,
        updatedAt: new Date(),
      };
      
      // Generate referral code for new users or if existing user doesn't have one
      if (isNewUser || !existingUser?.referralCode) {
        updateData.referralCode = await this.generateReferralCode();
      }
      
      // Only update fields that are provided
      if (profileData.name !== undefined) {
        updateData.name = profileData.name || '';
      }
      if (profileData.age !== undefined) {
        updateData.age = profileData.age || null;
      }
      if (profileData.profilePicture !== undefined) {
        updateData.profilePicture = profileData.profilePicture || null;
      }
      if (profileData.phoneNumbers !== undefined) {
        // Normalize phone numbers (remove spaces, +, etc.)
        const normalizedPhones = profileData.phoneNumbers
          .filter(p => p && p.trim())
          .map(p => p.replace(/[\s\+\-\(\)]/g, '').trim());
        
        // Check for duplicates within same user's phone numbers
        const uniquePhones = [...new Set(normalizedPhones)];
        if (uniquePhones.length !== normalizedPhones.length) {
          throw new Error('Duplicate phone numbers are not allowed in your profile');
        }
        
        // Check if any phone number is already used by another user
        for (const phone of uniquePhones) {
          const existingUser = await User.findOne({
            phoneNumbers: phone,
            email: { $ne: email }, // Exclude current user
          });
          
          if (existingUser) {
            throw new Error(`Phone number ${phone} is already registered with another user`);
          }
        }
        
        updateData.phoneNumbers = uniquePhones;
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
      
      const profile = await User.findOne({ email }).select('-password'); // Exclude password
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
      // Normalize phone number for search
      const normalizedPhone = phone.replace(/[\s\+\-\(\)]/g, '').trim();
      const user = await User.findOne({ phoneNumbers: normalizedPhone });
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
      const profiles = await User.find({}).select('-password'); // Exclude password
      return profiles.map(p => p.toObject());
    } catch (error) {
      console.error('Error getting all profiles:', error);
      return [];
    }
  }

  // Update password
  async updatePassword(email, hashedPassword) {
    try {
      const user = await User.findOneAndUpdate(
        { email },
        { password: hashedPassword, updatedAt: new Date() },
        { new: true }
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user.toObject();
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}

module.exports = new UserProfileService();
