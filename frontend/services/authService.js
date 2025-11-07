import { API_CONFIG } from '../constants';
import { showToastFromResponse } from '../utils/toast';

class AuthService {
  async sendOTP(email, phone) {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phone }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'OTP Sent',
        errorTitle: 'Failed to Send OTP',
      });
      return data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async verifyOTP(email, otp, phone) {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, phone }),
      });

      const data = await response.json();
      // Don't show toast for verify OTP success (handled in LoginScreen)
      if (!data.success) {
        showToastFromResponse(data, { 
          successTitle: 'Login Successful',
          errorTitle: 'Invalid OTP',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async loginWithPassword(email, phone, password) {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/auth/login-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phone, password }),
      });

      const data = await response.json();
      if (!data.success) {
        showToastFromResponse(data, { 
          successTitle: 'Login Successful',
          errorTitle: 'Login Failed',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      console.error('Error logging in with password:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async forgetPassword(email, phone) {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/auth/forget-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phone }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'OTP Sent',
        errorTitle: 'Failed to Send OTP',
      });
      return data;
    } catch (error) {
      console.error('Error sending forget password OTP:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async resetPassword(email, phone, otp, newPassword) {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phone, otp, newPassword }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Password Reset',
        errorTitle: 'Failed to Reset Password',
      });
      return data;
    } catch (error) {
      console.error('Error resetting password:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async logout(token) {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Logged Out',
        errorTitle: 'Logout Failed',
      });
      return data;
    } catch (error) {
      console.error('Error logging out:', error);
      const errorResponse = {
        success: false,
        message: 'Network error. Please check your connection.',
      };
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }
}

export default new AuthService();

