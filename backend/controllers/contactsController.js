const contactsService = require('../services/contactsService');
const userService = require('../services/userService');
const userProfileService = require('../services/userProfileService');

class ContactsController {
  // Search users by email
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

      const userEmail = userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
        });
      }

      const searchQuery = query.toLowerCase().trim();
      const results = [];

      // Get all profiles
      const allProfiles = userProfileService.getAllProfiles();

      // Search in all user profiles
      for (const profile of allProfiles) {
        const email = profile.email;
        // Skip current user
        if (email === userEmail) continue;

        // Check if email matches
        if (email.toLowerCase().includes(searchQuery)) {
          results.push({
            email,
            name: profile.name || email.split('@')[0],
            exists: true,
            isContact: contactsService.hasContact(userEmail, email),
          });
        } else if (profile.name && profile.name.toLowerCase().includes(searchQuery)) {
          // Check if name matches
          results.push({
            email,
            name: profile.name,
            exists: true,
            isContact: contactsService.hasContact(userEmail, email),
          });
        }
      }

      res.status(200).json({
        success: true,
        results,
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

      const userEmail = userService.getUserByToken(token);
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

      const profile = userProfileService.getProfileByEmail(email);
      const exists = !!profile;

      res.status(200).json({
        success: true,
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

      const userEmail = userService.getUserByToken(token);
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

      const contacts = contactsService.addContact(userEmail, contactEmail);

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

      const userEmail = userService.getUserByToken(token);
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      const contactEmails = contactsService.getContacts(userEmail);
      const contacts = contactEmails.map(email => {
        const profile = userProfileService.getProfileByEmail(email);
        return {
          email,
          name: profile?.name || email.split('@')[0],
          exists: !!profile,
        };
      });

      res.status(200).json({
        success: true,
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

      const userEmail = userService.getUserByToken(token);
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

      const contacts = contactsService.removeContact(userEmail, contactEmail);

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
  async generateInviteLink(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userEmail = userService.getUserByToken(token);
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
}

module.exports = new ContactsController();

