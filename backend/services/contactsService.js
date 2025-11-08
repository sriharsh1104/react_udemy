const Contact = require('../models/Contact');

class ContactsService {
  // Add a contact for a user
  async addContact(userEmail, contactEmail) {
    try {
      // Check if contact already exists to preserve existing fields
      const existingContact = await Contact.findOne({ userEmail, contactEmail });
      
      if (existingContact) {
        // Contact already exists, just update createdAt if needed
        existingContact.createdAt = existingContact.createdAt || new Date();
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

  // Get all contacts for a user
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
}

module.exports = new ContactsService();
