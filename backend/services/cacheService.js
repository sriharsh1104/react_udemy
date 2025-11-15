// Distributed caching service with Redis support
// Falls back to in-memory if Redis is not available

const redisService = require('./redisService');

class CacheService {
  constructor() {
    this.cache = new Map(); // In-memory fallback
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
    this.useRedis = false;
    this.checkRedisAvailability();
  }
  
  async checkRedisAvailability() {
    // Check if Redis is available for distributed caching
    if (redisService.isReady()) {
      this.useRedis = true;
      console.log('✅ CacheService: Using Redis for distributed caching');
    } else {
      this.useRedis = false;
      console.warn('⚠️ CacheService: Redis not available, using in-memory cache (won\'t scale horizontally)');
    }
  }

  // Set a value in cache with optional TTL
  async set(key, value, ttl = this.defaultTTL) {
    // Store in Redis if available
    if (this.useRedis && redisService.isReady()) {
      try {
        const ttlSeconds = Math.floor(ttl / 1000); // Convert to seconds
        await redisService.set(`cache:${key}`, value, ttlSeconds);
      } catch (error) {
        console.error('Error setting cache in Redis:', error);
        // Fallback to in-memory
        this.useRedis = false;
      }
    }
    
    // Always maintain in-memory as fallback
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  // Get a value from cache (returns null if expired or not found)
  async get(key) {
    // Try Redis first if available
    if (this.useRedis && redisService.isReady()) {
      try {
        const value = await redisService.get(`cache:${key}`);
        if (value !== null) {
          return value;
        }
      } catch (error) {
        console.error('Error getting cache from Redis:', error);
        // Fallback to in-memory
      }
    }
    
    // Fallback to in-memory
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  // Delete a key from cache
  async delete(key) {
    // Delete from Redis if available
    if (this.useRedis && redisService.isReady()) {
      try {
        await redisService.delete(`cache:${key}`);
      } catch (error) {
        console.error('Error deleting cache from Redis:', error);
      }
    }
    
    // Delete from in-memory
    this.cache.delete(key);
  }

  // Delete multiple keys matching a pattern
  async deletePattern(pattern) {
    // Note: Redis pattern deletion would require SCAN command
    // For now, only delete from in-memory
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        await this.delete(key);
      }
    }
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Clean up expired entries (call periodically)
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: Removed ${cleaned} expired entries`);
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;
    
    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }
    
    return {
      total: this.cache.size,
      active,
      expired,
    };
  }

  // Cache key generators
  static keys = {
    userProfile: (email) => `profile:${email}`,
    userContacts: (email) => `contacts:${email}`,
    userGroups: (email) => `groups:${email}`,
    contactProfile: (email) => `contact_profile:${email}`,
    followers: (email) => `followers:${email}`,
    following: (email) => `following:${email}`,
  };
}

// Start periodic cleanup every 10 minutes
const cacheService = new CacheService();
setInterval(() => {
  cacheService.cleanup();
}, 10 * 60 * 1000);

// Export both instance and class (for static keys access)
cacheService.keys = CacheService.keys;
module.exports = cacheService;

