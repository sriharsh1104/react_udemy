// User Profile Service - stores user profiles
class UserProfileService {
  constructor() {
    // email -> user profile
    this.profiles = new Map();
    // phone -> email mapping for login
    this.phoneToEmail = new Map();
  }

  // Create or update user profile
  createOrUpdateProfile(email, profileData) {
    const existingProfile = this.profiles.get(email) || {};
    
    const profile = {
      email,
      name: profileData.name || existingProfile.name || '',
      age: profileData.age || existingProfile.age || null,
      phoneNumbers: profileData.phoneNumbers || existingProfile.phoneNumbers || [],
      createdAt: existingProfile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.profiles.set(email, profile);

    // Update phone number mappings
    if (profile.phoneNumbers && profile.phoneNumbers.length > 0) {
      profile.phoneNumbers.forEach(phone => {
        if (phone && phone.trim()) {
          this.phoneToEmail.set(phone.trim(), email);
        }
      });
    }

    return profile;
  }

  // Get user profile by email
  getProfileByEmail(email) {
    return this.profiles.get(email) || null;
  }

  // Get email by phone number
  getEmailByPhone(phone) {
    return this.phoneToEmail.get(phone) || null;
  }

  // Check if identifier (email or phone) exists
  findUserByIdentifier(identifier) {
    // Check if it's an email
    if (identifier.includes('@')) {
      return {
        type: 'email',
        email: identifier,
        profile: this.getProfileByEmail(identifier),
      };
    }
    
    // Check if it's a phone number
    const email = this.getEmailByPhone(identifier);
    if (email) {
      return {
        type: 'phone',
        email,
        phone: identifier,
        profile: this.getProfileByEmail(email),
      };
    }

    return null;
  }

  // Check if profile is complete (has name and at least one phone number)
  isProfileComplete(email) {
    const profile = this.getProfileByEmail(email);
    if (!profile) return false;
    
    return !!(profile.name && profile.name.trim() && 
              profile.phoneNumbers && profile.phoneNumbers.length > 0);
  }

  // Get all profiles (for debugging)
  getAllProfiles() {
    return Array.from(this.profiles.values());
  }
}

module.exports = new UserProfileService();

