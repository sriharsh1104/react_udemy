const contactsService = require('../services/contactsService');
const userService = require('../services/userService');
const userProfileService = require('../services/userProfileService');

class ContactsController {
  // Check if phone number is registered in app
  async checkPhoneRegistered(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { phone } = req.query;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
      }

      // Normalize phone number (remove spaces, +, etc.)
      const normalizedPhone = phone.replace(/[\s\+\-\(\)]/g, '');
      
      // Check if phone number exists in any user's profile
      const email = await userProfileService.getEmailByPhone(normalizedPhone);
      
      if (email) {
        const profile = await userProfileService.getProfileByEmail(email);
        return res.status(200).json({
          success: true,
          message: 'User is registered on the platform',
          registered: true,
          email,
          name: profile?.name || email.split('@')[0],
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User is not registered on the platform',
        registered: false,
      });
    } catch (error) {
      console.error('Error in checkPhoneRegistered:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Batch check multiple phone numbers
  async checkPhonesBatch(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { phones } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!phones || !Array.isArray(phones)) {
        return res.status(400).json({
          success: false,
          message: 'Phones array is required',
        });
      }

      const results = await Promise.all(
        phones.map(async (phone) => {
          const normalizedPhone = phone.replace(/[\s\+\-\(\)]/g, '');
          const email = await userProfileService.getEmailByPhone(normalizedPhone);
          
          if (email) {
            const profile = await userProfileService.getProfileByEmail(email);
            return {
              phone,
              registered: true,
              email,
              name: profile?.name || email.split('@')[0],
            };
          }
          
          return {
            phone,
            registered: false,
          };
        })
      );

      return res.status(200).json({
        success: true,
        message: `Checked ${phones.length} phone number(s)`,
        results,
      });
    } catch (error) {
      console.error('Error in checkPhonesBatch:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Search users by email (PRIVACY: Only exact email match, no partial search)
  async searchUsers(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { query } = req.query;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }

      const searchQuery = query.trim().toLowerCase();

      // PRIVACY: Only allow exact email match (no partial search to protect user privacy)
      // Check if it's a valid email format
      if (!searchQuery.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a complete email address',
        });
      }

      // Check User model directly (for registered users, even without profile)
      const User = require('../models/User');
      let user = await User.findOne({ email: searchQuery }).select('-password').lean();
      
      // If not found in User model, try getProfileByEmail (for backward compatibility)
      if (!user) {
        const profile = await userProfileService.getProfileByEmail(searchQuery);
        if (profile) {
          user = profile;
        }
      }
      
      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'User not found',
          results: [],
        });
      }

      // Skip if searching for self
      if (user.email.toLowerCase() === userEmail.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot search for yourself',
        });
      }

      const isContact = await contactsService.hasContact(userEmail, user.email);
      
      res.status(200).json({
        success: true,
        message: 'User found',
        results: [{
          email: user.email,
          name: user.name || user.email.split('@')[0],
          exists: true,
          isContact,
        }],
      });
    } catch (error) {
      console.error('Error in searchUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Check if user exists on platform
  async checkUserExists(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { email } = req.query;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const profile = await userProfileService.getProfileByEmail(email);
      const exists = !!profile;

      res.status(200).json({
        success: true,
        message: exists ? 'User exists on the platform' : 'User does not exist on the platform',
        exists,
        user: exists ? {
          email,
          name: profile.name || email.split('@')[0],
        } : null,
      });
    } catch (error) {
      console.error('Error in checkUserExists:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Add a contact
  async addContact(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!contactEmail) {
        return res.status(400).json({
          success: false,
          message: 'Contact email is required',
        });
      }

      if (contactEmail === userEmail) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add yourself as a contact',
        });
      }

      const contacts = await contactsService.addContact(userEmail, contactEmail);

      // Emit socket event to notify user about contacts update
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io) {
        const userSocketId = userService.getSocketByEmail(userEmail);
        if (userSocketId) {
          io.to(userSocketId).emit('contactsUpdated', {
            contactEmail,
            action: 'added',
            contacts,
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Contact added successfully',
        contacts,
      });
    } catch (error) {
      console.error('Error in addContact:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get all contacts for a user
  async getContacts(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      const contactList = await contactsService.getContacts(userEmail);
      const chatService = require('../services/chatService');
      const Message = require('../models/Message');
      
      // Get all users with messages (even if not manually added as contact)
      const roomsWithMessages = await Message.distinct('roomId', {
        $or: [
          { senderEmail: userEmail, messageType: 'private' },
          { receiverEmail: userEmail, messageType: 'private' }
        ]
      });
      
      // Extract all unique email addresses from roomIds
      const usersWithMessages = new Set();
      roomsWithMessages.forEach(roomId => {
        // RoomId format: "chat_email1_email2" (sorted)
        // Remove "chat_" prefix first
        if (roomId.startsWith('chat_')) {
          const emailsPart = roomId.substring(5); // Remove "chat_" (5 chars)
          const emails = emailsPart.split('_');
          emails.forEach(email => {
            if (email && email !== userEmail) {
              usersWithMessages.add(email);
            }
          });
        }
      });
      
      // Combine manually added contacts with users who have messages
      const allContactEmails = new Set();
      
      // Add manually added contacts
      contactList.forEach(contact => {
        allContactEmails.add(contact.contactEmail);
      });
      
      // Add users with messages (even if not manually added)
      usersWithMessages.forEach(email => {
        allContactEmails.add(email);
      });
      
      const contacts = await Promise.all(
        Array.from(allContactEmails).map(async (email) => {
          // Check if this is a manually added contact
          const manualContact = contactList.find(c => c.contactEmail === email);
          const isManuallyAdded = !!manualContact;
          
          const profile = await userProfileService.getProfileByEmail(email);
          // Check if contact is online
          const socketId = userService.getSocketByEmail(email);
          const isOnline = !!socketId;
          // Get unread message count
          const unreadCount = await chatService.getUnreadCount(userEmail, email);
          
          // Get last message for this contact (for sorting and preview)
          const roomId = chatService.getRoomId(userEmail, email);
          const lastMessage = await Message.findOne({ roomId, messageType: 'private' })
            .sort({ timestamp: -1 })
            .lean();
          
          let lastMessageText = null;
          let lastMessageTimestamp = null;
          if (lastMessage) {
            lastMessageTimestamp = lastMessage.timestamp;
            // Try to extract readable message text (handle encrypted messages)
            try {
              const parsed = JSON.parse(lastMessage.message);
              if (parsed && parsed.encrypted) {
                // Encrypted message - show placeholder
                lastMessageText = '🔒 Encrypted message';
              } else if (parsed && parsed.type === 'file') {
                // File message
                lastMessageText = parsed.fileType === 'image' ? '📷 Photo' : 
                                 parsed.fileType === 'video' ? '🎥 Video' : 
                                 parsed.fileType === 'audio' ? '🎵 Audio' : 
                                 `📎 ${parsed.fileName || 'File'}`;
              } else {
                lastMessageText = lastMessage.message;
              }
            } catch (e) {
              // Not JSON, use as-is
              lastMessageText = lastMessage.message;
            }
          }
          
          return {
            email,
            name: profile?.name || email.split('@')[0],
            exists: !!profile,
            isOnline,
            unreadCount,
            isFavorite: manualContact?.isFavorite || false,
            isPinned: manualContact?.isPinned || false,
            isArchived: manualContact?.isArchived || false,
            isMuted: manualContact?.isMuted || false,
            isManuallyAdded, // Flag to distinguish manually added vs message-based contacts
            lastMessage: lastMessageText,
            lastMessageTimestamp: lastMessageTimestamp,
          };
        })
      );
      
      // Sort contacts by last message timestamp (most recent first), then by name
      contacts.sort((a, b) => {
        // Pinned contacts first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        // Then by last message timestamp (most recent first)
        if (a.lastMessageTimestamp && b.lastMessageTimestamp) {
          return new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp);
        }
        if (a.lastMessageTimestamp) return -1;
        if (b.lastMessageTimestamp) return 1;
        
        // Then by name
        return (a.name || a.email).localeCompare(b.name || b.email);
      });

      res.status(200).json({
        success: true,
        message: `Found ${contacts.length} contact(s)`,
        contacts,
      });
    } catch (error) {
      console.error('Error in getContacts:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Toggle favorite status for a contact
  async toggleFavorite(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!contactEmail) {
        return res.status(400).json({
          success: false,
          message: 'Contact email is required',
        });
      }

      const contact = await contactsService.toggleFavorite(userEmail, contactEmail);

      res.status(200).json({
        success: true,
        message: contact.isFavorite ? 'Contact marked as favorite' : 'Contact removed from favorites',
        contact: {
          email: contact.contactEmail,
          isFavorite: contact.isFavorite,
        },
      });
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Pin/Unpin a contact chat
  async togglePin(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!contactEmail) {
        return res.status(400).json({
          success: false,
          message: 'Contact email is required',
        });
      }

      const Contact = require('../models/Contact');
      let contact = await Contact.findOne({ userEmail, contactEmail });
      
      // If contact doesn't exist (message-based contact), create it
      if (!contact) {
        contact = new Contact({
          userEmail,
          contactEmail,
          isPinned: true, // Setting to pinned
        });
        await contact.save();
      } else {
        // Toggle pin status for existing contact
        contact.isPinned = !contact.isPinned;
        await contact.save();
      }

      res.status(200).json({
        success: true,
        message: contact.isPinned ? 'Chat pinned' : 'Chat unpinned',
        contact: {
          email: contact.contactEmail,
          isPinned: contact.isPinned,
        },
      });
    } catch (error) {
      console.error('Error in togglePin:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Archive/Unarchive a contact chat
  async toggleArchive(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!contactEmail) {
        return res.status(400).json({
          success: false,
          message: 'Contact email is required',
        });
      }

      const Contact = require('../models/Contact');
      let contact = await Contact.findOne({ userEmail, contactEmail });
      
      // If contact doesn't exist (message-based contact), create it
      if (!contact) {
        contact = new Contact({
          userEmail,
          contactEmail,
          isArchived: true, // Setting to archived
        });
        await contact.save();
      } else {
        // Toggle archive status for existing contact
        contact.isArchived = !contact.isArchived;
        await contact.save();
      }

      res.status(200).json({
        success: true,
        message: contact.isArchived ? 'Chat archived' : 'Chat unarchived',
        contact: {
          email: contact.contactEmail,
          isArchived: contact.isArchived,
        },
      });
    } catch (error) {
      console.error('Error in toggleArchive:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Mute/Unmute a contact chat
  async toggleMute(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail, mutedUntil } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!contactEmail) {
        return res.status(400).json({
          success: false,
          message: 'Contact email is required',
        });
      }

      const Contact = require('../models/Contact');
      let contact = await Contact.findOne({ userEmail, contactEmail });
      
      // If contact doesn't exist (message-based contact), create it
      if (!contact) {
        contact = new Contact({
          userEmail,
          contactEmail,
          isMuted: true, // Setting to muted
          mutedUntil: mutedUntil ? new Date(mutedUntil) : null,
        });
        await contact.save();
      } else {
        // Toggle mute status for existing contact
        contact.isMuted = !contact.isMuted;
        contact.mutedUntil = contact.isMuted ? (mutedUntil ? new Date(mutedUntil) : null) : null;
        await contact.save();
      }

      res.status(200).json({
        success: true,
        message: contact.isMuted ? 'Chat muted' : 'Chat unmuted',
        contact: {
          email: contact.contactEmail,
          isMuted: contact.isMuted,
          mutedUntil: contact.mutedUntil,
        },
      });
    } catch (error) {
      console.error('Error in toggleMute:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Delete a contact chat (remove contact)
  async deleteContact(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!contactEmail) {
        return res.status(400).json({
          success: false,
          message: 'Contact email is required',
        });
      }

      const result = await contactsService.removeContact(userEmail, contactEmail);

      // Emit socket event to notify user about contacts update
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io) {
        const userSocketId = userService.getSocketByEmail(userEmail);
        if (userSocketId) {
          io.to(userSocketId).emit('contactsUpdated', {
            contactEmail,
            action: 'deleted',
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Contact deleted successfully',
      });
    } catch (error) {
      console.error('Error in deleteContact:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Remove a contact
  async removeContact(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!contactEmail) {
        return res.status(400).json({
          success: false,
          message: 'Contact email is required',
        });
      }

      const contacts = await contactsService.removeContact(userEmail, contactEmail);

      res.status(200).json({
        success: true,
        message: 'Contact removed successfully',
        contacts,
      });
    } catch (error) {
      console.error('Error in removeContact:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Generate invite link
  async markMessagesAsRead(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!contactEmail) {
        return res.status(400).json({
          success: false,
          message: 'Contact email is required',
        });
      }

      const chatService = require('../services/chatService');
      await chatService.markMessagesAsRead(userEmail, contactEmail);

      // Emit socket event to update contacts (unread count changed)
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io) {
        const userSocketId = userService.getSocketByEmail(userEmail);
        if (userSocketId) {
          io.to(userSocketId).emit('contactsUpdated', {
            contactEmail,
            action: 'messages_read',
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Messages marked as read',
      });
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async generateInviteLink(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      // Generate invite link with user email encoded
      const inviteCode = Buffer.from(userEmail).toString('base64');
      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:19006'}/invite/${inviteCode}`;

      res.status(200).json({
        success: true,
        inviteLink,
        inviteCode,
      });
    } catch (error) {
      console.error('Error in generateInviteLink:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete a private message
  async deleteMessage(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { messageId } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message: 'Message ID is required',
        });
      }

      const chatService = require('../services/chatService');
      await chatService.deleteMessage(messageId, userEmail);

      res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // Get message info (read receipts, delivery status)
  async getMessageInfo(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { messageId } = req.params;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message: 'Message ID is required',
        });
      }

      const chatService = require('../services/chatService');
      const message = await chatService.getMessageById(messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
        });
      }

      // Check if user has access to this message
      const hasAccess = message.senderEmail === userEmail || 
                       message.receiverEmail === userEmail ||
                       (message.groupId && await groupService.isMember(message.groupId.toString(), userEmail));

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this message',
        });
      }

      // Get read receipts info
      let readReceipts = [];
      let notRead = [];
      let notDelivered = [];

      if (message.messageType === 'group' && message.groupId) {
        // For group messages, check all members
        const group = await groupService.getGroupById(message.groupId.toString());
        if (group) {
          const allMembers = group.members || [];
          const readBy = message.readBy || [];
          
          allMembers.forEach(memberEmail => {
            if (memberEmail === message.senderEmail) {
              // Sender doesn't need to read their own message
              return;
            }
            
            if (readBy.includes(memberEmail)) {
              readReceipts.push(memberEmail);
            } else {
              // Check if message was delivered (has deliveredAt timestamp)
              if (message.deliveredAt) {
                notRead.push(memberEmail);
              } else {
                notDelivered.push(memberEmail);
              }
            }
          });
        }
      } else {
        // For private messages
        if (message.receiverEmail) {
          const readBy = message.readBy || [];
          if (readBy.includes(message.receiverEmail)) {
            readReceipts.push(message.receiverEmail);
          } else {
            if (message.deliveredAt) {
              notRead.push(message.receiverEmail);
            } else {
              notDelivered.push(message.receiverEmail);
            }
          }
        }
      }

      res.status(200).json({
        success: true,
        messageInfo: {
          messageId: message._id,
          senderEmail: message.senderEmail,
          timestamp: message.timestamp,
          status: message.status,
          deliveredAt: message.deliveredAt,
          readReceipts,
          notRead,
          notDelivered,
          messageType: message.messageType,
        },
      });
    } catch (error) {
      console.error('Error in getMessageInfo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }
}

module.exports = new ContactsController();

