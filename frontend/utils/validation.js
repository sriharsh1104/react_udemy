/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitize string input - remove dangerous characters
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  // Remove null bytes, control characters, and trim whitespace
  return input
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate phone number format (E.164 format)
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  // E.164 format: +[country code][number] (max 15 digits)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate password strength
 */
export const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  // Minimum 6 characters
  return password.length >= 6;
};

/**
 * Validate message content
 */
export const isValidMessage = (message) => {
  if (typeof message !== 'string') {
    return false;
  }
  const trimmed = message.trim();
  // Check max length (1000 characters as per MESSAGE_CONFIG)
  return trimmed.length > 0 && trimmed.length <= 1000;
};

/**
 * Sanitize message content
 */
export const sanitizeMessage = (message) => {
  if (typeof message !== 'string') {
    return '';
  }
  return sanitizeString(message);
};

/**
 * Validate age
 */
export const isValidAge = (age) => {
  const ageNum = parseInt(age, 10);
  return !isNaN(ageNum) && ageNum >= 1 && ageNum <= 150;
};

/**
 * Validate name
 */
export const isValidName = (name) => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  const trimmed = name.trim();
  // Name should be 1-100 characters, alphanumeric with spaces and common punctuation
  return trimmed.length >= 1 && trimmed.length <= 100 && /^[a-zA-Z0-9\s\-'.,]+$/.test(trimmed);
};

/**
 * Sanitize name
 */
export const sanitizeName = (name) => {
  if (typeof name !== 'string') {
    return '';
  }
  return sanitizeString(name).substring(0, 100);
};

/**
 * Validate and sanitize identifier (email or phone)
 */
export const validateIdentifier = (identifier) => {
  if (!identifier || typeof identifier !== 'string') {
    return { valid: false, type: null, sanitized: '' };
  }
  
  const sanitized = sanitizeString(identifier);
  const isEmail = isValidEmail(sanitized);
  const isPhone = isValidPhone(sanitized);
  
  return {
    valid: isEmail || isPhone,
    type: isEmail ? 'email' : (isPhone ? 'phone' : null),
    sanitized,
  };
};

/**
 * Validate bill split amount
 */
export const isValidAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 999999999; // Max 999 million
};

/**
 * Sanitize amount input
 */
export const sanitizeAmount = (amount) => {
  if (typeof amount === 'number') {
    return Math.max(0, Math.min(999999999, amount));
  }
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned) || 0;
    return Math.max(0, Math.min(999999999, num));
  }
  return 0;
};

