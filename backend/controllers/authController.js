const otpService = require('../services/otpService');
const userService = require('../services/userService');
const userProfileService = require('../services/userProfileService');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHelper');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../constants');
const { OAuth2Client } = require('google-auth-library');

class AuthController {
  // Send OTP to email or phone
  async sendOTP(req, res) {
    try {
      const { email, phone } = req.body;
      const identifier = email || phone;

      if (!identifier) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.EMAIL_OR_PHONE_REQUIRED);
      }

      // Validate email format
      if (email && !email.includes('@')) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_EMAIL);
      }

      // Validate phone format (basic)
      if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_PHONE);
      }

      const result = await otpService.sendOTP(identifier);

      if (result.success) {
        return sendSuccess(res, HTTP_STATUS.OK, result.message);
      } else {
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, result.message);
      }
    } catch (error) {
      console.error('Error in sendOTP:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // Verify OTP and login
  async verifyOTP(req, res) {
    try {
      const { email, phone, otp } = req.body;
      const identifier = email || phone;

      if (!identifier || !otp) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email/Phone and OTP are required');
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

        return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGIN_SUCCESSFUL, {
          token,
          email: userEmail,
          profile: profile || null,
          isProfileComplete,
        });
      } else {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, result.message);
      }
    } catch (error) {
      console.error('Error in verifyOTP:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // Login with password
  async loginWithPassword(req, res) {
    try {
      const { email, phone, password } = req.body;
      const identifier = email || phone;

      if (!identifier || !password) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email/Phone and password are required');
      }

      // Find user by email or phone
      let userEmail = identifier;
      let user;

      if (identifier.includes('@')) {
        // Email login
        user = await User.findOne({ email: identifier.toLowerCase() });
        if (!user) {
          return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password');
        }
        userEmail = user.email;
      } else {
        // Phone login
        const userInfo = await userProfileService.findUserByIdentifier(identifier);
        if (!userInfo || !userInfo.email) {
          return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid phone number or password');
        }
        userEmail = userInfo.email;
        user = await User.findOne({ email: userEmail });
        if (!user) {
          return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid phone number or password');
        }
      }

      // Check if password is set
      if (!user.password) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password not set. Please use OTP login or set password first.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid email/phone or password');
      }

      // Generate token
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store user session
      await userService.addUserSession(userEmail, token);

      // Get user profile
      const profile = await userProfileService.getProfileByEmail(userEmail);
      const isProfileComplete = profile ? await userProfileService.isProfileComplete(userEmail) : false;

      return sendSuccess(res, HTTP_STATUS.OK, 'Login successful', {
        token,
        email: userEmail,
        profile: profile || null,
        isProfileComplete,
      });
    } catch (error) {
      console.error('Error in loginWithPassword:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // Send OTP for password reset
  async forgetPassword(req, res) {
    try {
      const { email, phone } = req.body;
      const identifier = email || phone;

      if (!identifier) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.EMAIL_OR_PHONE_REQUIRED);
      }

      // Check if user exists
      let userEmail = identifier;
      if (!identifier.includes('@')) {
        // Phone number
        const userInfo = await userProfileService.findUserByIdentifier(identifier);
        if (!userInfo || !userInfo.email) {
          return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
        }
        userEmail = userInfo.email;
      } else {
        // Email
        const user = await User.findOne({ email: identifier.toLowerCase() });
        if (!user) {
          return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
        }
      }

      // Check if password is set
      const user = await User.findOne({ email: userEmail }).select('password');
      if (!user || !user.password) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password not set. Please use OTP login.');
      }

      // Send OTP for password reset
      const result = await otpService.sendOTP(identifier, 'password-reset');

      if (result.success) {
        return sendSuccess(res, HTTP_STATUS.OK, result.message);
      } else {
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, result.message);
      }
    } catch (error) {
      console.error('Error in forgetPassword:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // Reset password with OTP
  async resetPassword(req, res) {
    try {
      const { email, phone, otp, newPassword } = req.body;
      const identifier = email || phone;

      if (!identifier || !otp || !newPassword) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email/Phone, OTP, and new password are required');
      }

      if (newPassword.length < 6) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password must be at least 6 characters');
      }

      // Verify OTP
      const result = otpService.verifyOTP(identifier, otp);

      if (!result.success) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, result.message);
      }

      // Find user
      let userEmail = identifier;
      if (!identifier.includes('@')) {
        const userInfo = await userProfileService.findUserByIdentifier(identifier);
        if (!userInfo || !userInfo.email) {
          return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
        }
        userEmail = userInfo.email;
      }

      // Check if user exists and has password set
      const user = await User.findOne({ email: userEmail }).select('password');
      if (!user || !user.password) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password not set. Please use OTP login.');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await userProfileService.updatePassword(userEmail, hashedPassword);

      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESSFULLY);
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // Register new user with email and password
  async register(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email and password are required');
      }

      // Validate email format
      if (!email.includes('@') || !email.includes('.')) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_EMAIL);
      }

      // Validate password length
      if (password.length < 6) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password must be at least 6 characters');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique referral code
      const crypto = require('crypto');
      let referralCode;
      let isUnique = false;
      while (!isUnique) {
        referralCode = crypto.randomBytes(6).toString('hex').toUpperCase();
        const existingUser = await User.findOne({ referralCode });
        if (!existingUser) {
          isUnique = true;
        }
      }

      // Create new user
      const newUser = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        referralCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await newUser.save();

      // Generate token
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store user session
      await userService.addUserSession(newUser.email, token);

      // Get user profile (will be null for new user)
      const profile = await userProfileService.getProfileByEmail(newUser.email);
      const isProfileComplete = profile ? await userProfileService.isProfileComplete(newUser.email) : false;

      return sendSuccess(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.REGISTRATION_SUCCESSFUL, {
        token,
        email: newUser.email,
        profile: profile || null,
        isProfileComplete,
      });
    } catch (error) {
      console.error('Error in register:', error);
      
      // Handle duplicate key error (MongoDB unique constraint)
      if (error.code === 11000 || error.message.includes('duplicate')) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED);
      }

      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

      if (!token) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Token is required');
      }

      // Remove user session from MongoDB
      await userService.removeSession(token);

      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGOUT_SUCCESSFUL);
    } catch (error) {
      console.error('Error in logout:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // Google OAuth Login
  async googleLogin(req, res) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Google ID token is required');
      }

      // Get client IDs for Android and Web
      const androidClientId = process.env.GOOGLE_ANDROID_CLIENT_ID;
      const webClientId = process.env.GOOGLE_WEB_CLIENT_ID;
      const webClientSecret = process.env.GOOGLE_WEB_CLIENT_SECRET;

      if (!androidClientId && !webClientId) {
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Google OAuth not configured');
      }

      // Try to verify token with Android client ID first (for Android apps)
      let ticket = null;
      let verifyError = null;

      if (androidClientId) {
        try {
          const androidClient = new OAuth2Client(androidClientId);
          ticket = await androidClient.verifyIdToken({
            idToken: idToken,
            audience: androidClientId,
          });
        } catch (err) {
          verifyError = err;
          // Continue to try web client ID
        }
      }

      // If Android verification failed, try Web client ID (for web apps)
      if (!ticket && webClientId) {
        try {
          const webClient = new OAuth2Client(webClientId, webClientSecret);
          ticket = await webClient.verifyIdToken({
            idToken: idToken,
            audience: webClientId,
          });
        } catch (err) {
          verifyError = err;
        }
      }

      // If both verifications failed
      if (!ticket) {
        console.error('Google token verification failed:', verifyError);
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid Google token');
      }

      const payload = ticket.getPayload();
      const email = payload.email;
      const googleId = payload.sub;
      const name = payload.name;
      const picture = payload.picture;

      if (!email) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email not provided by Google');
      }

      // Check if user exists
      let user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Create new user with Google OAuth
        const crypto = require('crypto');
        let referralCode;
        let isUnique = false;
        while (!isUnique) {
          referralCode = crypto.randomBytes(6).toString('hex').toUpperCase();
          const existingUser = await User.findOne({ referralCode });
          if (!existingUser) {
            isUnique = true;
          }
        }

        user = new User({
          email: email.toLowerCase(),
          googleId: googleId,
          referralCode,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await user.save();

        // Create profile with Google data
        await userProfileService.createOrUpdateProfile(email, {
          name: name,
          profilePicture: picture,
        });
      } else {
        // Update existing user with Google ID if not already set
        if (!user.googleId) {
          user.googleId = googleId;
          user.updatedAt = new Date();
          await user.save();
        }
      }

      // Generate token
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store user session
      await userService.addUserSession(user.email, token);

      // Get user profile
      const profile = await userProfileService.getProfileByEmail(user.email);
      const isProfileComplete = profile ? await userProfileService.isProfileComplete(user.email) : false;

      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGIN_SUCCESSFUL, {
        token,
        email: user.email,
        profile: profile || null,
        isProfileComplete,
      });
    } catch (error) {
      console.error('Error in googleLogin:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new AuthController();

