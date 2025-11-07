// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:3001' 
    : 'http://your-production-server.com:3001',
  SOCKET_URL: __DEV__ 
    ? 'http://localhost:3001' 
    : 'http://your-production-server.com:3001',
  API_BASE: __DEV__ 
    ? 'http://localhost:3001/api' 
    : 'http://your-production-server.com:3001/api',
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
