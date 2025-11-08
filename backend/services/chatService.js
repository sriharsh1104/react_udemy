const Message = require('../models/Message');

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
      });

      await message.save();
      
      return message.toObject();
    } catch (error) {
      console.error('Error adding group message to DB:', error);
      throw error;
    }
  }

  // Get group messages
  async getGroupMessages(groupId) {
    try {
      const messages = await Message.find({ groupId, messageType: 'group' })
        .sort({ timestamp: 1 })
        .lean();
      
      return messages;
    } catch (error) {
      console.error('Error getting group messages:', error);
      return [];
    }
  }

  // Get messages from MongoDB
  async getMessages(email1, email2) {
    try {
      const roomId = this.getRoomId(email1, email2);
      
      const messages = await Message.find({ roomId })
        .sort({ timestamp: 1 })
        .lean();
      
      return messages;
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
        receiverEmail: userEmail,
        senderEmail: contactEmail,
        read: false,
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
      await Message.updateMany(
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
      return true;
    } catch (error) {
      console.error('Error marking group messages as read:', error);
      return false;
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
          senderEmail: contactEmail,
          read: false,
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
}

module.exports = new ChatService();
