const nodemailer = require('nodemailer');

class OTPService {
  constructor() {
    // Store OTPs temporarily (in production, use Redis or database)
    this.otpStore = new Map();
    this.otpExpiry = 5 * 60 * 1000; // 5 minutes
    this.transporter = null;
  }

  // Get or create transporter (lazy initialization)
  getTransporter() {
    if (!this.transporter) {
      // Email transporter configuration
      // For development, you can use Gmail or any SMTP service
      // For production, use proper email service like SendGrid, AWS SES, etc.
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password',
        },
      });
    }
    return this.transporter;
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP to email or phone
  async sendOTP(identifier, purpose = 'login') {
    try {
      const otp = this.generateOTP();
      const expiryTime = Date.now() + this.otpExpiry;

      // Store OTP with expiry
      this.otpStore.set(identifier, {
        otp,
        expiry: expiryTime,
        purpose, // Store purpose for reference
      });

      // Check if it's email or phone
      if (identifier.includes('@')) {
        // Email OTP
        const hasEmailConfig = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
        
        if (!hasEmailConfig) {
          // Email config not set - log OTP to console for development
          const purposeText = purpose === 'password-reset' ? 'Password Reset' : 'Login';
          console.log(`\n📧 Email OTP for ${purposeText} - ${identifier}: ${otp}\n`);
          console.log('⚠️  Email configuration not set. OTP logged to console for development.');
          console.log('   To enable email sending, set EMAIL_USER and EMAIL_PASS environment variables.');
        } else {
          // Email config is set - try to send email
        const isPasswordReset = purpose === 'password-reset';
        const subject = isPasswordReset 
          ? 'Password Reset OTP - Chat App'
          : 'Your OTP for Chat App Login';
        const title = isPasswordReset 
          ? 'Chat App - Password Reset'
          : 'Chat App - Login OTP';
        const description = isPasswordReset
          ? 'Your OTP to reset your password is:'
          : 'Your OTP for login is:';
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
          to: identifier,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366F1;">${title}</h2>
              <p>${description}</p>
              <div style="background-color: #1E293B; color: #F1F5F9; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 20px 0;">
                ${otp}
              </div>
              <p style="color: #64748B; font-size: 12px;">This OTP will expire in 5 minutes.</p>
              <p style="color: #64748B; font-size: 12px;">If you didn't request this ${isPasswordReset ? 'password reset' : 'OTP'}, please ignore this email.</p>
            </div>
          `,
        };

          try {
        await this.getTransporter().sendMail(mailOptions);
          } catch (emailError) {
            // Email sending failed - log OTP to console as fallback
            const purposeText = purpose === 'password-reset' ? 'Password Reset' : 'Login';
            console.error('Error sending email:', emailError.message);
            console.log(`\n📧 Email OTP for ${purposeText} - ${identifier}: ${otp}\n`);
            console.log('⚠️  Email sending failed. OTP logged to console.');
            
            // Check if it's an authentication error
            if (emailError.code === 'EAUTH') {
              console.error('Email authentication failed. Please check EMAIL_USER and EMAIL_PASS.');
            }
          }
        }
      } else {
        // Phone OTP - For now, log it (in production, use SMS service like Twilio)
        const purposeText = purpose === 'password-reset' ? 'Password Reset' : 'Login';
        console.log(`\n📱 SMS OTP for ${purposeText} - ${identifier}: ${otp}\n`);
        // TODO: Integrate SMS service (Twilio, AWS SNS, etc.)
        // await this.sendSMS(identifier, otp);
      }
      
      // Clean up expired OTPs
      this.cleanupExpiredOTPs();

      const purposeMessage = purpose === 'password-reset' 
        ? 'Password reset OTP sent to your email'
        : 'OTP sent to your email';
      const phoneMessage = purpose === 'password-reset'
        ? 'Password reset OTP sent to your phone (check console for development)'
        : 'OTP sent to your phone (check console for development)';

      return { 
        success: true, 
        message: identifier.includes('@') ? purposeMessage : phoneMessage 
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      console.error('Email config check:', {
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPass: !!process.env.EMAIL_PASS,
        emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'not set',
      });
      
      // Return more specific error message
      if (error.code === 'EAUTH') {
        return { 
          success: false, 
          message: 'Email configuration error. Please contact support or check server logs for OTP.' 
        };
      }
      
      return { 
        success: false, 
        message: 'Failed to send OTP. Please try again or check server logs.' 
      };
    }
  }

  // Verify OTP for email or phone
  verifyOTP(identifier, otp) {
    const storedData = this.otpStore.get(identifier);

    if (!storedData) {
      return { success: false, message: 'OTP not found. Please request a new OTP.' };
    }

    if (Date.now() > storedData.expiry) {
      this.otpStore.delete(identifier);
      return { success: false, message: 'OTP has expired. Please request a new OTP.' };
    }

    if (storedData.otp !== otp) {
      return { success: false, message: 'Invalid OTP. Please try again.' };
    }

    // OTP verified successfully, remove it
    this.otpStore.delete(identifier);
    return { success: true, message: 'OTP verified successfully' };
  }

  // Cleanup expired OTPs
  cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [email, data] of this.otpStore.entries()) {
      if (now > data.expiry) {
        this.otpStore.delete(email);
      }
    }
  }
}

module.exports = new OTPService();

