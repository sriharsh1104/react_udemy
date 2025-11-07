// Chat Service - manages one-on-one private chats
class ChatService {
  constructor() {
    // roomId -> [messages]
    this.chatRooms = new Map();
    // email -> [roomIds]
    this.userRooms = new Map();
  }

  // Generate room ID from two emails (sorted to ensure same room for both users)
  getRoomId(email1, email2) {
    const sorted = [email1, email2].sort();
    return `chat_${sorted[0]}_${sorted[1]}`;
  }

  // Join a chat room
  joinRoom(email1, email2) {
    const roomId = this.getRoomId(email1, email2);
    
    // Initialize room if doesn't exist
    if (!this.chatRooms.has(roomId)) {
      this.chatRooms.set(roomId, []);
    }

    // Track user rooms
    if (!this.userRooms.has(email1)) {
      this.userRooms.set(email1, []);
    }
    if (!this.userRooms.get(email1).includes(roomId)) {
      this.userRooms.get(email1).push(roomId);
    }

    if (!this.userRooms.has(email2)) {
      this.userRooms.set(email2, []);
    }
    if (!this.userRooms.get(email2).includes(roomId)) {
      this.userRooms.get(email2).push(roomId);
    }

    return roomId;
  }

  // Add message to a chat room
  addMessage(email1, email2, messageData) {
    const roomId = this.getRoomId(email1, email2);
    
    if (!this.chatRooms.has(roomId)) {
      this.chatRooms.set(roomId, []);
    }

    const messages = this.chatRooms.get(roomId);
    messages.push({
      ...messageData,
      roomId,
      timestamp: new Date().toISOString(),
    });

    return messages;
  }

  // Get messages for a chat room
  getMessages(email1, email2) {
    const roomId = this.getRoomId(email1, email2);
    return this.chatRooms.get(roomId) || [];
  }

  // Get all chat rooms for a user
  getUserRooms(email) {
    return this.userRooms.get(email) || [];
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

