const Session = require('../models/Session');

class UserService {
  constructor() {
    // Keep in-memory for socket connections (temporary)
    this.users = new Map(); // socketId -> username (email)
    this.emailToSocket = new Map(); // email -> socketId
    this.socketToEmail = new Map(); // socketId -> email (reverse lookup for cleanup)
    this.socketLastActivity = new Map(); // socketId -> timestamp (for cleanup)
    
    // Start periodic cleanup to prevent memory leaks
    this.startCleanupInterval();
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

  addUser(socketId, username) {
    this.users.set(socketId, username);
    this.socketToEmail.set(socketId, username); // Track reverse mapping
    this.socketLastActivity.set(socketId, Date.now()); // Track activity
    return Array.from(this.users.values());
  }

  removeUser(socketId) {
    const username = this.users.get(socketId);
    
    // Clean up all related entries
    this.users.delete(socketId);
    this.socketToEmail.delete(socketId);
    this.socketLastActivity.delete(socketId);
    
    // Also remove from emailToSocket if this socket is mapped
    if (username) {
      const currentSocketId = this.emailToSocket.get(username);
      if (currentSocketId === socketId) {
        this.emailToSocket.delete(username);
      }
    }
    
    return username;
  }

  getUser(socketId) {
    return this.users.get(socketId);
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

  // Socket management (in-memory)
  setEmailToSocket(email, socketId) {
    // If email already has a different socket, clean up the old one
    const oldSocketId = this.emailToSocket.get(email);
    if (oldSocketId && oldSocketId !== socketId) {
      // Remove old socket mapping
      this.users.delete(oldSocketId);
      this.socketToEmail.delete(oldSocketId);
      this.socketLastActivity.delete(oldSocketId);
    }
    
    this.emailToSocket.set(email, socketId);
    this.socketToEmail.set(socketId, email); // Maintain reverse mapping
    this.socketLastActivity.set(socketId, Date.now()); // Update activity
  }

  getSocketByEmail(email) {
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

  removeEmailToSocket(email) {
    const socketId = this.emailToSocket.get(email);
    
    if (socketId) {
      // Remove from all maps
      this.emailToSocket.delete(email);
      this.users.delete(socketId);
      this.socketToEmail.delete(socketId);
      this.socketLastActivity.delete(socketId);
    }
  }
  
  // Comprehensive cleanup for a socket (called on disconnect)
  cleanupSocket(socketId) {
    const email = this.socketToEmail.get(socketId) || this.users.get(socketId);
    
    // Remove from all maps
    this.users.delete(socketId);
    this.socketToEmail.delete(socketId);
    this.socketLastActivity.delete(socketId);
    
    // Remove email mapping if this socket is still mapped
    if (email) {
      const currentSocketId = this.emailToSocket.get(email);
      if (currentSocketId === socketId) {
    this.emailToSocket.delete(email);
      }
    }
    
    return email;
  }
}

module.exports = new UserService();
