const userService = require('../services/userService');
const chatService = require('../services/chatService');

class SocketService {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle user login (associate email with socket)
      socket.on('login', (data) => {
        this.handleLogin(socket, data);
      });

      // Handle joining a private chat room
      socket.on('joinChat', (data) => {
        this.handleJoinChat(socket, data);
      });

      // Handle leaving a chat room
      socket.on('leaveChat', (data) => {
        this.handleLeaveChat(socket, data);
      });

      // Handle incoming private messages
      socket.on('privateMessage', (data) => {
        this.handlePrivateMessage(socket, data);
      });

      // Handle typing indicator in private chat
      socket.on('typing', (data) => {
        this.handleTyping(socket, data);
      });

      // Handle user disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  handleLogin(socket, data) {
    const { email } = data;
    if (email) {
      userService.setEmailToSocket(email, socket.id);
      userService.addUser(socket.id, email);
      console.log(`User logged in: ${email} (socket: ${socket.id})`);
    }
  }

  async handleJoinChat(socket, data) {
    const { userEmail, contactEmail } = data;
    const currentUserEmail = this.getEmailFromSocket(socket.id);
    
    if (!currentUserEmail || currentUserEmail !== userEmail) {
      console.log('Join chat failed: email mismatch', { currentUserEmail, userEmail });
      return;
    }

    const roomId = chatService.joinRoom(userEmail, contactEmail);
    socket.join(roomId);
    
    // Also ensure the contact is in the room if they're online
    const contactSocketId = userService.getSocketByEmail(contactEmail);
    if (contactSocketId) {
      const contactSocket = this.io.sockets.sockets.get(contactSocketId);
      if (contactSocket && !contactSocket.rooms.has(roomId)) {
        contactSocket.join(roomId);
        console.log(`Auto-joined ${contactEmail} to room ${roomId}`);
      }
    }
    
    // Send existing messages (PENDING MESSAGES) from MongoDB to the user when they come online
    const messages = await chatService.getMessages(userEmail, contactEmail);
    socket.emit('chatHistory', {
      roomId,
      messages,
      contactEmail,
    });

    if (messages.length > 0) {
      console.log(`📬 DELIVERED ${messages.length} pending message(s) to ${userEmail} from ${contactEmail}`);
    }

    console.log(`User ${userEmail} joined chat with ${contactEmail} (room: ${roomId})`);
  }

  handleLeaveChat(socket, data) {
    const { userEmail, contactEmail } = data;
    if (userEmail && contactEmail) {
      const roomId = chatService.getRoomId(userEmail, contactEmail);
      socket.leave(roomId);
      console.log(`User ${userEmail} left chat with ${contactEmail}`);
    }
  }

  async handlePrivateMessage(socket, data) {
    const { message, contactEmail } = data;
    const senderEmail = this.getEmailFromSocket(socket.id);
    
    if (!senderEmail || !contactEmail) {
      console.log('Missing senderEmail or contactEmail:', { senderEmail, contactEmail });
      return;
    }

    // Add message to MongoDB (STORED PERMANENTLY - will be delivered when user comes online)
    const messageData = {
      senderEmail,
      message: message.trim(),
      timestamp: new Date(),
    };
    
    try {
      await chatService.addMessage(senderEmail, contactEmail, messageData);
      console.log(`✅ Message STORED in MongoDB: ${senderEmail} -> ${contactEmail}: "${message.trim()}"`);
    } catch (error) {
      console.error('Error storing message:', error);
      return;
    }
    
    // Get room ID
    const roomId = chatService.getRoomId(senderEmail, contactEmail);
    
    // Check if contact is online
    const contactSocketId = userService.getSocketByEmail(contactEmail);
    const isContactOnline = !!contactSocketId;
    
    if (isContactOnline) {
      // Contact is ONLINE - send message immediately
      const contactSocket = this.io.sockets.sockets.get(contactSocketId);
      if (contactSocket) {
        // Ensure contact is in the room
        if (!contactSocket.rooms.has(roomId)) {
          contactSocket.join(roomId);
          console.log(`Auto-joined ${contactEmail} to room ${roomId}`);
        }
        
        // Send message immediately to online contact
        const messagePayload = {
          ...messageData,
          roomId,
          contactEmail: contactEmail,
        };
        
        contactSocket.emit('privateMessage', messagePayload);
        console.log(`📤 Message DELIVERED (online): ${contactEmail} received message from ${senderEmail}`);
      }
    } else {
      // Contact is OFFLINE - message is stored in MongoDB, will be delivered when they come online
      console.log(`⏳ Message PENDING (offline): ${contactEmail} is offline. Message stored in MongoDB, will be delivered when they come online.`);
    }
    
    // Always send to sender for immediate feedback
    const messagePayload = {
      ...messageData,
      roomId,
      contactEmail: contactEmail,
    };
    socket.emit('privateMessage', messagePayload);

    console.log(`Message from ${senderEmail} to ${contactEmail} in room ${roomId}: ${message}`);
  }

  handleTyping(socket, data) {
    const { contactEmail, isTyping } = data;
    const senderEmail = this.getEmailFromSocket(socket.id);
    
    if (!senderEmail || !contactEmail) {
      return;
    }

    const roomId = chatService.getRoomId(senderEmail, contactEmail);
    
    // Send typing indicator only to the other user in the room
    socket.to(roomId).emit('typing', {
      senderEmail,
      contactEmail,
      isTyping,
    });
  }

  handleDisconnect(socket) {
    const email = this.getEmailFromSocket(socket.id);
    
    if (email) {
      userService.removeEmailToSocket(email);
      userService.removeUser(socket.id);
      console.log(`User disconnected: ${email} (socket: ${socket.id})`);
    }
  }

  getEmailFromSocket(socketId) {
    const user = userService.getUser(socketId);
    return user || null;
  }
}

module.exports = SocketService;

