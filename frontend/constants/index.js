// API Configuration
// Production backend URL
const PRODUCTION_API_URL = 'http://172.16.15.87:3001';

// Use environment variables if available, otherwise use defaults
const getApiUrl = () => {
  // Priority 1: Check for Expo environment variable (EXPO_PUBLIC_*)
  if (typeof process !== 'undefined' && process.env) {
    // Expo uses EXPO_PUBLIC_ prefix for public env vars
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }
    // React Native/Web standard
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
  }
  
  // Priority 2: Check for staging environment
  const isStaging = typeof process !== 'undefined' && process.env && 
    (process.env.EXPO_PUBLIC_ENV === 'staging' || process.env.NODE_ENV === 'staging');
  
  if (isStaging) {
    return PRODUCTION_API_URL; // Staging uses same URL as production
  }
  
  // Priority 3: Check for development mode - ONLY for web development
  // In production mobile builds, __DEV__ is false/undefined, so this won't match
  const isWeb = typeof window !== 'undefined' && window.location;
  const isWebDev = isWeb && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  // Only use localhost if BOTH __DEV__ is true AND we're on web with localhost
  // This ensures production mobile builds ALWAYS use production URL
  if (typeof __DEV__ !== 'undefined' && __DEV__ === true && isWebDev) {
    return 'http://localhost:3001';
  }
  
  // Priority 4: Default to production URL for all production builds (mobile APK, production web, etc.)
  // This is the fallback for all production builds
  return PRODUCTION_API_URL;
};

const API_URL = getApiUrl();

// Only log in development mode
if (typeof __DEV__ !== 'undefined' && __DEV__ === true) {
  const logger = require('../utils/logger').default;
  logger.log('🔗 API Configuration:', {
  API_URL,
  SOCKET_URL: API_URL,
  API_BASE: `${API_URL}/api`,
  __DEV__: typeof __DEV__ !== 'undefined' ? __DEV__ : 'undefined',
  isWeb: typeof window !== 'undefined',
});
}

export const API_CONFIG = {
  BASE_URL: API_URL,
  SOCKET_URL: API_URL,
  API_BASE: `${API_URL}/api`,
};

// Socket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  LOGIN: 'login',
  JOIN_CHAT: 'joinChat',
  LEAVE_CHAT: 'leaveChat',
  PRIVATE_MESSAGE: 'privateMessage',
  CHAT_HISTORY: 'chatHistory',
  TYPING: 'typing',
  // Group events
  JOIN_GROUP: 'joinGroup',
  LEAVE_GROUP: 'leaveGroup',
  GROUP_MESSAGE: 'groupMessage',
  GROUP_CHAT_HISTORY: 'groupChatHistory',
  GROUP_TYPING: 'groupTyping',
  // Message status events
  MESSAGE_STATUS_UPDATE: 'messageStatusUpdate',
  MESSAGE_READ: 'messageRead',
  // Contacts and groups update events
  CONTACTS_UPDATED: 'contactsUpdated',
  GROUPS_UPDATED: 'groupsUpdated',
  CONTACT_ONLINE_STATUS: 'contactOnlineStatus',
  // Call events
  INITIATE_CALL: 'initiateCall',
  ACCEPT_CALL: 'acceptCall',
  DECLINE_CALL: 'declineCall',
  END_CALL: 'endCall',
  CALL_SIGNAL: 'callSignal',
  INCOMING_CALL: 'incomingCall',
  INCOMING_GROUP_CALL: 'incomingGroupCall',
  CALL_INITIATED: 'callInitiated',
  CALL_ACCEPTED: 'callAccepted',
  CALL_ACTIVE: 'callActive',
  CALL_DECLINED: 'callDeclined',
  CALL_ENDED: 'callEnded',
  CALL_MISSED: 'callMissed',
  CALL_FAILED: 'callFailed',
  CALL_ERROR: 'callError',
};

// Premium Color Scheme (WhatsApp-inspired but with premium colors)
export const COLORS = {
  // Primary colors - Premium purple/indigo theme
  primary: '#6366F1', // Indigo-500
  primaryDark: '#4F46E5', // Indigo-600
  primaryLight: '#818CF8', // Indigo-400
  
  // Background colors
  background: '#0F172A', // Slate-900 (dark mode)
  backgroundLight: '#F8FAFC', // Slate-50 (light mode)
  chatBackground: '#0F172A', // Dark chat background
  chatBackgroundLight: '#E5E7EB', // Light chat background pattern
  
  // Message colors
  sentMessage: '#6366F1', // Indigo-500 (sent messages)
  receivedMessage: '#1E293B', // Slate-800 (received messages)
  sentMessageLight: '#6366F1',
  receivedMessageLight: '#FFFFFF',
  
  // Text colors
  text: '#F1F5F9', // Slate-100
  textSecondary: '#94A3B8', // Slate-400
  textLight: '#64748B', // Slate-500
  textDark: '#0F172A', // Slate-900
  
  // UI elements
  white: '#FFFFFF',
  black: '#000000',
  border: '#1E293B', // Slate-800
  borderLight: '#E2E8F0', // Slate-200
  divider: '#334155', // Slate-700
  
  // Status colors
  online: '#10B981', // Green-500
  offline: '#6B7280', // Gray-500
  typing: '#F59E0B', // Amber-500
  
  // System messages
  systemMessage: '#334155', // Slate-700
  systemMessageLight: '#E2E8F0', // Slate-200
  
  // Input
  inputBackground: '#1E293B', // Slate-800
  inputBackgroundLight: '#FFFFFF',
  inputText: '#F1F5F9', // Slate-100
  inputTextLight: '#0F172A', // Slate-900
  inputPlaceholder: '#64748B', // Slate-500
  
  // Header
  headerBackground: '#1E293B', // Slate-800
  headerText: '#F1F5F9', // Slate-100
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.1)',
};

// Typography
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
  message: 8, // WhatsApp-like message bubble radius
};

// Message Configuration
export const MESSAGE_CONFIG = {
  MAX_LENGTH: 1000,
  MAX_WIDTH_PERCENT: 75, // Max width of message bubble
  TIMESTAMP_FORMAT: 'HH:mm',
  DATE_FORMAT: 'DD/MM/YYYY',
};

// Animation Durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Platform Configuration
export const PLATFORM_CONFIG = {
  INVITE_LINK: 'https://chatapp.com/invite', // Static platform invite link
};
