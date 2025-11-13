const Contact = require('../models/Contact');

class ContactsService {
  // Add a contact for a user
  async addContact(userEmail, contactEmail) {
    try {
      // Check if contact already exists to preserve existing fields
      const existingContact = await Contact.findOne({ userEmail, contactEmail });
      
      if (existingContact) {
        // Contact already exists - update it
        // If contact was archived, unarchive it (new message means it should appear in Recent Chats)
        if (existingContact.isArchived) {
          existingContact.isArchived = false;
        }
        // Update createdAt to reflect latest message exchange
        existingContact.createdAt = new Date();
        await existingContact.save();
      } else {
        // Create new contact, preserving default values for isMuted, isPinned, etc.
        const contact = new Contact({
          userEmail,
          contactEmail,
          createdAt: new Date(),
          isFavorite: false,
          isPinned: false,
          isArchived: false,
          isMuted: false,
        });
        await contact.save();
      }
      
      const contacts = await this.getContacts(userEmail);
      return contacts;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }

  // Remove a contact for a user
  async removeContact(userEmail, contactEmail) {
    try {
      await Contact.deleteOne({ userEmail, contactEmail });
      const contacts = await this.getContacts(userEmail);
      return contacts;
    } catch (error) {
      console.error('Error removing contact:', error);
      throw error;
    }
  }

  // Get all contacts for a user (manually added contacts only)
  async getContacts(userEmail) {
    try {
      const contacts = await Contact.find({ userEmail })
        .sort({ createdAt: -1 })
        .lean();
      
      // Return full contact objects (for backward compatibility, also support email-only)
      return contacts;
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
  }

  // Toggle favorite status for a contact
  async toggleFavorite(userEmail, contactEmail) {
    try {
      const contact = await Contact.findOne({ userEmail, contactEmail });
      if (!contact) {
        throw new Error('Contact not found');
      }
      
      contact.isFavorite = !contact.isFavorite;
      await contact.save();
      
      return contact.toObject();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  // Check if contact exists for a user
  async hasContact(userEmail, contactEmail) {
    try {
      const contact = await Contact.findOne({ userEmail, contactEmail });
      return !!contact;
    } catch (error) {
      console.error('Error checking contact:', error);
      return false;
    }
  }

  // Clear chat for a user (mark clearedAt timestamp - messages will be filtered)
  async clearChat(userEmail, contactEmail) {
    try {
      let contact = await Contact.findOne({ userEmail, contactEmail });
      
      if (!contact) {
        // Create contact if it doesn't exist
        contact = new Contact({
          userEmail,
          contactEmail,
          createdAt: new Date(),
        });
      }
      
      // Set clearedAt to current timestamp
      contact.clearedAt = new Date();
      await contact.save();
      
      return contact.toObject();
    } catch (error) {
      console.error('Error clearing chat:', error);
      throw error;
    }
  }

  // Delete chat for a user (delete all messages and mark as deleted)
  // Contact will remain in database but won't appear in Recent Chats
  async deleteChat(userEmail, contactEmail) {
    try {
      const chatService = require('./chatService');
      const Message = require('../models/Message');
      
      // Get room ID
      const roomId = chatService.getRoomId(userEmail, contactEmail);
      
      // Delete all messages in this room (soft delete - mark as deleted)
      await Message.updateMany(
        { roomId, messageType: 'private' },
        { 
          $set: { 
            isDeleted: true,
            deletedAt: new Date()
          }
        }
      );
      
      // Mark contact as deleted (for Recent Chats filtering)
      // We'll use a special flag or just check if messages exist
      // Actually, we don't need to mark contact - Recent Chats will filter by messages
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  // Get clearedAt timestamp for a contact
  async getClearedAt(userEmail, contactEmail) {
    try {
      const contact = await Contact.findOne({ userEmail, contactEmail });
      return contact?.clearedAt || null;
    } catch (error) {
      console.error('Error getting clearedAt:', error);
      return null;
    }
  }
}

module.exports = new ContactsService();
