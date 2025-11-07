const otpService = require('../services/otpService');
const userService = require('../services/userService');
const userProfileService = require('../services/userProfileService');

class AuthController {
  // Send OTP to email or phone
  async sendOTP(req, res) {
    try {
      const { email, phone } = req.body;
      const identifier = email || phone;

      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email or phone number',
        });
      }

      // Validate email format
      if (email && !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }

      // Validate phone format (basic)
      if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number',
        });
      }

      const result = await otpService.sendOTP(identifier);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Error in sendOTP:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Verify OTP and login
  async verifyOTP(req, res) {
    try {
      const { email, phone, otp } = req.body;
      const identifier = email || phone;

      if (!identifier || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email/Phone and OTP are required',
        });
      }

      const result = otpService.verifyOTP(identifier, otp);

      if (result.success) {
        // Find user by identifier (email or phone)
        let userEmail = identifier;
        
        // If phone number, find associated email
        if (!identifier.includes('@')) {
          const userInfo = userProfileService.findUserByIdentifier(identifier);
          if (userInfo && userInfo.email) {
            userEmail = userInfo.email;
          } else {
            // New user with phone number - use phone as identifier
            // Profile will be created when user accesses profile screen
            userEmail = `phone_${identifier}@temp.local`;
          }
        }
        // For email login, use email as is
        // Profile will be created when user accesses profile screen

        // Generate a simple token (in production, use JWT)
        const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store user session
        userService.addUserSession(userEmail, token);

        // Get user profile (if exists, otherwise null)
        const profile = userProfileService.getProfileByEmail(userEmail);
        const isProfileComplete = profile ? userProfileService.isProfileComplete(userEmail) : false;

        res.status(200).json({
          success: true,
          message: 'Login successful',
          token,
          email: userEmail,
          profile: profile || null,
          isProfileComplete,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Error in verifyOTP:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required',
        });
      }

      // Remove user session
      userService.removeSession(token);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Error in logout:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

module.exports = new AuthController();

