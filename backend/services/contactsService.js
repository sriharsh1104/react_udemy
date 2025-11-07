const Contact = require('../models/Contact');

class ContactsService {
  // Add a contact for a user
  async addContact(userEmail, contactEmail) {
    try {
      const contact = await Contact.findOneAndUpdate(
        { userEmail, contactEmail },
        {
          userEmail,
          contactEmail,
          createdAt: new Date(),
        },
        {
          upsert: true,
          new: true,
        }
      );
      
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
      
      return contacts.map(c => c.contactEmail);
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
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
