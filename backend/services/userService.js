const Session = require('../models/Session');
const redisService = require('./redisService');

class UserService {
  constructor() {
    // Keep in-memory as fallback for socket connections
    this.users = new Map(); // socketId -> username (email)
    this.emailToSocket = new Map(); // email -> socketId
    this.socketToEmail = new Map(); // socketId -> email (reverse lookup for cleanup)
    this.socketLastActivity = new Map(); // socketId -> timestamp (for cleanup)
    
    // Use Redis for distributed state if available
    this.useRedis = false;
    this.checkRedisAvailability();
    
    // Start periodic cleanup to prevent memory leaks
    this.startCleanupInterval();
  }
  
  async checkRedisAvailability() {
    // Check if Redis is available and use it for distributed state
    if (redisService.isReady()) {
      this.useRedis = true;
      console.log('✅ UserService: Using Redis for distributed socket state management');
    } else {
      this.useRedis = false;
      console.warn('⚠️ UserService: Redis not available, using in-memory state (won\'t scale horizontally)');
    }
  }
  
  // Periodic cleanup to remove stale entries and prevent memory leaks
  startCleanupInterval() {
    // Clean up every 5 minutes
    setInterval(() => {
      this.cleanupStaleEntries();
    }, 5 * 60 * 1000);
  }
  
  // Remove stale socket entries that are no longer active
  cleanupStaleEntries() {
    const now = Date.now();
    const STALE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
    
    let cleanedCount = 0;
    
    // Check all sockets and remove stale ones
    for (const [socketId, lastActivity] of this.socketLastActivity.entries()) {
      if (now - lastActivity > STALE_TIMEOUT) {
        const email = this.socketToEmail.get(socketId);
        
        // Remove from all maps
        this.users.delete(socketId);
        this.socketToEmail.delete(socketId);
        this.socketLastActivity.delete(socketId);
        
        // Only remove from emailToSocket if this socket is still mapped
        if (email) {
          const currentSocketId = this.emailToSocket.get(email);
          if (currentSocketId === socketId) {
            this.emailToSocket.delete(email);
          }
        }
        
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} stale socket entries`);
    }
  }
  
  // Get memory stats for monitoring
  getMemoryStats() {
    return {
      totalSockets: this.users.size,
      totalEmails: this.emailToSocket.size,
      staleEntries: Array.from(this.socketLastActivity.entries())
        .filter(([_, timestamp]) => Date.now() - timestamp > 10 * 60 * 1000).length,
    };
  }

  async addUser(socketId, username) {
    await this.setEmailToSocket(username, socketId);
    return Array.from(this.users.values());
  }

  async removeUser(socketId) {
    return await this.cleanupSocket(socketId);
  }

  getUser(socketId) {
    return this.users.get(socketId);
  }

  // Get email from socket ID (with Redis fallback)
  async getEmailFromSocket(socketId) {
    if (!socketId) {
      return null;
    }
    
    // Try in-memory first
    let email = this.users.get(socketId) || this.socketToEmail.get(socketId);
    if (email) {
      return email;
    }
    
    // Try Redis if available
    if (this.useRedis && redisService.isReady()) {
      try {
        email = await redisService.get(`socket:id:${socketId}`);
        if (email) {
          // Update in-memory cache
          this.users.set(socketId, email);
          this.socketToEmail.set(socketId, email);
          return email;
        }
      } catch (error) {
        console.error('Error getting email from Redis:', error);
      }
    }
    
    return null;
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  getUserCount() {
    return this.users.size;
  }

  // Session management for email-based auth (MongoDB)
  async addUserSession(email, token) {
    try {
      await Session.findOneAndUpdate(
        { email },
        {
          email,
          token,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        {
          upsert: true,
          new: true,
        }
      );
    } catch (error) {
      console.error('Error adding session:', error);
    }
  }

  async getUserByToken(token) {
    try {
      if (!token) {
        return null;
      }
      
      // Check if mongoose is connected
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.error('MongoDB not connected. ReadyState:', mongoose.connection.readyState);
        throw new Error('Database connection not available');
      }
      
      const session = await Session.findOne({ token });
      if (session && session.expiresAt > new Date()) {
        return session.email;
      }
      // If expired, delete it
      if (session) {
        await Session.deleteOne({ token });
      }
      return null;
    } catch (error) {
      console.error('Error getting user by token:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  async removeSession(token) {
    try {
      await Session.deleteOne({ token });
    } catch (error) {
      console.error('Error removing session:', error);
    }
  }

  async getTokenByEmail(email) {
    try {
      const session = await Session.findOne({ email });
      if (session && session.expiresAt > new Date()) {
        return session.token;
      }
      return null;
    } catch (error) {
      console.error('Error getting token by email:', error);
      return null;
    }
  }

  // Socket management (Redis-backed for horizontal scaling)
  async setEmailToSocket(email, socketId) {
    // If email already has a different socket, clean up the old one
    const oldSocketId = await this.getSocketByEmail(email);
    if (oldSocketId && oldSocketId !== socketId) {
      // Remove old socket mapping
      await this.removeSocketMapping(oldSocketId);
    }
    
    // Store in Redis for distributed access
    if (this.useRedis && redisService.isReady()) {
      try {
        // Store email -> socketId mapping with TTL (1 hour)
        await redisService.set(`socket:email:${email}`, socketId, 3600);
        // Store socketId -> email mapping with TTL
        await redisService.set(`socket:id:${socketId}`, email, 3600);
        // Store socket activity timestamp
        await redisService.set(`socket:activity:${socketId}`, Date.now(), 3600);
      } catch (error) {
        console.error('Error storing socket mapping in Redis:', error);
        // Fallback to in-memory
        this.useRedis = false;
      }
    }
    
    // Always maintain in-memory as fallback
    this.emailToSocket.set(email, socketId);
    this.socketToEmail.set(socketId, email);
    this.socketLastActivity.set(socketId, Date.now());
    this.users.set(socketId, email);
  }

  async getSocketByEmail(email) {
    // Try Redis first if available
    if (this.useRedis && redisService.isReady()) {
      try {
        const socketId = await redisService.get(`socket:email:${email}`);
        if (socketId) {
          // Verify socket is still active by checking activity
          const activity = await redisService.get(`socket:activity:${socketId}`);
          if (activity) {
            // Update activity
            await redisService.set(`socket:activity:${socketId}`, Date.now(), 3600);
            return socketId;
          } else {
            // Socket is stale, clean up
            await redisService.delete(`socket:email:${email}`);
            await redisService.delete(`socket:id:${socketId}`);
          }
        }
      } catch (error) {
        console.error('Error getting socket from Redis:', error);
        // Fallback to in-memory
      }
    }
    
    // Fallback to in-memory
    const socketId = this.emailToSocket.get(email);
    
    // Verify socket still exists and is active
    if (socketId && this.users.has(socketId)) {
      // Update last activity
      this.socketLastActivity.set(socketId, Date.now());
      return socketId;
    }
    
    // Clean up stale mapping
    if (socketId) {
      this.emailToSocket.delete(email);
    }
    
    return null;
  }

  async removeSocketMapping(socketId) {
    // Remove from Redis
    if (this.useRedis && redisService.isReady()) {
      try {
        const email = await redisService.get(`socket:id:${socketId}`);
        if (email) {
          await redisService.delete(`socket:email:${email}`);
        }
        await redisService.delete(`socket:id:${socketId}`);
        await redisService.delete(`socket:activity:${socketId}`);
      } catch (error) {
        console.error('Error removing socket mapping from Redis:', error);
      }
    }
    
    // Remove from in-memory
    const email = this.socketToEmail.get(socketId);
    if (email) {
      this.emailToSocket.delete(email);
    }
      this.socketToEmail.delete(socketId);
      this.socketLastActivity.delete(socketId);
    this.users.delete(socketId);
  }

  async removeEmailToSocket(email) {
    const socketId = await this.getSocketByEmail(email);
    
    if (socketId) {
      await this.removeSocketMapping(socketId);
    }
  }
  
  // Comprehensive cleanup for a socket (called on disconnect)
  async cleanupSocket(socketId) {
    // Try to get email from Redis first
    let email = null;
    if (this.useRedis && redisService.isReady()) {
      try {
        email = await redisService.get(`socket:id:${socketId}`);
      } catch (error) {
        // Fallback to in-memory
      }
    }
    
    // Fallback to in-memory
    if (!email) {
      email = this.socketToEmail.get(socketId) || this.users.get(socketId);
    }
    
    // Remove from Redis
    await this.removeSocketMapping(socketId);
    
    return email;
  }
}

module.exports = new UserService();

