const userService = require('../services/userService');
const chatService = require('../services/chatService');
const groupService = require('../services/groupService');

let ioInstance = null;

class SocketService {
  constructor(io) {
    this.io = io;
    ioInstance = io; // Store instance globally
    this.setupSocketHandlers();
  }

  getIO() {
    return this.io || ioInstance;
  }

  static getIO() {
    return ioInstance;
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] 🔌 NEW SOCKET CONNECTION:`, {
        socketId: socket.id,
        transport: socket.conn?.transport?.name || 'unknown',
        remoteAddress: socket.handshake?.address || 'unknown',
        userAgent: socket.handshake?.headers?.['user-agent'] || 'unknown',
      });

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

  async handleLogin(socket, data) {
    const { email } = data;
    const timestamp = new Date().toISOString();
    if (email) {
      userService.setEmailToSocket(email, socket.id);
      userService.addUser(socket.id, email);
      console.log(`[${timestamp}] ✅ USER LOGIN:`, {
        email,
        socketId: socket.id,
        status: 'success',
      });
      
      // Check if user is in offline mode
      const User = require('../models/User');
      const user = await User.findOne({ email }).select('offlineMode');
      const isOfflineMode = user?.offlineMode || false;
      
      // Notify all contacts that this user is now online (or offline if offline mode is enabled)
      const Contact = require('../models/Contact');
      Contact.find({ contactEmail: email }).then((contacts) => {
        contacts.forEach((contact) => {
          const contactSocketId = userService.getSocketByEmail(contact.userEmail);
          if (contactSocketId) {
            this.io.to(contactSocketId).emit('contactOnlineStatus', {
              contactEmail: email,
              isOnline: !isOfflineMode, // Show offline if offline mode is enabled
            });
          }
        });
      }).catch((error) => {
        console.error('Error notifying contacts about online status:', error);
      });
    } else {
      console.log(`[${timestamp}] ❌ USER LOGIN FAILED:`, {
        socketId: socket.id,
        reason: 'No email provided',
        data,
      });
    }
  }

  async handleJoinChat(socket, data) {
    const timestamp = new Date().toISOString();
    const { userEmail, contactEmail } = data;
    const currentUserEmail = this.getEmailFromSocket(socket.id);
    
    console.log(`[${timestamp}] 🔗 JOIN CHAT REQUEST:`, {
      socketId: socket.id,
      userEmail,
      contactEmail,
      currentUserEmail,
    });
    
    if (!currentUserEmail || currentUserEmail !== userEmail) {
      console.log(`[${timestamp}] ❌ JOIN CHAT FAILED - Email mismatch:`, { 
        currentUserEmail, 
        userEmail,
        socketId: socket.id,
      });
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
        console.log(`[${timestamp}] 🔄 Auto-joined ${contactEmail} to room ${roomId}`);
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
      console.log(`[${timestamp}] 📬 DELIVERED PENDING MESSAGES:`, {
        count: messages.length,
        from: contactEmail,
        to: userEmail,
        roomId,
      });
      
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
            console.error(`[${timestamp}] ❌ Error marking pending message as delivered:`, {
              error: error.message,
              messageId: msg._id?.toString(),
            });
          }
        }
      }
    }

    console.log(`[${timestamp}] ✅ USER JOINED CHAT:`, {
      userEmail,
      contactEmail,
      roomId,
      pendingMessages: messages.length,
      contactOnline: !!contactSocketId,
    });
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
    const timestamp = new Date().toISOString();
    const { message, contactEmail, senderEmail: providedSenderEmail, replyTo, replyToMessage, replyToSender } = data;
    
    // Log ALL received data for debugging
    console.log(`[${timestamp}] 📨 PRIVATE MESSAGE RECEIVED ON BACKEND:`, {
      socketId: socket.id,
      providedSenderEmail,
      contactEmail,
      messageLength: message?.length || 0,
      hasReply: !!(replyTo || replyToMessage),
      hasMessage: !!message,
      dataKeys: Object.keys(data || {}),
      // Log first 100 chars of message for debugging (encrypted, so safe)
      messagePreview: message ? message.substring(0, 100) : 'no message',
    });
    
    // Try to get senderEmail from data first, fallback to socket lookup
    let senderEmail = providedSenderEmail || this.getEmailFromSocket(socket.id);
    
    if (!senderEmail || !contactEmail) {
      console.log(`[${timestamp}] ❌ PRIVATE MESSAGE FAILED - Missing data:`, { 
        senderEmail, 
        contactEmail, 
        socketId: socket.id,
        hasMessage: !!message,
      });
      return;
    }
    
    // Verify senderEmail matches the socket (security check)
    const socketEmail = this.getEmailFromSocket(socket.id);
    if (socketEmail && socketEmail !== senderEmail) {
      console.log(`[${timestamp}] ⚠️ PRIVATE MESSAGE - Email mismatch:`, { 
        provided: senderEmail, 
        socket: socketEmail,
        using: 'socket email',
      });
      // Use socket email if available, otherwise use provided
      senderEmail = socketEmail;
    }

    // Add message to MongoDB (STORED PERMANENTLY - will be delivered when user comes online)
    const messageData = {
      senderEmail,
      message: message.trim(),
      timestamp: new Date(),
      replyTo: replyTo || null,
      replyToMessage: replyToMessage || null,
      replyToSender: replyToSender || null,
    };
    
    let savedMessage;
    try {
      savedMessage = await chatService.addMessage(senderEmail, contactEmail, messageData);
      const messagePreview = message.trim().substring(0, 50);
      console.log(`[${timestamp}] ✅ MESSAGE STORED IN MONGODB:`, {
        from: senderEmail,
        to: contactEmail,
        messageId: savedMessage._id?.toString(),
        preview: messagePreview,
        fullLength: message.trim().length,
      });
    } catch (error) {
      console.error(`[${timestamp}] ❌ ERROR STORING MESSAGE:`, {
        error: error.message,
        stack: error.stack,
        senderEmail,
        contactEmail,
      });
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
          console.log(`[${timestamp}] 🔄 Auto-joined ${contactEmail} to room ${roomId}`);
        }
        
        // Send message immediately to online contact
        const messagePayload = {
          ...messageData,
          roomId,
          contactEmail: contactEmail,
          messageId: savedMessage._id.toString(),
          replyTo: savedMessage.replyTo || null,
          replyToMessage: savedMessage.replyToMessage || null,
          replyToSender: savedMessage.replyToSender || null,
        };
        
        contactSocket.emit('privateMessage', messagePayload);
        console.log(`[${timestamp}] 📤 MESSAGE DELIVERED (ONLINE):`, {
          from: senderEmail,
          to: contactEmail,
          messageId: savedMessage._id.toString(),
          contactSocketId: contactSocketId,
          status: 'delivered',
        });
        
        // Emit contacts update event to receiver to update unread count
        this.io.to(contactSocketId).emit('contactsUpdated', {
          contactEmail: senderEmail,
          action: 'message_received',
          messageId: savedMessage._id.toString(),
        });
        
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
      console.log(`[${timestamp}] ⏳ MESSAGE PENDING (OFFLINE):`, {
        from: senderEmail,
        to: contactEmail,
        messageId: savedMessage._id.toString(),
        status: 'stored_in_db',
        willDeliver: 'when_contact_comes_online',
      });
    }
    
    // Don't send message back to sender - they already have it via optimistic UI update
    // Only send to receiver (contact) if they are online

    console.log(`[${timestamp}] ✅ PRIVATE MESSAGE PROCESSED:`, {
      from: senderEmail,
      to: contactEmail,
      roomId,
      messageId: savedMessage._id.toString(),
      contactOnline: isContactOnline,
    });
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
    const timestamp = new Date().toISOString();
    const email = this.getEmailFromSocket(socket.id);
    
    if (email) {
      userService.removeEmailToSocket(email);
      userService.removeUser(socket.id);
      console.log(`[${timestamp}] 🔌 USER DISCONNECTED:`, {
        email,
        socketId: socket.id,
        reason: socket.disconnect || 'unknown',
      });
      
      // Notify all contacts that this user is now offline
      const Contact = require('../models/Contact');
      Contact.find({ contactEmail: email }).then((contacts) => {
        contacts.forEach((contact) => {
          const contactSocketId = userService.getSocketByEmail(contact.userEmail);
          if (contactSocketId) {
            this.io.to(contactSocketId).emit('contactOnlineStatus', {
              contactEmail: email,
              isOnline: false,
            });
          }
        });
      }).catch((error) => {
        console.error('Error notifying contacts about offline status:', error);
      });
    } else {
      console.log(`[${timestamp}] 🔌 SOCKET DISCONNECTED (no email):`, {
        socketId: socket.id,
      });
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
    const { message, groupId, senderEmail: providedSenderEmail, replyTo, replyToMessage, replyToSender } = data;
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
      replyTo: replyTo || null,
      replyToMessage: replyToMessage || null,
      replyToSender: replyToSender || null,
    };
    
    let savedMessage;
    try {
      savedMessage = await chatService.addGroupMessage(groupId, messageData);
      console.log(`✅ Group message STORED in MongoDB: ${senderEmail} -> Group ${groupId}: "${message.trim()}"`);
    } catch (error) {
      console.error('Error storing group message:', error);
      return;
    }
    
    // Get room ID
    const roomId = `group_${groupId}`;
    
    // Get group to calculate read status
    const group = await groupService.getGroupById(groupId);
    const allMembers = group ? group.members || [] : [];
    const readBy = savedMessage.readBy || [];
    const totalMembers = allMembers.length;
    const readCount = readBy.length;
    
    // Calculate status: if all members have read (including sender), status is 'read'
    // If some have read (more than just sender), status is 'delivered', else 'sent'
    let calculatedStatus = 'sent';
    if (readCount >= totalMembers) { // All members including sender
      calculatedStatus = 'read';
    } else if (readCount > 1) { // More than just sender has read
      calculatedStatus = 'delivered';
    }
    
    // Send message to all members in the group (including sender for consistency)
    const messagePayload = {
      ...messageData,
      _id: savedMessage._id,
      messageId: savedMessage._id,
      roomId,
      groupId,
      isPinned: savedMessage.isPinned || false,
      replyTo: savedMessage.replyTo || null,
      replyToMessage: savedMessage.replyToMessage || null,
      replyToSender: savedMessage.replyToSender || null,
      readBy: savedMessage.readBy || [],
      status: calculatedStatus,
    };
    
    // Emit to all members including sender
    this.io.to(roomId).emit('groupMessage', messagePayload);
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
      // Check if reader is in offline mode
      const User = require('../models/User');
      const reader = await User.findOne({ email: readerEmail }).select('offlineMode');
      const isOfflineMode = reader?.offlineMode || false;

      // If user is in offline mode, don't send read receipts
      if (isOfflineMode) {
        console.log(`[${new Date().toISOString()}] 🔕 User ${readerEmail} is in offline mode - read receipt blocked`);
        // Still mark as read in database (for user's own view), but don't notify sender
        const message = await chatService.getMessageById(messageId);
        if (message && message.receiverEmail === readerEmail && message.senderEmail !== readerEmail) {
          // Mark as read in DB but don't send notification
          await chatService.markMessageAsRead(messageId, readerEmail);
        }
        return; // Exit early - don't send read receipt
      }

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

