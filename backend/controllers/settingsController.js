const userService = require('../services/userService');
const userProfileService = require('../services/userProfileService');
const bcrypt = require('bcryptjs');

class SettingsController {
  // Set password (first time)
  async setPassword(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { password } = req.body;

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

      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
      }

      // Check if password already exists (need to check with password field)
      const User = require('../models/User');
      const user = await User.findOne({ email: userEmail }).select('password');
      if (user && user.password) {
        return res.status(400).json({
          success: false,
          message: 'Password already set. Use change password instead.',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user with password
      await userProfileService.updatePassword(userEmail, hashedPassword);

      res.status(200).json({
        success: true,
        message: 'Password set successfully',
      });
    } catch (error) {
      console.error('Error in setPassword:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { currentPassword, newPassword } = req.body;

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

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters',
        });
      }

      // Get user with password field
      const User = require('../models/User');
      const user = await User.findOne({ email: userEmail }).select('password');
      if (!user || !user.password) {
        return res.status(400).json({
          success: false,
          message: 'Password not set. Please set password first.',
        });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await userProfileService.updatePassword(userEmail, hashedPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Error in changePassword:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Check if password is set
  async checkPasswordStatus(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

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

      // Check password status (need to query with password field)
      const User = require('../models/User');
      const user = await User.findOne({ email: userEmail }).select('password');
      const hasPassword = !!(user && user.password);

      res.status(200).json({
        success: true,
        hasPassword,
      });
    } catch (error) {
      console.error('Error in checkPasswordStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

module.exports = new SettingsController();

