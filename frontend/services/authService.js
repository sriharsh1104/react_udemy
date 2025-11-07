import { API_CONFIG } from '../constants';

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
      return data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
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
      return data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
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
      return data;
    } catch (error) {
      console.error('Error logging out:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }
}

export default new AuthService();

