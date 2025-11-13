const userService = require('../services/userService');
const userProfileService = require('../services/userProfileService');
const bcrypt = require('bcryptjs');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHelper');

class SettingsController {
  // Set password (first time)
  async setPassword(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { password } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!password || password.length < 6) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password must be at least 6 characters');
      }

      // Check if password already exists (need to check with password field)
      const User = require('../models/User');
      const user = await User.findOne({ email: userEmail }).select('password');
      if (user && user.password) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password already set. Use change password instead.');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user with password
      await userProfileService.updatePassword(userEmail, hashedPassword);

      return sendSuccess(res, HTTP_STATUS.OK, 'Password set successfully');
    } catch (error) {
      console.error('Error in setPassword:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { currentPassword, newPassword } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!currentPassword || !newPassword) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Current password and new password are required');
      }

      if (newPassword.length < 6) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'New password must be at least 6 characters');
      }

      // Get user with password field
      const User = require('../models/User');
      const user = await User.findOne({ email: userEmail }).select('password');
      if (!user || !user.password) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password not set. Please set password first.');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await userProfileService.updatePassword(userEmail, hashedPassword);

      return sendSuccess(res, HTTP_STATUS.OK, 'Password changed successfully');
    } catch (error) {
      console.error('Error in changePassword:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Check if password is set
  async checkPasswordStatus(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      // Check password status (need to query with password field)
      const User = require('../models/User');
      const user = await User.findOne({ email: userEmail }).select('password');
      const hasPassword = !!(user && user.password);

      return sendSuccess(res, HTTP_STATUS.OK, 'Password status retrieved successfully', {
        hasPassword,
      });
    } catch (error) {
      console.error('Error in checkPasswordStatus:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Get offline mode status
  async getOfflineMode(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      const User = require('../models/User');
      const user = await User.findOne({ email: userEmail }).select('offlineMode');
      const offlineMode = user?.offlineMode || false;

      return sendSuccess(res, HTTP_STATUS.OK, 'Offline mode status retrieved successfully', {
        offlineMode,
      });
    } catch (error) {
      console.error('Error in getOfflineMode:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Toggle offline mode
  async toggleOfflineMode(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { offlineMode } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (typeof offlineMode !== 'boolean') {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'offlineMode must be a boolean value');
      }

      const User = require('../models/User');
      // Get current offline mode status before updating
      const currentUser = await User.findOne({ email: userEmail }).select('offlineMode');
      const wasOfflineMode = currentUser?.offlineMode || false;
      
      const user = await User.findOneAndUpdate(
        { email: userEmail },
        { 
          offlineMode,
          updatedAt: new Date(),
        },
        { new: true }
      ).select('offlineMode');

      if (!user) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
      }

      // Emit socket event to notify contacts about online status change
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io) {
        // Notify all contacts that this user's online status has changed
        const Contact = require('../models/Contact');
        const contacts = await Contact.find({ 
          $or: [
            { userEmail: userEmail },
            { contactEmail: userEmail }
          ]
        }).lean();

        const affectedEmails = new Set();
        contacts.forEach(contact => {
          if (contact.userEmail === userEmail) {
            affectedEmails.add(contact.contactEmail);
          } else {
            affectedEmails.add(contact.userEmail);
          }
        });

        // Emit to all affected contacts
        affectedEmails.forEach(contactEmail => {
          const contactSocketId = userService.getSocketByEmail(contactEmail);
          if (contactSocketId) {
            const contactSocket = io.sockets.sockets.get(contactSocketId);
            if (contactSocket) {
              contactSocket.emit('contactOnlineStatus', {
                contactEmail: userEmail,
                isOnline: !offlineMode, // If offline mode is on, show as offline
              });
            }
          }
        });

        // If switching from offline to online, send read receipts for all messages read during offline mode
        if (wasOfflineMode && !offlineMode) {
          console.log(`[${new Date().toISOString()}] 🔄 User ${userEmail} switched from offline to online - sending pending read receipts`);
          
          try {
            const Message = require('../models/Message');
            const chatService = require('../services/chatService');
            
            // Find all messages that:
            // 1. Were received by this user (receiverEmail = userEmail)
            // 2. Are marked as read (read: true OR userEmail in readBy array)
            // 3. But status is not 'read' (might be 'sent' or 'delivered')
            // These are messages read during offline mode
            const pendingReadMessages = await Message.find({
              receiverEmail: userEmail,
              messageType: 'private',
              $or: [
                { read: true, status: { $ne: 'read' } },
                { readBy: userEmail, status: { $ne: 'read' } }
              ]
            }).lean();

            console.log(`[${new Date().toISOString()}] 📬 Found ${pendingReadMessages.length} messages to send read receipts for`);

            // Send read receipts for each message
            for (const message of pendingReadMessages) {
              try {
                // Update message status to 'read' if not already
                await Message.findByIdAndUpdate(
                  message._id,
                  {
                    $set: { status: 'read' },
                    $addToSet: { readBy: userEmail }
                  }
                );

                // Notify sender that message was read
                const senderSocketId = userService.getSocketByEmail(message.senderEmail);
                if (senderSocketId) {
                  const senderSocket = io.sockets.sockets.get(senderSocketId);
                  if (senderSocket) {
                    senderSocket.emit('messageStatusUpdate', {
                      messageId: message._id.toString(),
                      status: 'read',
                    });
                    console.log(`[${new Date().toISOString()}] ✅ Sent read receipt for message ${message._id} to ${message.senderEmail}`);
                  }
                }
              } catch (error) {
                console.error(`Error sending read receipt for message ${message._id}:`, error);
              }
            }

            console.log(`[${new Date().toISOString()}] ✅ Completed sending read receipts for ${pendingReadMessages.length} messages`);
          } catch (error) {
            console.error('Error processing pending read receipts:', error);
            // Don't fail the request if read receipts fail
          }
        }
      }

      return sendSuccess(res, HTTP_STATUS.OK, `Offline mode ${offlineMode ? 'enabled' : 'disabled'}`, {
        offlineMode: user.offlineMode,
      });
    } catch (error) {
      console.error('Error in toggleOfflineMode:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }
}

module.exports = new SettingsController();

