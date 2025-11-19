import { API_CONFIG } from '../constants';
import { showToastFromResponse } from '../utils/toast';
import logger from '../utils/logger';
import { handleApiError } from '../utils/errorHandler';
import { apiFetch } from '../utils/apiHelper';

class AuthService {
  async sendOTP(email, phone) {
    try {
      const response = await apiFetch(`${API_CONFIG.API_BASE}/auth/send-otp`, {
        method: 'POST',
        body: JSON.stringify({ email, phone }),
        loadingMessage: 'Sending OTP...',
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'OTP Sent',
        errorTitle: 'Failed to Send OTP',
      });
      return data;
    } catch (error) {
      logger.error('Error sending OTP:', error);
      const errorResponse = handleApiError(error, 'Failed to send OTP');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async verifyOTP(email, otp, phone) {
    try {
      const response = await apiFetch(`${API_CONFIG.API_BASE}/auth/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ email, otp, phone }),
        loadingMessage: 'Verifying OTP...',
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
      logger.error('Error verifying OTP:', error);
      const errorResponse = handleApiError(error, 'Failed to verify OTP');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async loginWithPassword(email, phone, password) {
    try {
      const response = await apiFetch(`${API_CONFIG.API_BASE}/auth/login-password`, {
        method: 'POST',
        body: JSON.stringify({ email, phone, password }),
        loadingMessage: 'Logging in...',
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
      logger.error('Error logging in with password:', error);
      const errorResponse = handleApiError(error, 'Failed to login');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async forgetPassword(email, phone) {
    try {
      const response = await apiFetch(`${API_CONFIG.API_BASE}/auth/forget-password`, {
        method: 'POST',
        body: JSON.stringify({ email, phone }),
        loadingMessage: 'Sending reset OTP...',
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'OTP Sent',
        errorTitle: 'Failed to Send OTP',
      });
      return data;
    } catch (error) {
      logger.error('Error sending forget password OTP:', error);
      const errorResponse = handleApiError(error, 'Failed to send password reset OTP');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async resetPassword(email, phone, otp, newPassword) {
    try {
      const response = await apiFetch(`${API_CONFIG.API_BASE}/auth/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ email, phone, otp, newPassword }),
        loadingMessage: 'Resetting password...',
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Password Reset',
        errorTitle: 'Failed to Reset Password',
      });
      return data;
    } catch (error) {
      logger.error('Error resetting password:', error);
      const errorResponse = handleApiError(error, 'Failed to reset password');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async register(email, password) {
    try {
      const response = await apiFetch(`${API_CONFIG.API_BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        loadingMessage: 'Registering...',
      });

      const data = await response.json();
      // Don't show toast for register success (handled in LoginScreen)
      if (!data.success) {
        showToastFromResponse(data, { 
          successTitle: 'Registration Successful',
          errorTitle: 'Registration Failed',
          showSuccess: false,
        });
      }
      return data;
    } catch (error) {
      logger.error('Error registering:', error);
      const errorResponse = handleApiError(error, 'Failed to register');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async logout(token) {
    try {
      const response = await apiFetch(`${API_CONFIG.API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
        loadingMessage: 'Logging out...',
      });

      const data = await response.json();
      showToastFromResponse(data, { 
        successTitle: 'Logged Out',
        errorTitle: 'Logout Failed',
      });
      return data;
    } catch (error) {
      logger.error('Error logging out:', error);
      const errorResponse = handleApiError(error, 'Failed to logout');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }
}

export default new AuthService();

