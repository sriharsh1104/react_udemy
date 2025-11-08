const userProfileService = require('../services/userProfileService');
const userService = require('../services/userService');

class ProfileController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const email = await userService.getUserByToken(token);
      if (!email) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      const profile = await userProfileService.getProfileByEmail(email);
      
      if (!profile) {
        // Create default profile if doesn't exist
        const newProfile = await userProfileService.createOrUpdateProfile(email, {});
        const isComplete = await userProfileService.isProfileComplete(email);
        return res.status(200).json({
          success: true,
          message: 'Profile retrieved successfully',
          profile: { ...newProfile, isProfileComplete: isComplete },
        });
      }

      const isComplete = await userProfileService.isProfileComplete(email);
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        profile: { ...profile, isProfileComplete: isComplete },
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Get contact profile by email
  async getContactProfile(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { email } = req.params;
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const profile = await userProfileService.getProfileByEmail(email);
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
        });
      }

      // Return profile with phone numbers (but exclude sensitive data)
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        profile: {
          email: profile.email,
          name: profile.name,
          phoneNumbers: profile.phoneNumbers || [],
          age: profile.age,
        },
      });
    } catch (error) {
      console.error('Error in getContactProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { name, age, phoneNumbers } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const email = await userService.getUserByToken(token);
      if (!email) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      // Validate phone numbers (max 2)
      if (phoneNumbers && phoneNumbers.length > 2) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 2 phone numbers allowed',
        });
      }

      // Validate phone numbers format
      if (phoneNumbers) {
        for (const phone of phoneNumbers) {
          if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
            return res.status(400).json({
              success: false,
              message: 'Invalid phone number format',
            });
          }
        }
      }

      try {
        const profile = await userProfileService.createOrUpdateProfile(email, {
          name,
          age: age ? parseInt(age) : null,
          phoneNumbers: phoneNumbers || [],
        });

        const isComplete = await userProfileService.isProfileComplete(email);

        res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
          profile: { ...profile, isProfileComplete: isComplete },
        });
      } catch (profileError) {
        // Handle validation errors from userProfileService
        if (profileError.message.includes('Duplicate phone numbers') || 
            profileError.message.includes('already registered')) {
          return res.status(400).json({
            success: false,
            message: profileError.message,
          });
        }
        throw profileError; // Re-throw if it's a different error
      }
    } catch (error) {
      console.error('Error in updateProfile:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }
}

module.exports = new ProfileController();

