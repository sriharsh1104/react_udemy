// In-memory caching service with TTL support
// Can be upgraded to Redis later for distributed caching

class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  // Set a value in cache with optional TTL
  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  // Get a value from cache (returns null if expired or not found)
  get(key) {
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
  delete(key) {
    this.cache.delete(key);
  }

  // Delete multiple keys matching a pattern
  deletePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
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

module.exports = cacheService;

