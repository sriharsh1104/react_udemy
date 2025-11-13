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

      // Track socket connection for cleanup
      socket.connectedAt = Date.now();

      // Handle user login (associate email with socket)
      socket.on('login', (data) => {
        this.handleLogin(socket, data);
      });
      
      // Handle socket errors to prevent crashes
      socket.on('error', (error) => {
        console.error(`[${timestamp}] ❌ SOCKET ERROR:`, {
          socketId: socket.id,
          error: error.message,
        });
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
      
      // Check if user is in offline mode
      const User = require('../models/User');
      const user = await User.findOne({ email }).select('offlineMode');
      const isOfflineMode = user?.offlineMode || false;
      
      // Notify all contacts that this user is now online (or offline if offline mode is enabled)
      // OPTIMIZED: Batch socket lookups to avoid N+1 queries
      try {
      const Contact = require('../models/Contact');
        const contacts = await Contact.find({ contactEmail: email }).select('userEmail').lean();
        
        // Batch all socket lookups at once
        const contactEmails = contacts.map(c => c.userEmail);
        const socketNotifications = [];
        
        for (const contactEmail of contactEmails) {
          const contactSocketId = userService.getSocketByEmail(contactEmail);
          if (contactSocketId) {
            socketNotifications.push({
              socketId: contactSocketId,
              data: {
              contactEmail: email,
                isOnline: !isOfflineMode,
              },
            });
          }
        }
        
        // Emit all notifications in batch
        socketNotifications.forEach(({ socketId, data }) => {
          this.io.to(socketId).emit('contactOnlineStatus', data);
        });
      } catch (error) {
        console.error('Error notifying contacts about online status:', error);
      }
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
    
    // Get clearedAt timestamp for this user
    const contactsService = require('./contactsService');
    const clearedAt = await contactsService.getClearedAt(userEmail, contactEmail);
    
    // Send existing messages (PENDING MESSAGES) from MongoDB to the user when they come online
    // Filter out messages before clearedAt timestamp, limit to 100 most recent messages
    const messages = await chatService.getMessages(userEmail, contactEmail, clearedAt, 100, 0);
    socket.emit('chatHistory', {
      roomId,
      messages,
      contactEmail,
    });

    if (messages.length > 0) {
      // OPTIMIZED: Batch message delivery status updates to avoid N+1 queries
      const pendingMessages = messages.filter(msg => msg.status === 'sent' && msg.senderEmail !== userEmail);
      
      // Batch update all messages as delivered
      const updatePromises = pendingMessages.map(async (msg) => {
          try {
            const updatedMessage = await chatService.markMessageAsDelivered(msg._id);
          return { msg, updatedMessage };
          } catch (error) {
            console.error(`[${timestamp}] ❌ Error marking pending message as delivered:`, {
              error: error.message,
              messageId: msg._id?.toString(),
          });
          return null;
        }
      });
      
      const updateResults = await Promise.all(updatePromises);
      
      // Batch socket lookups for all senders
      const senderEmails = new Set(updateResults
        .filter(r => r && r.updatedMessage)
        .map(r => r.msg.senderEmail));
      
      // Notify all senders in batch
      for (const senderEmail of senderEmails) {
        const senderSocketId = userService.getSocketByEmail(senderEmail);
        if (senderSocketId) {
          const senderSocket = this.io.sockets.sockets.get(senderSocketId);
          if (senderSocket) {
            // Get all message IDs for this sender
            const senderMessages = updateResults
              .filter(r => r && r.updatedMessage && r.msg.senderEmail === senderEmail)
              .map(r => ({
                messageId: r.msg._id.toString(),
                status: 'delivered',
                deliveredAt: r.updatedMessage.deliveredAt,
              }));
            
            // Emit status updates for all messages from this sender
            senderMessages.forEach(messageUpdate => {
              senderSocket.emit('messageStatusUpdate', messageUpdate);
            });
          }
        }
      }
    }

  }

  handleLeaveChat(socket, data) {
    const { userEmail, contactEmail } = data;
    if (userEmail && contactEmail) {
      const roomId = chatService.getRoomId(userEmail, contactEmail);
      socket.leave(roomId);
    }
  }

  async handlePrivateMessage(socket, data) {
    const timestamp = new Date().toISOString();
    const { message, contactEmail, senderEmail: providedSenderEmail, replyTo, replyToMessage, replyToSender } = data;
    
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
      // Use socket email if available, otherwise use provided
      senderEmail = socketEmail;
    }

    // Automatically create contacts for both users if they don't exist
    // This ensures deleted contacts reappear when messaging resumes
    try {
      const contactsService = require('./contactsService');
      
      // Add contactEmail as a contact for sender (if not exists or unarchive if archived)
      const senderContactUpdated = await contactsService.addContact(senderEmail, contactEmail);
      
      // Add senderEmail as a contact for receiver (if not exists or unarchive if archived)
      await contactsService.addContact(contactEmail, senderEmail);
      
      console.log(`[${timestamp}] ✅ CONTACTS AUTO-CREATED/UPDATED for message exchange`);
      
      // Emit contactsUpdated event to sender immediately after unarchiving
      // This ensures the contact appears in Recent Chats right away
      const senderSocketId = userService.getSocketByEmail(senderEmail);
      if (senderSocketId) {
        this.io.to(senderSocketId).emit('contactsUpdated', {
          contactEmail: contactEmail,
          action: 'contact_unarchived',
          messageId: null, // Message not saved yet, will be saved next
        });
        console.log(`[${timestamp}] 🔔 CONTACTS_UPDATED event emitted to sender (unarchive)`);
      }
    } catch (contactError) {
      // Log but don't fail - contact creation is not critical for message delivery
      console.log(`[${timestamp}] ⚠️ Contact auto-creation warning:`, contactError.message);
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
        // Emit contacts update event to receiver to update unread count and refresh contact list
        this.io.to(contactSocketId).emit('contactsUpdated', {
          contactEmail: senderEmail,
          action: 'message_received',
          messageId: savedMessage._id.toString(),
        });
        
        // Also emit to sender to refresh their contact list (in case contact was re-added)
        const senderSocketId = userService.getSocketByEmail(senderEmail);
        if (senderSocketId) {
          this.io.to(senderSocketId).emit('contactsUpdated', {
            contactEmail: contactEmail,
            action: 'message_sent',
            messageId: savedMessage._id.toString(),
          });
        }
        
        // Mark message as delivered and notify sender
        try {
          const updatedMessage = await chatService.markMessageAsDelivered(savedMessage._id);
          if (updatedMessage && senderSocketId) {
              const senderSocket = this.io.sockets.sockets.get(senderSocketId);
              if (senderSocket) {
                senderSocket.emit('messageStatusUpdate', {
                  messageId: savedMessage._id.toString(),
                  status: 'delivered',
                  deliveredAt: updatedMessage.deliveredAt,
                });
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
      
      // Emit contacts update event to sender to refresh their contact list (in case contact was re-added)
      const senderSocketId = userService.getSocketByEmail(senderEmail);
      if (senderSocketId) {
        this.io.to(senderSocketId).emit('contactsUpdated', {
          contactEmail: contactEmail,
          action: 'message_sent',
          messageId: savedMessage._id.toString(),
        });
      }
    }
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
    const socketId = socket.id;
    
    // COMPREHENSIVE CLEANUP: Remove socket from all maps to prevent memory leaks
    const email = userService.cleanupSocket(socketId);
    
    if (email) {
      console.log(`[${timestamp}] 🔌 SOCKET DISCONNECTED:`, {
        socketId,
        email,
      });
      
      // Notify all contacts that this user is now offline
      // OPTIMIZED: Batch socket lookups to avoid N+1 queries
      const Contact = require('../models/Contact');
      Contact.find({ contactEmail: email }).select('userEmail').lean().then((contacts) => {
        // Batch all socket lookups at once
        const contactEmails = contacts.map(c => c.userEmail);
        const socketNotifications = [];
        
        for (const contactEmail of contactEmails) {
          const contactSocketId = userService.getSocketByEmail(contactEmail);
          if (contactSocketId) {
            socketNotifications.push({
              socketId: contactSocketId,
              data: {
              contactEmail: email,
              isOnline: false,
              },
            });
          }
        }
        
        // Emit all notifications in batch
        socketNotifications.forEach(({ socketId, data }) => {
          this.io.to(socketId).emit('contactOnlineStatus', data);
        });
      }).catch((error) => {
        console.error('Error notifying contacts about offline status:', error);
      });
    } else {
      console.log(`[${timestamp}] 🔌 SOCKET DISCONNECTED (no email):`, {
        socketId,
      });
    }
    
    // Additional cleanup: Leave all rooms this socket was in
    if (socket.rooms) {
      socket.rooms.forEach((roomId) => {
        socket.leave(roomId);
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
    // Get clearedAt timestamp for this user in this group
    const clearedAt = await groupService.getClearedAt(groupId, userEmail);
    
    // Filter out messages before clearedAt timestamp, limit to 100 most recent messages
    const messages = await chatService.getGroupMessages(groupId, clearedAt, 100, 0);
    socket.emit('groupChatHistory', {
      groupId,
      roomId,
      messages,
    });

    if (messages.length > 0) {
      console.log(`📬 DELIVERED ${messages.length} pending message(s) to ${userEmail} in group ${groupId}`);
    }

  }

  handleLeaveGroup(socket, data) {
    const { groupId } = data;
    if (groupId) {
      const roomId = `group_${groupId}`;
      socket.leave(roomId);
      const userEmail = this.getEmailFromSocket(socket.id);
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

    // Unarchive group for sender if it was archived (new message means it should appear in Recent Chats)
    let groupUnarchived = false;
    try {
      const Group = require('../models/Group');
      const group = await Group.findById(groupId);
      if (group && group.archivedBy && group.archivedBy.includes(senderEmail)) {
        group.archivedBy = group.archivedBy.filter(email => email !== senderEmail);
        group.updatedAt = new Date();
        await group.save();
        groupUnarchived = true;  
        // Emit groupsUpdated event to sender immediately after unarchiving
        // This ensures the group appears in Recent Chats right away
        const senderSocketId = userService.getSocketByEmail(senderEmail);
        if (senderSocketId) {
          this.io.to(senderSocketId).emit('groupsUpdated', {
            groupId: groupId,
            action: 'group_unarchived',
          });
        }
      }
    } catch (error) {
      // Log but don't fail - unarchiving is not critical for message delivery
      console.log(`⚠️ Error unarchiving group:`, error.message);
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

