const otpService = require('../services/otpService');
const userService = require('../services/userService');

class AuthController {
  // Send OTP to email
  async sendOTP(req, res) {
    try {
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }

      const result = await otpService.sendOTP(email);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'OTP sent to your email',
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
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email and OTP are required',
        });
      }

      const result = otpService.verifyOTP(email, otp);

      if (result.success) {
        // Generate a simple token (in production, use JWT)
        const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store user session (in production, use proper session management)
        userService.addUserSession(email, token);

        res.status(200).json({
          success: true,
          message: 'Login successful',
          token,
          email,
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
}

module.exports = new AuthController();

