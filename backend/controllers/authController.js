const otpService = require('../services/otpService');
const userService = require('../services/userService');
const userProfileService = require('../services/userProfileService');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

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
          const userInfo = await userProfileService.findUserByIdentifier(identifier);
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
        
        // Store user session in MongoDB
        await userService.addUserSession(userEmail, token);

        // Get user profile (if exists, otherwise null)
        const profile = await userProfileService.getProfileByEmail(userEmail);
        const isProfileComplete = profile ? await userProfileService.isProfileComplete(userEmail) : false;

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

  // Login with password
  async loginWithPassword(req, res) {
    try {
      const { email, phone, password } = req.body;
      const identifier = email || phone;

      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email/Phone and password are required',
        });
      }

      // Find user by email or phone
      let userEmail = identifier;
      let user;

      if (identifier.includes('@')) {
        // Email login
        user = await User.findOne({ email: identifier.toLowerCase() });
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
          });
        }
        userEmail = user.email;
      } else {
        // Phone login
        const userInfo = await userProfileService.findUserByIdentifier(identifier);
        if (!userInfo || !userInfo.email) {
          return res.status(401).json({
            success: false,
            message: 'Invalid phone number or password',
          });
        }
        userEmail = userInfo.email;
        user = await User.findOne({ email: userEmail });
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Invalid phone number or password',
          });
        }
      }

      // Check if password is set
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: 'Password not set. Please use OTP login or set password first.',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email/phone or password',
        });
      }

      // Generate token
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store user session
      await userService.addUserSession(userEmail, token);

      // Get user profile
      const profile = await userProfileService.getProfileByEmail(userEmail);
      const isProfileComplete = profile ? await userProfileService.isProfileComplete(userEmail) : false;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        email: userEmail,
        profile: profile || null,
        isProfileComplete,
      });
    } catch (error) {
      console.error('Error in loginWithPassword:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Send OTP for password reset
  async forgetPassword(req, res) {
    try {
      const { email, phone } = req.body;
      const identifier = email || phone;

      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email or phone number',
        });
      }

      // Check if user exists
      let userEmail = identifier;
      if (!identifier.includes('@')) {
        // Phone number
        const userInfo = await userProfileService.findUserByIdentifier(identifier);
        if (!userInfo || !userInfo.email) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }
        userEmail = userInfo.email;
      } else {
        // Email
        const user = await User.findOne({ email: identifier.toLowerCase() });
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }
      }

      // Check if password is set
      const user = await User.findOne({ email: userEmail }).select('password');
      if (!user || !user.password) {
        return res.status(400).json({
          success: false,
          message: 'Password not set. Please use OTP login.',
        });
      }

      // Send OTP for password reset
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
      console.error('Error in forgetPassword:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Reset password with OTP
  async resetPassword(req, res) {
    try {
      const { email, phone, otp, newPassword } = req.body;
      const identifier = email || phone;

      if (!identifier || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Email/Phone, OTP, and new password are required',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
      }

      // Verify OTP
      const result = otpService.verifyOTP(identifier, otp);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      // Find user
      let userEmail = identifier;
      if (!identifier.includes('@')) {
        const userInfo = await userProfileService.findUserByIdentifier(identifier);
        if (!userInfo || !userInfo.email) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }
        userEmail = userInfo.email;
      }

      // Check if user exists and has password set
      const user = await User.findOne({ email: userEmail }).select('password');
      if (!user || !user.password) {
        return res.status(400).json({
          success: false,
          message: 'Password not set. Please use OTP login.',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await userProfileService.updatePassword(userEmail, hashedPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      console.error('Error in resetPassword:', error);
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

      // Remove user session from MongoDB
      await userService.removeSession(token);

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

