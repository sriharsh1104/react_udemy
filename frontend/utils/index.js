export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

export const isSystemMessage = (message) => {
  return message.includes('joined') || message.includes('left');
};

export const validateUsername = (username) => {
  return username.trim().length > 0 && username.trim().length <= 20;
};

// Export utilities
export { default as logger } from './logger';
export * from './validation';
export * from './errorHandler';
export * from './apiHelper';
export * from './toast';

