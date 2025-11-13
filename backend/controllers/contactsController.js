const contactsService = require('../services/contactsService');
const userService = require('../services/userService');
const userProfileService = require('../services/userProfileService');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHelper');

class ContactsController {
  // Check if phone number is registered in app
  async checkPhoneRegistered(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { phone } = req.query;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!phone) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Phone number is required');
      }

      // Normalize phone number (remove spaces, +, etc.)
      const normalizedPhone = phone.replace(/[\s\+\-\(\)]/g, '');
      
      // Check if phone number exists in any user's profile
      const email = await userProfileService.getEmailByPhone(normalizedPhone);
      
      if (email) {
        const profile = await userProfileService.getProfileByEmail(email);
        return sendSuccess(res, HTTP_STATUS.OK, 'User is registered on the platform', {
          registered: true,
          email,
          name: profile?.name || email.split('@')[0],
        });
      }

      return sendSuccess(res, HTTP_STATUS.OK, 'User is not registered on the platform', {
        registered: false,
      });
    } catch (error) {
      console.error('Error in checkPhoneRegistered:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Batch check multiple phone numbers
  async checkPhonesBatch(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { phones } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!phones || !Array.isArray(phones)) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Phones array is required');
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

      return sendSuccess(res, HTTP_STATUS.OK, `Checked ${phones.length} phone number(s)`, {
        results,
      });
    } catch (error) {
      console.error('Error in checkPhonesBatch:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Search users by email (PRIVACY: Only exact email match, no partial search)
  async searchUsers(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { query } = req.query;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!query || query.trim().length === 0) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Search query is required');
      }

      const searchQuery = query.trim().toLowerCase();

      // PRIVACY: Only allow exact email match (no partial search to protect user privacy)
      // Check if it's a valid email format
      if (!searchQuery.includes('@')) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please enter a complete email address');
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
        return sendSuccess(res, HTTP_STATUS.OK, 'User not found', {
          results: [],
        });
      }

      // Skip if searching for self
      if (user.email.toLowerCase() === userEmail.toLowerCase()) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Cannot search for yourself');
      }

      const isContact = await contactsService.hasContact(userEmail, user.email);
      
      return sendSuccess(res, HTTP_STATUS.OK, 'User found', {
        results: [{
          email: user.email,
          name: user.name || user.email.split('@')[0],
          exists: true,
          isContact,
        }],
      });
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Check if user exists on platform
  async checkUserExists(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { email } = req.query;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!email) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email is required');
      }

      const profile = await userProfileService.getProfileByEmail(email);
      const exists = !!profile;

      return sendSuccess(res, HTTP_STATUS.OK, exists ? 'User exists on the platform' : 'User does not exist on the platform', {
        exists,
        user: exists ? {
          email,
          name: profile.name || email.split('@')[0],
        } : null,
      });
    } catch (error) {
      console.error('Error in checkUserExists:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Add a contact
  async addContact(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!contactEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Contact email is required');
      }

      if (contactEmail === userEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Cannot add yourself as a contact');
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

      return sendSuccess(res, HTTP_STATUS.OK, 'Contact added successfully', {
        contacts,
      });
    } catch (error) {
      console.error('Error in addContact:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Get recent chats for a user (only contacts/groups with messages, not archived)
  async getRecentChats(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      const chatService = require('../services/chatService');
      const Message = require('../models/Message');
      const groupService = require('../services/groupService');
      
      // ========== PRIVATE CONTACTS ==========
      // Get all users with messages (even if not manually added as contact)
      const roomsWithMessages = await Message.distinct('roomId', {
        $or: [
          { senderEmail: userEmail, messageType: 'private', isDeleted: { $ne: true } },
          { receiverEmail: userEmail, messageType: 'private', isDeleted: { $ne: true } }
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
      
      // Get manually added contacts (for metadata like isFavorite, isPinned, etc.)
      const contactList = await contactsService.getContacts(userEmail);
      
      const allContactsData = await Promise.all(
        Array.from(usersWithMessages).map(async (email) => {
          // Check if this is a manually added contact
          const manualContact = contactList.find(c => c.contactEmail === email);
          
          const profile = await userProfileService.getProfileByEmail(email);
          // Check if contact is online
          const socketId = userService.getSocketByEmail(email);
          const isOnline = !!socketId;
          // Get unread message count
          const unreadCount = await chatService.getUnreadCount(userEmail, email);
          
          // Get last message for this contact (for sorting and preview)
          const roomId = chatService.getRoomId(userEmail, email);
          const lastMessage = await Message.findOne({ 
            roomId, 
            messageType: 'private',
            isDeleted: { $ne: true }
          })
            .sort({ timestamp: -1 })
            .lean();
          
          // If no messages found, skip this contact
          if (!lastMessage) {
            return null;
          }
          
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
          
          const isArchived = manualContact?.isArchived || false;
          
          return {
            email,
            name: profile?.name || email.split('@')[0],
            exists: !!profile,
            isOnline,
            unreadCount,
            isFavorite: manualContact?.isFavorite || false,
            isPinned: manualContact?.isPinned || false,
            isArchived: isArchived,
            isMuted: manualContact?.isMuted || false,
            isManuallyAdded: !!manualContact,
            lastMessage: lastMessageText,
            lastMessageTimestamp: lastMessageTimestamp,
          };
        })
      );
      
      // Filter out null entries (no messages)
      const allContacts = allContactsData.filter(c => c !== null);
      
      // Separate archived and non-archived contacts
      const validContacts = allContacts.filter(c => !c.isArchived);
      const archivedContacts = allContacts.filter(c => c.isArchived);
      
      // ========== GROUPS ==========
      // Get all groups where user is a member (from groupService)
      const allUserGroups = await groupService.getUserGroups(userEmail);
      
      // Get all group IDs that have messages (where user is a member)
      const groupsWithMessages = await Message.distinct('groupId', {
        messageType: 'group',
        isDeleted: { $ne: true },
        groupId: { $in: allUserGroups.map(g => g._id) }
      });
      
      // Convert to Set for easy lookup
      const groupIdsWithMessages = new Set(
        groupsWithMessages.map(id => id?.toString()).filter(Boolean)
      );
      
      const allGroupsData = await Promise.all(
        allUserGroups.map(async (group) => {
          const groupId = group._id?.toString();
          if (!groupId) return null;
          
          // Skip if group has no messages
          if (!groupIdsWithMessages.has(groupId)) {
            return null;
          }
          
          // Get last message for this group
          const lastMessage = await Message.findOne({ 
            groupId, 
            messageType: 'group',
            isDeleted: { $ne: true }
          })
            .sort({ timestamp: -1 })
            .lean();
          
          // If no messages found, skip this group
          if (!lastMessage) {
            return null;
          }
          
          // Get unread count
          const unreadCount = await chatService.getGroupUnreadCount(userEmail, groupId);
          
          // Get member profiles
          const memberProfiles = await Promise.all(
            (group.members || []).map(async (email) => {
              const profile = await userProfileService.getProfileByEmail(email);
              return {
                email,
                name: profile?.name || email.split('@')[0],
              };
            })
          );
          
          let lastMessageText = null;
          let lastMessageTimestamp = null;
          if (lastMessage) {
            lastMessageTimestamp = lastMessage.timestamp;
            try {
              const parsed = JSON.parse(lastMessage.message);
              if (parsed && parsed.encrypted) {
                lastMessageText = '🔒 Encrypted message';
              } else if (parsed && parsed.type === 'file') {
                lastMessageText = parsed.fileType === 'image' ? '📷 Photo' : 
                                 parsed.fileType === 'video' ? '🎥 Video' : 
                                 parsed.fileType === 'audio' ? '🎵 Audio' : 
                                 `📎 ${parsed.fileName || 'File'}`;
              } else {
                lastMessageText = lastMessage.message;
              }
            } catch (e) {
              lastMessageText = lastMessage.message;
            }
          }
          
          const isArchived = group.archivedBy && group.archivedBy.includes(userEmail);
          
          return {
            _id: group._id,
            name: group.name,
            members: memberProfiles,
            createdBy: group.createdBy,
            unreadCount,
            isFavorite: group.favorites && group.favorites.includes(userEmail),
            isPinned: group.pinnedBy && group.pinnedBy.includes(userEmail),
            isArchived: isArchived,
            isMuted: group.mutedBy && group.mutedBy.includes(userEmail),
            lastMessage: lastMessageText,
            lastMessageTimestamp: lastMessageTimestamp,
          };
        })
      );
      
      // Filter out null entries (no messages)
      const allGroups = allGroupsData.filter(g => g !== null);
      
      // Separate archived and non-archived groups
      const validGroups = allGroups.filter(g => !g.isArchived);
      const archivedGroups = allGroups.filter(g => g.isArchived);
      
      // ========== COMBINE AND SORT ==========
      // Combine contacts and groups
      const allChats = [
        ...validContacts.map(c => ({ ...c, chatType: 'contact' })),
        ...validGroups.map(g => ({ ...g, chatType: 'group' }))
      ];
      
      // Sort by last message timestamp (most recent first), then by name
      allChats.sort((a, b) => {
        // Pinned chats first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        // Then by last message timestamp (most recent first)
        if (a.lastMessageTimestamp && b.lastMessageTimestamp) {
          return new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp);
        }
        if (a.lastMessageTimestamp) return -1;
        if (b.lastMessageTimestamp) return 1;
        
        // Then by name
        const nameA = a.name || a.email || '';
        const nameB = b.name || b.email || '';
        return nameA.localeCompare(nameB);
      });

      return sendSuccess(res, HTTP_STATUS.OK, `Found ${allChats.length} recent chat(s)`, {
        contacts: validContacts, // Non-archived contacts with messages
        groups: validGroups, // Non-archived groups with messages
        archivedContacts: archivedContacts, // Archived contacts with messages
        archivedGroups: archivedGroups, // Archived groups with messages
      });
    } catch (error) {
      console.error('Error in getRecentChats:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Get all contacts for a user (manually added contacts only - for contact list)
  async getContacts(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
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

      return sendSuccess(res, HTTP_STATUS.OK, `Found ${contacts.length} contact(s)`, {
        contacts,
      });
    } catch (error) {
      console.error('Error in getContacts:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Toggle favorite status for a contact
  async toggleFavorite(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!contactEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Contact email is required');
      }

      const contact = await contactsService.toggleFavorite(userEmail, contactEmail);

      return sendSuccess(res, HTTP_STATUS.OK, contact.isFavorite ? 'Contact marked as favorite' : 'Contact removed from favorites', {
        contact: {
          email: contact.contactEmail,
          isFavorite: contact.isFavorite,
        },
      });
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }

  // Pin/Unpin a contact chat
  async togglePin(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!contactEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Contact email is required');
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

      return sendSuccess(res, HTTP_STATUS.OK, contact.isPinned ? 'Chat pinned' : 'Chat unpinned', {
        contact: {
          email: contact.contactEmail,
          isPinned: contact.isPinned,
        },
      });
    } catch (error) {
      console.error('Error in togglePin:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }

  // Archive/Unarchive a contact chat
  async toggleArchive(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!contactEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Contact email is required');
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

      return sendSuccess(res, HTTP_STATUS.OK, contact.isArchived ? 'Chat archived' : 'Chat unarchived', {
        contact: {
          email: contact.contactEmail,
          isArchived: contact.isArchived,
        },
      });
    } catch (error) {
      console.error('Error in toggleArchive:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }

  // Mute/Unmute a contact chat
  async toggleMute(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail, mutedUntil } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!contactEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Contact email is required');
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

      return sendSuccess(res, HTTP_STATUS.OK, contact.isMuted ? 'Chat muted' : 'Chat unmuted', {
        contact: {
          email: contact.contactEmail,
          isMuted: contact.isMuted,
          mutedUntil: contact.mutedUntil,
        },
      });
    } catch (error) {
      console.error('Error in toggleMute:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }

  // Delete a contact chat (remove contact)
  async deleteContact(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!contactEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Contact email is required');
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

      return sendSuccess(res, HTTP_STATUS.OK, 'Contact deleted successfully');
    } catch (error) {
      console.error('Error in deleteContact:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }

  // Remove a contact
  async removeContact(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!contactEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Contact email is required');
      }

      const contacts = await contactsService.removeContact(userEmail, contactEmail);

      return sendSuccess(res, HTTP_STATUS.OK, 'Contact removed successfully', {
        contacts,
      });
    } catch (error) {
      console.error('Error in removeContact:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Generate invite link
  async markMessagesAsRead(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!contactEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Contact email is required');
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

      return sendSuccess(res, HTTP_STATUS.OK, 'Messages marked as read');
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  async generateInviteLink(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      // Generate invite link with user email encoded
      const inviteCode = Buffer.from(userEmail).toString('base64');
      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:19006'}/invite/${inviteCode}`;

      return sendSuccess(res, HTTP_STATUS.OK, 'Invite link generated successfully', {
        inviteLink,
        inviteCode,
      });
    } catch (error) {
      console.error('Error in generateInviteLink:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
  }

  // Delete a private message
  async deleteMessage(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { messageId } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!messageId) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Message ID is required');
      }

      const chatService = require('../services/chatService');
      const deletedMessage = await chatService.deleteMessage(messageId, userEmail);

      // Emit socket event to notify the other user
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io && deletedMessage) {
        const roomId = deletedMessage.roomId;
        io.to(roomId).emit('messageDeleted', {
          messageId: messageId,
          roomId: roomId,
        });
      }

      return sendSuccess(res, HTTP_STATUS.OK, 'Message deleted successfully');
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }

  // Edit a private message
  async editMessage(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { messageId, newMessage } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!messageId || !newMessage) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Message ID and new message are required');
      }

      const chatService = require('../services/chatService');
      const editedMessage = await chatService.editMessage(messageId, userEmail, newMessage);

      // Emit socket event to notify the other user
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io && editedMessage) {
        const roomId = editedMessage.roomId;
        io.to(roomId).emit('messageEdited', {
          messageId: messageId,
          roomId: roomId,
          newMessage: newMessage,
          editedAt: editedMessage.editedAt,
        });
      }

      return sendSuccess(res, HTTP_STATUS.OK, 'Message edited successfully', {
        data: editedMessage,
      });
    } catch (error) {
      console.error('Error in editMessage:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }

  // Delete chat for a user (delete all messages - chat will disappear from Recent Chats)
  async deleteChat(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!contactEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Contact email is required');
      }

      // Delete all messages for this chat
      await contactsService.deleteChat(userEmail, contactEmail);

      // Emit socket event to refresh Recent Chats
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io) {
        const userSocketId = userService.getSocketByEmail(userEmail);
        if (userSocketId) {
          io.to(userSocketId).emit('contactsUpdated', {
            contactEmail: contactEmail,
            action: 'chat_deleted',
          });
        }
      }

      return sendSuccess(res, HTTP_STATUS.OK, 'Chat deleted successfully');
    } catch (error) {
      console.error('Error in deleteChat:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }

  // Clear chat for a user (mark clearedAt timestamp - messages will be filtered but chat remains)
  async clearChat(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      const { contactEmail } = req.body;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!contactEmail) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Contact email is required');
      }

      await contactsService.clearChat(userEmail, contactEmail);

      // Emit socket event to refresh chat (messages will be filtered on next load)
      const SocketService = require('../services/socketService');
      const io = SocketService.getIO();
      if (io) {
        const chatService = require('../services/chatService');
        const roomId = chatService.getRoomId(userEmail, contactEmail);
        const userService = require('../services/userService');
        
        // Get user's socket ID
        const userSocketId = userService.getSocketByEmail(userEmail);
        const room = io.sockets.adapter.rooms.get(roomId);
        const socketsInRoom = room?.size || 0;
        
        // First, try to emit directly to user's socket (most reliable)
        if (userSocketId) {
          const userSocket = io.sockets.sockets.get(userSocketId);
          if (userSocket) {
            console.log('🔔 EMITTING DIRECTLY TO USER SOCKET:', userSocketId);
            userSocket.emit('chatCleared', {
              roomId,
              clearedBy: userEmail,
              contactEmail,
            });
          } else {
            console.warn('⚠️ User socket not found:', userSocketId);
          }
        } else {
          console.warn('⚠️ User socket ID not found for email:', userEmail);
        }
        
        // Also emit to room (in case socket is in room but we couldn't find it directly)
        if (socketsInRoom > 0) {
          console.log('🔔 ALSO EMITTING TO ROOM:', roomId);
        io.to(roomId).emit('chatCleared', {
          roomId,
          clearedBy: userEmail,
            contactEmail,
        });
        } else {
          console.warn('⚠️ No sockets in room:', roomId);
        }
      } else {
        console.error('❌ Socket IO instance not available!');
      }

      return sendSuccess(res, HTTP_STATUS.OK, 'Chat cleared successfully');
    } catch (error) {
      console.error('Error in clearChat:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }

  // Get message info (read receipts, delivery status)
  async getMessageInfo(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      const { messageId } = req.params;

      if (!token) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
      }

      const userEmail = await userService.getUserByToken(token);
      if (!userEmail) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid token');
      }

      if (!messageId) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Message ID is required');
      }

      const chatService = require('../services/chatService');
      const message = await chatService.getMessageById(messageId);

      if (!message) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, 'Message not found');
      }

      // Check if user has access to this message
      const groupService = require('../services/groupService');
      const hasAccess = message.senderEmail === userEmail || 
                       message.receiverEmail === userEmail ||
                       (message.groupId && await groupService.isMember(message.groupId.toString(), userEmail));

      if (!hasAccess) {
        return sendError(res, HTTP_STATUS.FORBIDDEN, 'You do not have access to this message');
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

      return sendSuccess(res, HTTP_STATUS.OK, 'Message info retrieved successfully', {
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
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || 'Internal server error');
    }
  }
}

module.exports = new ContactsController();

