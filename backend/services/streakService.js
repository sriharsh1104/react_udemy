const Streak = require('../models/Streak');

class StreakService {
  /**
   * Get or create a streak between two users
   * Ensures user1Email < user2Email for consistency
   */
  async getOrCreateStreak(user1Email, user2Email) {
    // Normalize emails (lowercase, sorted)
    const emails = [user1Email.toLowerCase(), user2Email.toLowerCase()].sort();
    const [normalizedUser1, normalizedUser2] = emails;

    let streak = await Streak.findOne({
      user1Email: normalizedUser1,
      user2Email: normalizedUser2,
    });

    if (!streak) {
      streak = new Streak({
        user1Email: normalizedUser1,
        user2Email: normalizedUser2,
        streakCount: 0,
        isActive: false,
        consecutiveDays: 0,
      });
      await streak.save();
    }

    return streak;
  }

  /**
   * Update streak when users interact
   * @param {string} user1Email - First user
   * @param {string} user2Email - Second user
   * @param {string} interactionBy - Who initiated the interaction (user1Email or user2Email)
   * @param {string} interactionType - 'message', 'status_view', 'status_create'
   */
  async updateStreak(user1Email, user2Email, interactionBy, interactionType = 'message') {
    try {
      const streak = await this.getOrCreateStreak(user1Email, user2Email);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Normalize interactionBy email
      const normalizedInteractionBy = interactionBy.toLowerCase();
      const normalizedUser1 = streak.user1Email;
      const normalizedUser2 = streak.user2Email;

      // Check if interactionBy is valid
      if (normalizedInteractionBy !== normalizedUser1 && normalizedInteractionBy !== normalizedUser2) {
        console.error('Invalid interactionBy email:', interactionBy);
        return streak;
      }

      // Get last interaction date (normalized to start of day)
      const lastInteractionDate = streak.lastInteractionDate
        ? new Date(new Date(streak.lastInteractionDate).setHours(0, 0, 0, 0))
        : null;

      // Check if we already interacted today
      const alreadyInteractedToday = lastInteractionDate && lastInteractionDate.getTime() === today.getTime();

      // If already interacted today by the same user, don't update
      if (alreadyInteractedToday && streak.lastInteractionBy === normalizedInteractionBy) {
        return streak;
      }

      // Calculate days difference
      let daysDifference = 0;
      if (lastInteractionDate) {
        daysDifference = Math.floor((today - lastInteractionDate) / (1000 * 60 * 60 * 24));
      }

      // If last interaction was yesterday (1 day ago), continue streak
      if (daysDifference === 1) {
        // Check if both users interacted yesterday
        // If lastInteractionBy is different from current interactionBy, both users interacted
        const bothInteractedYesterday = streak.lastInteractionBy !== normalizedInteractionBy;
        
        if (bothInteractedYesterday || streak.consecutiveDays === 0) {
          // Both users interacted, increment streak
          streak.consecutiveDays += 1;
          streak.streakCount = streak.consecutiveDays;
          streak.isActive = true;
        } else {
          // Only one user interacted yesterday, need both to continue
          // If current interaction is by different user, continue streak
          if (streak.lastInteractionBy !== normalizedInteractionBy) {
            streak.consecutiveDays += 1;
            streak.streakCount = streak.consecutiveDays;
            streak.isActive = true;
          }
        }
      } else if (daysDifference === 0) {
        // Same day interaction
        // If different user interacted, both users have interacted today
        if (streak.lastInteractionBy && streak.lastInteractionBy !== normalizedInteractionBy) {
          // Both users interacted today, increment if this is first time both interacted
          if (streak.consecutiveDays === 0) {
            streak.consecutiveDays = 1;
            streak.streakCount = 1;
            streak.isActive = true;
          }
        } else if (!streak.lastInteractionBy) {
          // First interaction ever
          streak.consecutiveDays = 1;
          streak.streakCount = 1;
          streak.isActive = true;
        }
      } else if (daysDifference > 1) {
        // Streak broken (more than 1 day gap)
        streak.consecutiveDays = 1;
        streak.streakCount = 1;
        streak.isActive = true;
        // Reset streak start date
        streak.startedAt = now;
      }

      // Update last interaction
      streak.lastInteractionDate = today;
      streak.lastInteractionBy = normalizedInteractionBy;
      streak.updatedAt = now;

      await streak.save();
      return streak;
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }

  /**
   * Check and reset broken streaks (called by cron job)
   * A streak is broken if no interaction for more than 1 day
   */
  async checkAndResetBrokenStreaks() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Find streaks that haven't been updated in more than 1 day
      const brokenStreaks = await Streak.find({
        isActive: true,
        lastInteractionDate: { $lt: yesterday },
      });

      for (const streak of brokenStreaks) {
        streak.isActive = false;
        streak.consecutiveDays = 0;
        streak.streakCount = 0;
        await streak.save();
      }

      return brokenStreaks.length;
    } catch (error) {
      console.error('Error checking broken streaks:', error);
      throw error;
    }
  }

  /**
   * Get all active streaks for a user
   */
  async getUserStreaks(userEmail) {
    try {
      const normalizedEmail = userEmail.toLowerCase();
      
      const streaks = await Streak.find({
        $or: [
          { user1Email: normalizedEmail },
          { user2Email: normalizedEmail },
        ],
        isActive: true,
      })
        .sort({ streakCount: -1 })
        .lean();

      return streaks.map(streak => ({
        streakId: streak._id.toString(),
        otherUserEmail: streak.user1Email === normalizedEmail 
          ? streak.user2Email 
          : streak.user1Email,
        streakCount: streak.streakCount,
        consecutiveDays: streak.consecutiveDays,
        lastInteractionDate: streak.lastInteractionDate,
        startedAt: streak.startedAt,
      }));
    } catch (error) {
      console.error('Error getting user streaks:', error);
      throw error;
    }
  }

  /**
   * Get streak between two specific users
   */
  async getStreakBetweenUsers(user1Email, user2Email) {
    try {
      const streak = await this.getOrCreateStreak(user1Email, user2Email);
      
      return {
        streakId: streak._id.toString(),
        streakCount: streak.streakCount,
        consecutiveDays: streak.consecutiveDays,
        isActive: streak.isActive,
        lastInteractionDate: streak.lastInteractionDate,
        startedAt: streak.startedAt,
      };
    } catch (error) {
      console.error('Error getting streak between users:', error);
      throw error;
    }
  }

  /**
   * Reset a streak (manual reset, e.g., if user wants to start over)
   */
  async resetStreak(user1Email, user2Email) {
    try {
      const streak = await this.getOrCreateStreak(user1Email, user2Email);
      
      streak.streakCount = 0;
      streak.consecutiveDays = 0;
      streak.isActive = false;
      streak.lastInteractionDate = null;
      streak.lastInteractionBy = null;
      streak.startedAt = new Date();
      streak.updatedAt = new Date();
      
      await streak.save();
      return streak;
    } catch (error) {
      console.error('Error resetting streak:', error);
      throw error;
    }
  }
}

module.exports = new StreakService();

