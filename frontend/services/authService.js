import { showToastFromResponse } from '../utils/toast';
import logger from '../utils/logger';
import { handleApiError } from '../utils/errorHandler';
import apiService from './apiService';

class AuthService {
  async sendOTP(email, phone) {
    try {
      // Use apiService.post - auth endpoints don't require token, loader enabled
      const result = await apiService.post('/auth/send-otp', { email, phone }, {}, 'Sending OTP...');
      
      showToastFromResponse(result, { 
        successTitle: 'OTP Sent',
        errorTitle: 'Failed to Send OTP',
      });
      return result;
    } catch (error) {
      logger.error('Error sending OTP:', error);
      const errorResponse = handleApiError(error, 'Failed to send OTP');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async verifyOTP(email, otp, phone) {
    try {
      // Use apiService.post - auth endpoints don't require token, loader enabled
      const result = await apiService.post('/auth/verify-otp', { email, otp, phone }, {}, 'Verifying OTP...');
      
      // Don't show toast for verify OTP success (handled in LoginScreen)
      if (!result.success) {
        showToastFromResponse(result, { 
          successTitle: 'Login Successful',
          errorTitle: 'Invalid OTP',
          showSuccess: false,
        });
      }
      return result;
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      const errorResponse = handleApiError(error, 'Failed to verify OTP');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async loginWithPassword(email, phone, password) {
    try {
      // Use apiService.post - auth endpoints don't require token, loader enabled
      const result = await apiService.post('/auth/login-password', { email, phone, password }, {}, 'Logging in...');
      
      if (!result.success) {
        showToastFromResponse(result, { 
          successTitle: 'Login Successful',
          errorTitle: 'Login Failed',
          showSuccess: false,
        });
      }
      return result;
    } catch (error) {
      logger.error('Error logging in with password:', error);
      const errorResponse = handleApiError(error, 'Failed to login');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async forgetPassword(email, phone) {
    try {
      // Use apiService.post - auth endpoints don't require token, loader enabled
      const result = await apiService.post('/auth/forget-password', { email, phone }, {}, 'Sending Reset OTP...');
      
      showToastFromResponse(result, { 
        successTitle: 'OTP Sent',
        errorTitle: 'Failed to Send OTP',
      });
      return result;
    } catch (error) {
      logger.error('Error sending forget password OTP:', error);
      const errorResponse = handleApiError(error, 'Failed to send password reset OTP');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async resetPassword(email, phone, otp, newPassword) {
    try {
      // Use apiService.post - auth endpoints don't require token, loader enabled
      const result = await apiService.post('/auth/reset-password', { email, phone, otp, newPassword }, {}, 'Resetting Password...');
      
      showToastFromResponse(result, { 
        successTitle: 'Password Reset',
        errorTitle: 'Failed to Reset Password',
      });
      return result;
    } catch (error) {
      logger.error('Error resetting password:', error);
      const errorResponse = handleApiError(error, 'Failed to reset password');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async register(email, password) {
    try {
      // Use apiService.post - auth endpoints don't require token, loader enabled
      const result = await apiService.post('/auth/register', { email, password }, {}, 'Registering...');
      
      // Don't show toast for register success (handled in LoginScreen)
      if (!result.success) {
        showToastFromResponse(result, { 
          successTitle: 'Registration Successful',
          errorTitle: 'Registration Failed',
          showSuccess: false,
        });
      }
      return result;
    } catch (error) {
      logger.error('Error registering:', error);
      const errorResponse = handleApiError(error, 'Failed to register');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }

  async logout(token) {
    try {
      // Use apiService.post - logout requires token, loader enabled
      // Note: For logout, we need to pass token manually since user is logging out
      const result = await apiService.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } }, 'Logging out...');
      
      showToastFromResponse(result, { 
        successTitle: 'Logged Out',
        errorTitle: 'Logout Failed',
      });
      return result;
    } catch (error) {
      logger.error('Error logging out:', error);
      const errorResponse = handleApiError(error, 'Failed to logout');
      showToastFromResponse(errorResponse, { errorTitle: 'Network Error' });
      return errorResponse;
    }
  }
}

export default new AuthService();
