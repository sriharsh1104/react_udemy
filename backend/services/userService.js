const Session = require('../models/Session');

class UserService {
  constructor() {
    // Keep in-memory for socket connections (temporary)
    this.users = new Map(); // socketId -> username
    this.emailToSocket = new Map(); // email -> socketId
  }

  addUser(socketId, username) {
    this.users.set(socketId, username);
    return Array.from(this.users.values());
  }

  removeUser(socketId) {
    const username = this.users.get(socketId);
    this.users.delete(socketId);
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
    this.emailToSocket.set(email, socketId);
  }

  getSocketByEmail(email) {
    return this.emailToSocket.get(email);
  }

  removeEmailToSocket(email) {
    this.emailToSocket.delete(email);
  }
}

module.exports = new UserService();
