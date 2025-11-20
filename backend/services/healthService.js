const User = require('../models/User');
const HealthData = require('../models/HealthData');

class HealthService {
  /**
   * Calculate BMI (Body Mass Index)
   * BMI = weight (kg) / (height (m))^2
   */
  calculateBMI(height, weight) {
    if (!height || !weight || height <= 0 || weight <= 0) {
      return null;
    }
    const heightInMeters = height / 100; // Convert cm to meters
    const bmi = weight / (heightInMeters * heightInMeters);
    return Math.round(bmi * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get BMI category
   */
  getBMICategory(bmi) {
    if (!bmi) return null;
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  /**
   * Calculate ideal weight based on height and gender (using Devine formula)
   * Men: Ideal Weight = 50 + 2.3 * (height in inches - 60)
   * Women: Ideal Weight = 45.5 + 2.3 * (height in inches - 60)
   * Other: Average of male and female
   */
  calculateIdealWeight(height, gender = null) {
    if (!height || height <= 0) return null;
    const heightInInches = height / 2.54;
    let idealWeight;
    
    if (gender === 'male') {
      idealWeight = 50 + 2.3 * (heightInInches - 60);
    } else if (gender === 'female') {
      idealWeight = 45.5 + 2.3 * (heightInInches - 60);
    } else {
      // Average for 'other' or no gender specified
      idealWeight = 47.75 + 2.3 * (heightInInches - 60);
    }
    
    return Math.round(idealWeight * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculate ideal weight range (±10% of ideal weight)
   */
  calculateIdealWeightRange(height, gender = null) {
    const idealWeight = this.calculateIdealWeight(height, gender);
    if (!idealWeight) return null;
    
    const minWeight = Math.round(idealWeight * 0.9 * 10) / 10;
    const maxWeight = Math.round(idealWeight * 1.1 * 10) / 10;
    
    return {
      ideal: idealWeight,
      min: minWeight,
      max: maxWeight,
    };
  }

  /**
   * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
   * Men: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(years) + 5
   * Women: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(years) - 161
   * Other: Average of male and female
   */
  calculateBMR(height, weight, age, gender = null) {
    if (!height || !weight || !age || height <= 0 || weight <= 0 || age <= 0) {
      return null;
    }
    
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else if (gender === 'female') {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      // Average for 'other' or no gender specified
      bmr = 10 * weight + 6.25 * height - 5 * age - 78;
    }
    
    return Math.round(bmr);
  }

  /**
   * Calculate daily calorie allowance based on ideal weight
   * Uses BMR with ideal weight and applies activity factor (1.2 for sedentary)
   */
  calculateDailyCalorieAllowance(height, age, gender = null, activityLevel = 1.2) {
    const idealWeight = this.calculateIdealWeight(height, gender);
    if (!idealWeight || !age) return null;
    
    // Calculate BMR with ideal weight
    const bmr = this.calculateBMR(height, idealWeight, age, gender);
    if (!bmr) return null;
    
    // Apply activity factor (1.2 = sedentary, 1.375 = light, 1.55 = moderate, 1.725 = active)
    const dailyCalories = bmr * activityLevel;
    return Math.round(dailyCalories);
  }

  /**
   * Calculate calories burnt from steps
   * Average: 0.04 calories per step per kg of body weight
   */
  calculateCaloriesFromSteps(steps, weight) {
    if (!steps || !weight || steps <= 0 || weight <= 0) {
      return 0;
    }
    // Average calories per step: 0.04 calories per kg
    const calories = steps * 0.04 * weight;
    return Math.round(calories);
  }

  /**
   * Get or create today's health data for a user
   * Automatically resets at midnight (12 AM)
   */
  async getTodayHealthData(userEmail) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find existing health data for today
    let healthData = await HealthData.findOne({
      userEmail,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (!healthData) {
      // Check if there's old data that needs to be reset
      // This ensures fresh data for new day
      healthData = new HealthData({
        userEmail,
        date: today,
        steps: 0,
        caloriesBurnt: 0,
      });
      await healthData.save();
    } else {
      // Check if the date has changed (midnight reset)
      const healthDataDate = new Date(healthData.date);
      healthDataDate.setHours(0, 0, 0, 0);
      
      if (healthDataDate.getTime() !== today.getTime()) {
        // Date has changed, reset steps and calories
        healthData.steps = 0;
        healthData.caloriesBurnt = 0;
        healthData.date = today;
        healthData.updatedAt = new Date();
        await healthData.save();
      }
    }

    return healthData;
  }

  /**
   * Update today's steps and calculate calories dynamically
   */
  async updateSteps(userEmail, steps, weight) {
    const healthData = await this.getTodayHealthData(userEmail);
    
    // Ensure we're working with today's data (midnight reset check)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const healthDataDate = new Date(healthData.date);
    healthDataDate.setHours(0, 0, 0, 0);
    
    if (healthDataDate.getTime() !== today.getTime()) {
      // New day, reset
      healthData.steps = 0;
      healthData.caloriesBurnt = 0;
      healthData.date = today;
    }
    
    // Update steps and recalculate calories dynamically
    healthData.steps = steps;
    healthData.caloriesBurnt = this.calculateCaloriesFromSteps(steps, weight);
    healthData.updatedAt = new Date();
    await healthData.save();
    return healthData;
  }

  /**
   * Check if health profile is complete
   */
  async isHealthProfileComplete(userEmail) {
    const user = await User.findOne({ email: userEmail });
    if (!user) return false;
    
    return !!(user.height && user.weight && user.gender && user.age);
  }

  /**
   * Get user health profile
   */
  async getHealthProfile(userEmail) {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      throw new Error('User not found');
    }

    const bmi = this.calculateBMI(user.height, user.weight);
    const idealWeightRange = this.calculateIdealWeightRange(user.height, user.gender);
    const dailyCalorieAllowance = this.calculateDailyCalorieAllowance(user.height, user.age, user.gender);
    const todayHealthData = await this.getTodayHealthData(userEmail);
    const isComplete = await this.isHealthProfileComplete(userEmail);

    return {
      height: user.height,
      weight: user.weight,
      age: user.age,
      gender: user.gender,
      name: user.name,
      bmi,
      bmiCategory: this.getBMICategory(bmi),
      idealWeight: idealWeightRange?.ideal,
      idealWeightRange,
      dailyCalorieAllowance,
      todaySteps: todayHealthData.steps,
      todayCaloriesBurnt: todayHealthData.caloriesBurnt,
      isHealthProfileComplete: isComplete,
    };
  }

  /**
   * Update user health profile (height, weight, age, gender)
   */
  async updateHealthProfile(userEmail, { height, weight, age, gender }) {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      throw new Error('User not found');
    }

    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;

    await user.save();

    // Recalculate today's calories if weight changed
    if (weight !== undefined && user.weight) {
      const todayHealthData = await this.getTodayHealthData(userEmail);
      todayHealthData.caloriesBurnt = this.calculateCaloriesFromSteps(todayHealthData.steps, user.weight);
      await todayHealthData.save();
    }

    return this.getHealthProfile(userEmail);
  }
}

module.exports = new HealthService();
