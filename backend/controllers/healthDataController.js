const healthService = require('../services/healthService');
const userService = require('../services/userService');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHelper');

class HealthDataController {
  /**
   * Get user health profile (BMI, ideal weight, daily calories, etc.)
   */
  async getHealthProfile(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      
      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      const healthProfile = await healthService.getHealthProfile(userEmail);
      
      return sendSuccess(res, HTTP_STATUS.OK, 'Health profile retrieved successfully', {
        healthProfile,
      });
    } catch (error) {
      console.error('Error in getHealthProfile:', error);
      const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }

  /**
   * Update user health profile (height, weight, age, gender)
   */
  async updateHealthProfile(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { height, weight, age, gender } = req.body;
      
      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      // Validate inputs
      if (height !== undefined && (isNaN(height) || height <= 0 || height > 300)) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid height. Must be between 1 and 300 cm');
      }
      if (weight !== undefined && (isNaN(weight) || weight <= 0 || weight > 500)) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid weight. Must be between 1 and 500 kg');
      }
      if (age !== undefined && (isNaN(age) || age <= 0 || age > 150)) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid age. Must be between 1 and 150 years');
      }
      if (gender !== undefined && !['male', 'female', 'other'].includes(gender)) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid gender. Must be male, female, or other');
      }

      const healthProfile = await healthService.updateHealthProfile(userEmail, {
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
      });
      
      return sendSuccess(res, HTTP_STATUS.OK, 'Health profile updated successfully', {
        healthProfile,
      });
    } catch (error) {
      console.error('Error in updateHealthProfile:', error);
      const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }

  /**
   * Update today's step count
   */
  async updateSteps(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { steps } = req.body;
      
      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (steps === undefined || isNaN(steps) || steps < 0) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid steps. Must be a non-negative number');
      }

      // Get user weight for calorie calculation
      const User = require('../models/User');
      const user = await User.findOne({ email: userEmail });
      if (!user || !user.weight) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please set your weight first to calculate calories');
      }

      const healthData = await healthService.updateSteps(userEmail, parseInt(steps), user.weight);
      
      return sendSuccess(res, HTTP_STATUS.OK, 'Steps updated successfully', {
        steps: healthData.steps,
        caloriesBurnt: healthData.caloriesBurnt,
      });
    } catch (error) {
      console.error('Error in updateSteps:', error);
      const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }
}

module.exports = new HealthDataController();
