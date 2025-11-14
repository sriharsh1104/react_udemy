// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3001' || 'http://172.16.15.87:3001',
  PORT: process.env.PORT || 3001,
  CORS_ORIGIN: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '*',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Socket Configuration
const SOCKET_CONFIG = {
  CORS: {
    origin: API_CONFIG.CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  PING_TIMEOUT: 60000,
  PING_INTERVAL: 25000,
};

// API Routes
const ROUTES = {
  HEALTH: '/api/health',
  BASE: '/api',
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Common Error Messages
const ERROR_MESSAGES = {
  // Authentication errors
  AUTH_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid token',
  NO_TOKEN_PROVIDED: 'No token provided',
  INVALID_OR_EXPIRED_TOKEN: 'Invalid or expired token',
  TOKEN_VERIFICATION_FAILED: 'Token verification failed',
  NO_AUTH_TOKEN_FOUND: 'No authentication token found',
  
  // Invite/Group errors
  INVITE_TOKEN_REQUIRED: 'Invite token is required',
  
  // Not found errors
  USER_NOT_FOUND: 'User not found',
  PROFILE_NOT_FOUND: 'Profile not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  GROUP_NOT_FOUND: 'Group not found',
  
  // Validation errors
  EMAIL_OR_PHONE_REQUIRED: 'Please provide email or phone number',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PHONE: 'Please provide a valid phone number',
  EMAIL_ALREADY_REGISTERED: 'Email already registered. Please login instead.',
  STATUS_ID_REQUIRED: 'Status ID is required',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
};

// Common Success Messages
const SUCCESS_MESSAGES = {
  // Status
  STATUS_UPLOADED_SUCCESSFULLY: 'Status uploaded successfully',
  STATUS_FEED_RETRIEVED_SUCCESSFULLY: 'Status feed retrieved successfully',
  STATUS_MARKED_AS_VIEWED: 'Status marked as viewed',
  VIEWERS_RETRIEVED_SUCCESSFULLY: 'Viewers retrieved successfully',
  
  // File
  FILE_UPLOADED_SUCCESSFULLY: 'File uploaded successfully',
  FILE_DELETED_SUCCESSFULLY: 'File deleted successfully',
  
  // Contacts
  CONTACT_ADDED_SUCCESSFULLY: 'Contact added successfully',
  CONTACT_DELETED_SUCCESSFULLY: 'Contact deleted successfully',
  CONTACT_REMOVED_SUCCESSFULLY: 'Contact removed successfully',
  INVITE_LINK_GENERATED_SUCCESSFULLY: 'Invite link generated successfully',
  MESSAGE_DELETED_SUCCESSFULLY: 'Message deleted successfully',
  MESSAGE_EDITED_SUCCESSFULLY: 'Message edited successfully',
  CHAT_DELETED_SUCCESSFULLY: 'Chat deleted successfully',
  CHAT_CLEARED_SUCCESSFULLY: 'Chat cleared successfully',
  MESSAGE_INFO_RETRIEVED_SUCCESSFULLY: 'Message info retrieved successfully',
  
  // Auth
  LOGIN_SUCCESSFUL: 'Login successful',
  PASSWORD_RESET_SUCCESSFULLY: 'Password reset successfully',
  REGISTRATION_SUCCESSFUL: 'Registration successful',
  LOGOUT_SUCCESSFUL: 'Logout successful',
  
  // Settings
  PASSWORD_SET_SUCCESSFULLY: 'Password set successfully',
  PASSWORD_CHANGED_SUCCESSFULLY: 'Password changed successfully',
  PASSWORD_STATUS_RETRIEVED_SUCCESSFULLY: 'Password status retrieved successfully',
  OFFLINE_MODE_STATUS_RETRIEVED_SUCCESSFULLY: 'Offline mode status retrieved successfully',
  
  // Profile
  PROFILE_RETRIEVED_SUCCESSFULLY: 'Profile retrieved successfully',
  PROFILE_RETRIEVED_SUCCESSFULLY_CACHED: 'Profile retrieved successfully (cached)',
  PROFILE_UPDATED_SUCCESSFULLY: 'Profile updated successfully',
  
  // Feed
  FEED_RETRIEVED_SUCCESSFULLY: 'Feed retrieved successfully',
  LIKE_TOGGLED_SUCCESSFULLY: 'Like toggled successfully',
  COMMENT_ADDED_SUCCESSFULLY: 'Comment added successfully',
  COMMENTS_RETRIEVED_SUCCESSFULLY: 'Comments retrieved successfully',
  CAPTION_UPDATED_SUCCESSFULLY: 'Caption updated successfully',
  PROFILES_FOUND_SUCCESSFULLY: 'Profiles found successfully',
  PENDING_REQUESTS_RETRIEVED_SUCCESSFULLY: 'Pending requests retrieved successfully',
  
  // Group
  GROUP_CREATED_SUCCESSFULLY: 'Group created successfully',
  GROUP_RETRIEVED_SUCCESSFULLY: 'Group retrieved successfully',
  MEMBERS_ADDED_SUCCESSFULLY: 'Members added successfully',
  MEMBER_REMOVED_SUCCESSFULLY: 'Member removed successfully',
  GROUP_NAME_UPDATED_SUCCESSFULLY: 'Group name updated successfully',
  GROUP_DELETED_SUCCESSFULLY: 'Group deleted successfully',
  INVITE_LINK_RESET_SUCCESSFULLY: 'Invite link reset successfully',
  SUCCESSFULLY_JOINED_THE_GROUP: 'Successfully joined the group',
  GROUP_INFO_RETRIEVED_SUCCESSFULLY: 'Group info retrieved successfully',
  MESSAGE_PINNED_SUCCESSFULLY: 'Message pinned successfully',
  MESSAGE_UNPINNED_SUCCESSFULLY: 'Message unpinned successfully',
  PINNED_MESSAGES_RETRIEVED_SUCCESSFULLY: 'Pinned messages retrieved successfully',
};

module.exports = {
  API_CONFIG,
  SOCKET_CONFIG,
  ROUTES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};

