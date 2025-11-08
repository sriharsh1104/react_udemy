const userService = require('../services/userService');
const chatService = require('../services/chatService');
const groupService = require('../services/groupService');

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

      // Handle joining a group
      socket.on('joinGroup', (data) => {
        this.handleJoinGroup(socket, data);
      });

      // Handle leaving a group
      socket.on('leaveGroup', (data) => {
        this.handleLeaveGroup(socket, data);
      });

      // Handle incoming group messages
      socket.on('groupMessage', (data) => {
        this.handleGroupMessage(socket, data);
      });

      // Handle typing indicator in group chat
      socket.on('groupTyping', (data) => {
        this.handleGroupTyping(socket, data);
      });

      // Handle message read receipt
      socket.on('messageRead', (data) => {
        this.handleMessageRead(socket, data);
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
      
      // Mark all pending messages as delivered and notify senders
      for (const msg of messages) {
        if (msg.status === 'sent' && msg.senderEmail !== userEmail) {
          try {
            const updatedMessage = await chatService.markMessageAsDelivered(msg._id);
            if (updatedMessage) {
              // Notify sender that message was delivered
              const senderSocketId = userService.getSocketByEmail(msg.senderEmail);
              if (senderSocketId) {
                const senderSocket = this.io.sockets.sockets.get(senderSocketId);
                if (senderSocket) {
                  senderSocket.emit('messageStatusUpdate', {
                    messageId: msg._id.toString(),
                    status: 'delivered',
                    deliveredAt: updatedMessage.deliveredAt,
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error marking pending message as delivered:', error);
          }
        }
      }
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
    const { message, contactEmail, senderEmail: providedSenderEmail } = data;
    // Try to get senderEmail from data first, fallback to socket lookup
    let senderEmail = providedSenderEmail || this.getEmailFromSocket(socket.id);
    
    if (!senderEmail || !contactEmail) {
      console.log('Missing senderEmail or contactEmail:', { senderEmail, contactEmail, socketId: socket.id });
      return;
    }
    
    // Verify senderEmail matches the socket (security check)
    const socketEmail = this.getEmailFromSocket(socket.id);
    if (socketEmail && socketEmail !== senderEmail) {
      console.log('SenderEmail mismatch:', { provided: senderEmail, socket: socketEmail });
      // Use socket email if available, otherwise use provided
      senderEmail = socketEmail;
    }

    // Add message to MongoDB (STORED PERMANENTLY - will be delivered when user comes online)
    const messageData = {
      senderEmail,
      message: message.trim(),
      timestamp: new Date(),
    };
    
    let savedMessage;
    try {
      savedMessage = await chatService.addMessage(senderEmail, contactEmail, messageData);
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
          messageId: savedMessage._id.toString(),
        };
        
        contactSocket.emit('privateMessage', messagePayload);
        console.log(`📤 Message DELIVERED (online): ${contactEmail} received message from ${senderEmail}`);
        
        // Mark message as delivered and notify sender
        try {
          const updatedMessage = await chatService.markMessageAsDelivered(savedMessage._id);
          if (updatedMessage) {
            // Notify sender that message was delivered
            const senderSocketId = userService.getSocketByEmail(senderEmail);
            if (senderSocketId) {
              const senderSocket = this.io.sockets.sockets.get(senderSocketId);
              if (senderSocket) {
                senderSocket.emit('messageStatusUpdate', {
                  messageId: savedMessage._id.toString(),
                  status: 'delivered',
                  deliveredAt: updatedMessage.deliveredAt,
                });
              }
            }
          }
        } catch (error) {
          console.error('Error marking message as delivered:', error);
        }
      }
    } else {
      // Contact is OFFLINE - message is stored in MongoDB, will be delivered when they come online
      // Status remains 'sent' until they come online
      console.log(`⏳ Message PENDING (offline): ${contactEmail} is offline. Message stored in MongoDB, will be delivered when they come online.`);
    }
    
    // Don't send message back to sender - they already have it via optimistic UI update
    // Only send to receiver (contact) if they are online

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

  async handleJoinGroup(socket, data) {
    const { groupId } = data;
    const userEmail = this.getEmailFromSocket(socket.id);
    
    if (!userEmail || !groupId) {
      console.log('Join group failed: missing data', { userEmail, groupId });
      return;
    }

    // Check if user is a member
    const isMember = await groupService.isMember(groupId, userEmail);
    if (!isMember) {
      console.log(`User ${userEmail} tried to join group ${groupId} but is not a member`);
      return;
    }

    const roomId = `group_${groupId}`;
    socket.join(roomId);
    
    // Send existing messages from MongoDB
    const messages = await chatService.getGroupMessages(groupId);
    socket.emit('groupChatHistory', {
      groupId,
      roomId,
      messages,
    });

    if (messages.length > 0) {
      console.log(`📬 DELIVERED ${messages.length} pending message(s) to ${userEmail} in group ${groupId}`);
    }

    console.log(`User ${userEmail} joined group ${groupId} (room: ${roomId})`);
  }

  handleLeaveGroup(socket, data) {
    const { groupId } = data;
    if (groupId) {
      const roomId = `group_${groupId}`;
      socket.leave(roomId);
      const userEmail = this.getEmailFromSocket(socket.id);
      console.log(`User ${userEmail} left group ${groupId}`);
    }
  }

  async handleGroupMessage(socket, data) {
    const { message, groupId, senderEmail: providedSenderEmail } = data;
    // Try to get senderEmail from data first, fallback to socket lookup
    let senderEmail = providedSenderEmail || this.getEmailFromSocket(socket.id);
    
    if (!senderEmail || !groupId) {
      console.log('Missing senderEmail or groupId:', { senderEmail, groupId, socketId: socket.id });
      return;
    }
    
    // Verify senderEmail matches the socket (security check)
    const socketEmail = this.getEmailFromSocket(socket.id);
    if (socketEmail && socketEmail !== senderEmail) {
      console.log('SenderEmail mismatch:', { provided: senderEmail, socket: socketEmail });
      // Use socket email if available, otherwise use provided
      senderEmail = socketEmail;
    }

    // Check if user is a member
    const isMember = await groupService.isMember(groupId, senderEmail);
    if (!isMember) {
      console.log(`User ${senderEmail} tried to send message to group ${groupId} but is not a member`);
      return;
    }

    // Add message to MongoDB
    const messageData = {
      senderEmail,
      message: message.trim(),
      timestamp: new Date(),
    };
    
    try {
      await chatService.addGroupMessage(groupId, messageData);
      console.log(`✅ Group message STORED in MongoDB: ${senderEmail} -> Group ${groupId}: "${message.trim()}"`);
    } catch (error) {
      console.error('Error storing group message:', error);
      return;
    }
    
    // Get room ID
    const roomId = `group_${groupId}`;
    
    // Send message to all members in the group (except sender)
    const messagePayload = {
      ...messageData,
      roomId,
      groupId,
    };
    
    socket.to(roomId).emit('groupMessage', messagePayload);
    console.log(`📤 Group message DELIVERED: Group ${groupId} received message from ${senderEmail}`);
  }

  handleGroupTyping(socket, data) {
    const { groupId, isTyping } = data;
    const senderEmail = this.getEmailFromSocket(socket.id);
    
    if (!senderEmail || !groupId) {
      return;
    }

    const roomId = `group_${groupId}`;
    
    // Send typing indicator to all other members in the group
    socket.to(roomId).emit('groupTyping', {
      senderEmail,
      groupId,
      isTyping,
    });
  }

  async handleMessageRead(socket, data) {
    const { messageId, senderEmail } = data;
    const readerEmail = this.getEmailFromSocket(socket.id);
    
    if (!readerEmail || !messageId) {
      return;
    }

    try {
      // Get the message to verify it exists and get sender
      const message = await chatService.getMessageById(messageId);
      if (!message) {
        console.log('Message not found for read receipt:', messageId);
        return;
      }

      // Only mark as read if the reader is the receiver
      if (message.receiverEmail === readerEmail && message.senderEmail !== readerEmail) {
        const updatedMessage = await chatService.markMessageAsRead(messageId, readerEmail);
        if (updatedMessage) {
          // Notify sender that message was read
          const senderSocketId = userService.getSocketByEmail(message.senderEmail);
          if (senderSocketId) {
            const senderSocket = this.io.sockets.sockets.get(senderSocketId);
            if (senderSocket) {
              senderSocket.emit('messageStatusUpdate', {
                messageId: messageId,
                status: 'read',
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling message read:', error);
    }
  }

  getEmailFromSocket(socketId) {
    const user = userService.getUser(socketId);
    return user || null;
  }
}

module.exports = SocketService;

