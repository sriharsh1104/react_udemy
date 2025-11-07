// Contacts Service - manages user contacts
class ContactsService {
  constructor() {
    // email -> [contact emails]
    this.userContacts = new Map();
  }

  // Add a contact for a user
  addContact(userEmail, contactEmail) {
    if (!this.userContacts.has(userEmail)) {
      this.userContacts.set(userEmail, []);
    }
    
    const contacts = this.userContacts.get(userEmail);
    if (!contacts.includes(contactEmail)) {
      contacts.push(contactEmail);
    }
    
    return contacts;
  }

  // Remove a contact for a user
  removeContact(userEmail, contactEmail) {
    if (!this.userContacts.has(userEmail)) {
      return [];
    }
    
    const contacts = this.userContacts.get(userEmail);
    const filtered = contacts.filter(c => c !== contactEmail);
    this.userContacts.set(userEmail, filtered);
    
    return filtered;
  }

  // Get all contacts for a user
  getContacts(userEmail) {
    return this.userContacts.get(userEmail) || [];
  }

  // Check if contact exists for a user
  hasContact(userEmail, contactEmail) {
    const contacts = this.getContacts(userEmail);
    return contacts.includes(contactEmail);
  }
}

module.exports = new ContactsService();

