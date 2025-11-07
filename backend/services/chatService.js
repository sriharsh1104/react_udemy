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

  // Add message to MongoDB
  async addMessage(email1, email2, messageData) {
    try {
      const roomId = this.getRoomId(email1, email2);
      
      const message = new Message({
        roomId,
        senderEmail: messageData.senderEmail,
        receiverEmail: email1 === messageData.senderEmail ? email2 : email1,
        message: messageData.message,
        timestamp: messageData.timestamp || new Date(),
      });

      await message.save();
      
      return message.toObject();
    } catch (error) {
      console.error('Error adding message to DB:', error);
      throw error;
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
}

module.exports = new ChatService();
