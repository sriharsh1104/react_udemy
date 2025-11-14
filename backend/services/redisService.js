const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this._isConnected = false;
  }

  /**
   * Get connection status - synced with isReady()
   */
  get isConnected() {
    return this.isReady();
  }

  async connect() {
    try {
      // If already connected, return true
      if (this.client && this.isReady()) {
        console.log('✅ Redis: Already connected');
        return true;
      }

      // Support both REDIS_URL and individual config (for Redis Cloud)
      let clientConfig = {};
      
      if (process.env.REDIS_URL) {
        // Use URL format: redis://username:password@host:port
        const redisUrl = process.env.REDIS_URL;
        console.log(`🔄 Redis: Attempting to connect using REDIS_URL: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password if present
        clientConfig = {
          url: redisUrl,
        };
      } else if (process.env.REDIS_HOST || process.env.REDIS_USERNAME) {
        // Use socket configuration (for Redis Cloud with username/password)
        const host = process.env.REDIS_HOST || 'localhost';
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);
        const username = process.env.REDIS_USERNAME;
        const password = process.env.REDIS_PASSWORD;
        
        console.log(`🔄 Redis: Attempting to connect to ${host}:${port}${username ? ' (with auth)' : ''}`);
        
        clientConfig = {
          socket: {
            host: host,
            port: port,
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                console.error('❌ Redis: Max reconnection attempts reached');
                return new Error('Max reconnection attempts reached');
              }
              return Math.min(retries * 100, 3000);
            },
          },
        };
        
        if (username) {
          clientConfig.username = username;
        }
        if (password) {
          clientConfig.password = password;
        }
      } else {
        // Default to localhost
        const redisUrl = 'redis://localhost:6379';
        console.log(`🔄 Redis: Attempting to connect to ${redisUrl} (default)`);
        clientConfig = {
          url: redisUrl,
        };
      }
      
      // Add reconnect strategy if not already set
      if (!clientConfig.socket || !clientConfig.socket.reconnectStrategy) {
        if (!clientConfig.socket) {
          clientConfig.socket = {};
        }
        clientConfig.socket.reconnectStrategy = (retries) => {
          if (retries > 10) {
            console.error('❌ Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        };
      }
      
      this.client = redis.createClient(clientConfig);

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err.message);
        this._isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis: Socket connected');
        this._isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis: Ready to accept commands');
        this._isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('❌ Redis: Disconnected');
        this._isConnected = false;
      });

      await this.client.connect();
      
      // Wait for client to be ready (with timeout)
      const maxWait = 5000; // 5 seconds
      const startTime = Date.now();
      while (!this.client.isReady && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (this.client.isReady) {
        this._isConnected = true;
        console.log('✅ Redis: Connection established and ready for operations');
        return true;
      } else {
        console.warn('⚠️ Redis: Client created but not ready after timeout (will retry)');
        // Still return true - client might become ready later
        return true;
      }
    } catch (error) {
      console.error('❌ Redis connection error:', error.message);
      this._isConnected = false;
      return false;
    }
  }

  /**
   * Check if Redis client is ready to accept commands
   */
  isReady() {
    return this.client && (this.client.isReady || this.client.isOpen);
  }

  async get(key) {
    if (!this.client) return null;
    // Check if client is ready, if not try to wait a bit
    if (!this.isReady()) {
      // If not ready, wait a bit for connection (max 500ms)
      const maxWait = 500;
      const startTime = Date.now();
      while (!this.isReady() && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (!this.isReady()) {
        console.warn('⚠️ Redis not ready for GET operation');
        return null;
      }
    }
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    if (!this.client) return false;
    // Check if client is ready, if not try to wait a bit
    if (!this.isReady()) {
      // If not ready, wait a bit for connection (max 500ms)
      const maxWait = 500;
      const startTime = Date.now();
      while (!this.isReady() && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (!this.isReady()) {
        console.warn('⚠️ Redis not ready for SET operation');
        return false;
      }
    }
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async delete(key) {
    if (!this.client) return false;
    if (!this.isReady()) {
      console.warn('⚠️ Redis not ready for DELETE operation');
      return false;
    }
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.client) return false;
    if (!this.isReady()) {
      return false;
    }
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async setHash(key, field, value) {
    if (!this.client) return false;
    if (!this.isReady()) return false;
    try {
      await this.client.hSet(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis HSET error:', error);
      return false;
    }
  }

  async getHash(key, field) {
    if (!this.client) return null;
    if (!this.isReady()) return null;
    try {
      const value = await this.client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis HGET error:', error);
      return null;
    }
  }

  async getAllHash(key) {
    if (!this.client) return {};
    if (!this.isReady()) return {};
    try {
      const hash = await this.client.hGetAll(key);
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result;
    } catch (error) {
      console.error('Redis HGETALL error:', error);
      return {};
    }
  }

  async deleteHash(key, field) {
    if (!this.client) return false;
    if (!this.isReady()) return false;
    try {
      await this.client.hDel(key, field);
      return true;
    } catch (error) {
      console.error('Redis HDEL error:', error);
      return false;
    }
  }

  async expire(key, seconds) {
    if (!this.client) return false;
    if (!this.isReady()) return false;
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this._isConnected = false;
    }
  }
}

const redisService = new RedisService();

// Auto-connect on module load
if (process.env.NODE_ENV !== 'test') {
  redisService.connect().catch(console.error);
}

module.exports = redisService;

