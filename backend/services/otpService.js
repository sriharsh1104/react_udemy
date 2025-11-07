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

  // Send OTP to email
  async sendOTP(email) {
    try {
      const otp = this.generateOTP();
      const expiryTime = Date.now() + this.otpExpiry;

      // Store OTP with expiry
      this.otpStore.set(email, {
        otp,
        expiry: expiryTime,
      });

      // Email content
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: 'Your OTP for Chat App Login',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366F1;">Chat App - Login OTP</h2>
            <p>Your OTP for login is:</p>
            <div style="background-color: #1E293B; color: #F1F5F9; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #64748B; font-size: 12px;">This OTP will expire in 5 minutes.</p>
            <p style="color: #64748B; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
          </div>
        `,
      };

      // Send email
      await this.getTransporter().sendMail(mailOptions);
      
      // Clean up expired OTPs
      this.cleanupExpiredOTPs();

      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      console.error('Email config check:', {
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPass: !!process.env.EMAIL_PASS,
        emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'not set',
      });
      return { success: false, message: 'Failed to send OTP. Please try again.' };
    }
  }

  // Verify OTP
  verifyOTP(email, otp) {
    const storedData = this.otpStore.get(email);

    if (!storedData) {
      return { success: false, message: 'OTP not found. Please request a new OTP.' };
    }

    if (Date.now() > storedData.expiry) {
      this.otpStore.delete(email);
      return { success: false, message: 'OTP has expired. Please request a new OTP.' };
    }

    if (storedData.otp !== otp) {
      return { success: false, message: 'Invalid OTP. Please try again.' };
    }

    // OTP verified successfully, remove it
    this.otpStore.delete(email);
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

