const Message = require('../models/Message');
const { ERROR_MESSAGES } = require('../constants');

class ChatService {
  // Generate room ID from two emails (sorted to ensure same room for both users)
  getRoomId(email1, email2) {
    const sorted = [email1, email2].sort();
    return `chat_${sorted[0]}_${sorted[1]}`;
  }

  // Join a chat room (in-memory tracking)
  joinRoom(email1, email2) {
    const roomId = this.getRoomId(email1, email2);
    // Room tracking is handled by socket.io rooms
    return roomId;
  }

  // Add message to MongoDB (private or group)
  async addMessage(email1, email2, messageData, groupId = null) {
    try {
      const roomId = groupId ? `group_${groupId}` : this.getRoomId(email1, email2);
      
      const message = new Message({
        roomId,
        senderEmail: messageData.senderEmail,
        receiverEmail: groupId ? null : (email1 === messageData.senderEmail ? email2 : email1),
        groupId: groupId || null,
        messageType: groupId ? 'group' : 'private',
        message: messageData.message,
        timestamp: messageData.timestamp || new Date(),
        readBy: groupId ? [messageData.senderEmail] : [],
        status: 'sent', // Initial status is 'sent'
        deliveredAt: null,
        replyTo: messageData.replyTo || null,
        replyToMessage: messageData.replyToMessage || null,
        replyToSender: messageData.replyToSender || null,
        isReminder: messageData.isReminder || false,
      });

      await message.save();
      
      return message.toObject();
    } catch (error) {
      console.error('Error adding message to DB:', error);
      throw error;
    }
  }

  // Add group message
  async addGroupMessage(groupId, messageData) {
    try {
      const roomId = `group_${groupId}`;
      
      const message = new Message({
        roomId,
        senderEmail: messageData.senderEmail,
        receiverEmail: null,
        groupId,
        messageType: 'group',
        message: messageData.message,
        timestamp: messageData.timestamp || new Date(),
        readBy: [messageData.senderEmail],
        status: 'sent', // Initial status is 'sent'
        deliveredAt: null,
        replyTo: messageData.replyTo || null,
        replyToMessage: messageData.replyToMessage || null,
        replyToSender: messageData.replyToSender || null,
        isReminder: messageData.isReminder || false,
      });

      await message.save();
      
      return message.toObject();
    } catch (error) {
      console.error('Error adding group message to DB:', error);
      throw error;
    }
  }

  // Get group messages (filtered by clearedAt if provided, with pagination)
  async getGroupMessages(groupId, clearedAt = null, limit = 100, skip = 0) {
    try {
      const query = { groupId, messageType: 'group' };
      
      // If clearedAt is provided, only get messages after that timestamp
      if (clearedAt) {
        query.timestamp = { $gt: clearedAt };
      }
      
      // Get messages with pagination - get most recent messages first, then reverse
      // This ensures we get the latest messages efficiently
      const messages = await Message.find(query)
        .sort({ timestamp: -1 }) // Sort descending to get latest first
        .limit(limit)
        .skip(skip)
        .lean();
      
      // Reverse to get chronological order (oldest first)
      return messages.reverse();
    } catch (error) {
      console.error('Error getting group messages:', error);
      return [];
    }
  }

  // Get messages from MongoDB (filtered by clearedAt if provided, with pagination)
  async getMessages(email1, email2, clearedAt = null, limit = 100, skip = 0, requestingUserEmail = null) {
    try {
      const roomId = this.getRoomId(email1, email2);
      
      const query = { roomId };
      
      // If clearedAt is provided, only get messages after that timestamp
      if (clearedAt) {
        query.timestamp = { $gt: clearedAt };
      }
      
      // Filter out reminder messages where sender is the requesting user
      // Reminder messages should only be visible to the receiver, not the sender
      if (requestingUserEmail) {
        query.$or = [
          { isReminder: { $ne: true } }, // Not a reminder message
          { isReminder: true, senderEmail: { $ne: requestingUserEmail } } // Reminder but not sent by requesting user
        ];
      }
      
      // Get messages with pagination - get most recent messages first, then reverse
      // This ensures we get the latest messages efficiently
      const messages = await Message.find(query)
        .sort({ timestamp: -1 }) // Sort descending to get latest first
        .limit(limit)
        .skip(skip)
        .lean();
      
      // Reverse to get chronological order (oldest first)
      return messages.reverse();
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Get all chat rooms for a user (from messages)
  async getUserRooms(email) {
    try {
      const rooms = await Message.distinct('roomId', {
        $or: [
          { senderEmail: email },
          { receiverEmail: email },
        ],
      });
      
      return rooms;
    } catch (error) {
      console.error('Error getting user rooms:', error);
      return [];
    }
  }

  // Get chat room participants
  getRoomParticipants(roomId) {
    // Extract emails from roomId format: chat_email1_email2
    const parts = roomId.replace('chat_', '').split('_');
    if (parts.length >= 2) {
      return [parts[0], parts.slice(1).join('_')];
    }
    return [];
  }

  // Get unread message count for a user from a specific contact
  async getUnreadCount(userEmail, contactEmail) {
    try {
      const roomId = this.getRoomId(userEmail, contactEmail);
      const count = await Message.countDocuments({
        roomId,
        receiverEmail: userEmail, // Only count messages where userEmail is the receiver
        senderEmail: contactEmail, // Only count messages from the contact (not from user themselves)
        read: false,
        messageType: 'private',
        isDeleted: { $ne: true }, // Exclude deleted messages
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Get unread message count for a user in a group
  async getGroupUnreadCount(userEmail, groupId) {
    try {
      const count = await Message.countDocuments({
        groupId,
        messageType: 'group',
        senderEmail: { $ne: userEmail }, // Exclude messages sent by the user
        readBy: { $ne: userEmail }, // Messages not read by the user
      });
      return count;
    } catch (error) {
      console.error('Error getting group unread count:', error);
      return 0;
    }
  }

  // Mark group messages as read for a user
  async markGroupMessagesAsRead(userEmail, groupId) {
    try {
      const updatedMessages = await Message.updateMany(
        {
          groupId,
          messageType: 'group',
          senderEmail: { $ne: userEmail },
          readBy: { $ne: userEmail },
        },
        {
          $addToSet: { readBy: userEmail },
        }
      );
      
      // Return updated message IDs for socket notification
      const messages = await Message.find({
        groupId,
        messageType: 'group',
        senderEmail: { $ne: userEmail },
        readBy: userEmail,
      }).select('_id readBy').lean();
      
      return {
        success: true,
        updatedCount: updatedMessages.modifiedCount,
        messages: messages,
      };
    } catch (error) {
      console.error('Error marking group messages as read:', error);
      return {
        success: false,
        updatedCount: 0,
        messages: [],
      };
    }
  }

  // Mark messages as read
  async markMessagesAsRead(userEmail, contactEmail) {
    try {
      const roomId = this.getRoomId(userEmail, contactEmail);
      await Message.updateMany(
        {
          roomId,
          receiverEmail: userEmail,
          read: false,
          messageType: 'private',
        },
        {
          $set: { read: true, status: 'read' },
        }
      );
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Mark message as delivered
  async markMessageAsDelivered(messageId) {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        {
          $set: { status: 'delivered', deliveredAt: new Date() },
        },
        { new: true }
      );
      return message;
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      return null;
    }
  }

  // Mark message as read (for private messages)
  async markMessageAsRead(messageId, readerEmail) {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        {
          $set: { status: 'read', read: true },
          $addToSet: { readBy: readerEmail },
        },
        { new: true }
      );
      return message;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return null;
    }
  }

  // Get message by ID
  async getMessageById(messageId) {
    try {
      const message = await Message.findById(messageId).lean();
      return message;
    } catch (error) {
      console.error('Error getting message by ID:', error);
      return null;
    }
  }

  // Pin a group message (only creator can pin)
  async pinMessage(messageId, userEmail, groupId) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
      }

      // Verify it's a group message
      if (message.messageType !== 'group' || !message.groupId) {
        throw new Error('Can only pin group messages');
      }

      // Verify user is the group creator
      const Group = require('../models/Group');
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
      }

      if (group.createdBy !== userEmail) {
        throw new Error('Only group creator can pin messages');
      }

      // Unpin any previously pinned message in this group
      await Message.updateMany(
        { groupId: groupId, isPinned: true },
        { isPinned: false, pinnedAt: null, pinnedBy: null }
      );

      // Pin the new message
      message.isPinned = true;
      message.pinnedAt = new Date();
      message.pinnedBy = userEmail;
      await message.save();

      return message.toObject();
    } catch (error) {
      console.error('Error pinning message:', error);
      throw error;
    }
  }

  // Unpin a group message (only creator can unpin)
  async unpinMessage(messageId, userEmail, groupId) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
      }

      // Verify it's a group message
      if (message.messageType !== 'group' || !message.groupId) {
        throw new Error('Can only unpin group messages');
      }

      // Verify user is the group creator
      const Group = require('../models/Group');
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
      }

      if (group.createdBy !== userEmail) {
        throw new Error('Only group creator can unpin messages');
      }

      // Unpin the message
      message.isPinned = false;
      message.pinnedAt = null;
      message.pinnedBy = null;
      await message.save();

      return message.toObject();
    } catch (error) {
      console.error('Error unpinning message:', error);
      throw error;
    }
  }

  // Get pinned messages for a group
  async getPinnedMessages(groupId) {
    try {
      const messages = await Message.find({
        groupId: groupId,
        isPinned: true,
      })
        .sort({ pinnedAt: -1 }) // Most recently pinned first
        .lean();

      return messages;
    } catch (error) {
      console.error('Error getting pinned messages:', error);
      return [];
    }
  }

  // Delete a message (soft delete - WhatsApp style)
  async deleteMessage(messageId, userEmail) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
      }

      // Only sender can delete their own message
      if (message.senderEmail !== userEmail) {
        throw new Error('You can only delete your own messages');
      }

      // Soft delete - set isDeleted flag and update message text
      message.isDeleted = true;
      message.deletedAt = new Date();
      message.message = 'This message is deleted';
      await message.save();

      return message.toObject();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Edit a message (only if not read yet)
  async editMessage(messageId, userEmail, newMessage) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
      }

      // Only sender can edit their own message
      if (message.senderEmail !== userEmail) {
        throw new Error('You can only edit your own messages');
      }

      // Check if message has been read
      // For private messages: check if status is 'read'
      // For group messages: check if readBy contains anyone other than sender
      if (message.messageType === 'private') {
        if (message.status === 'read') {
          throw new Error('Cannot edit message that has been read');
        }
      } else if (message.messageType === 'group') {
        const readByOthers = message.readBy.filter(email => email !== userEmail);
        if (readByOthers.length > 0) {
          throw new Error('Cannot edit message that has been read');
        }
      }

      // Update message
      message.editedMessage = newMessage;
      message.editedAt = new Date();
      // Also update the main message field for backward compatibility
      message.message = newMessage;
      await message.save();

      return message.toObject();
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();
