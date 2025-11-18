import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

/**
 * Chat Storage Service
 * Handles local persistence of chat messages using AsyncStorage
 * Similar to WhatsApp - stores messages locally for offline access
 */

class ChatStorageService {
  // Storage keys
  PRIVATE_CHAT_PREFIX = 'chat_';
  GROUP_CHAT_PREFIX = 'group_';
  LAST_SYNC_PREFIX = 'lastSync_';
  
  // Maximum messages to store per chat (to prevent storage bloat)
  MAX_MESSAGES_PER_CHAT = 1000;
  
  /**
   * Generate storage key for private chat
   * Uses sorted emails to ensure same key for both users
   */
  getPrivateChatKey(email1, email2) {
    const sorted = [email1, email2].sort();
    return `${this.PRIVATE_CHAT_PREFIX}${sorted[0]}_${sorted[1]}`;
  }
  
  /**
   * Generate storage key for group chat
   */
  getGroupChatKey(groupId) {
    return `${this.GROUP_CHAT_PREFIX}${groupId}`;
  }
  
  /**
   * Get last sync timestamp key
   */
  getLastSyncKey(chatKey) {
    return `${this.LAST_SYNC_PREFIX}${chatKey}`;
  }
  
  /**
   * Save messages for a private chat
   * @param {string} userEmail - Current user's email
   * @param {string} contactEmail - Contact's email
   * @param {Array} messages - Array of message objects
   */
  async savePrivateChatMessages(userEmail, contactEmail, messages) {
    try {
      const chatKey = this.getPrivateChatKey(userEmail, contactEmail);
      await this.saveMessages(chatKey, messages);
      logger.log(`💾 Saved ${messages.length} messages for private chat: ${contactEmail}`);
    } catch (error) {
      logger.error('Error saving private chat messages:', error);
    }
  }
  
  /**
   * Save messages for a group chat
   * @param {string} groupId - Group ID
   * @param {Array} messages - Array of message objects
   */
  async saveGroupChatMessages(groupId, messages) {
    try {
      const chatKey = this.getGroupChatKey(groupId);
      await this.saveMessages(chatKey, messages);
      logger.log(`💾 Saved ${messages.length} messages for group chat: ${groupId}`);
    } catch (error) {
      logger.error('Error saving group chat messages:', error);
    }
  }
  
  /**
   * Save messages to storage (internal method)
   */
  async saveMessages(chatKey, messages) {
    try {
      // Limit messages to prevent storage bloat
      let messagesToSave = messages;
      if (messages.length > this.MAX_MESSAGES_PER_CHAT) {
        // Keep only the most recent messages
        const sorted = [...messages].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        messagesToSave = sorted.slice(-this.MAX_MESSAGES_PER_CHAT);
      }
      
      // Store messages as JSON string
      await AsyncStorage.setItem(chatKey, JSON.stringify(messagesToSave));
      
      // Update last sync timestamp
      const lastSyncKey = this.getLastSyncKey(chatKey);
      await AsyncStorage.setItem(lastSyncKey, new Date().toISOString());
    } catch (error) {
      logger.error(`Error saving messages for ${chatKey}:`, error);
      throw error;
    }
  }
  
  /**
   * Load messages for a private chat
   * @param {string} userEmail - Current user's email
   * @param {string} contactEmail - Contact's email
   * @returns {Array} Array of message objects or empty array
   */
  async loadPrivateChatMessages(userEmail, contactEmail) {
    try {
      const chatKey = this.getPrivateChatKey(userEmail, contactEmail);
      return await this.loadMessages(chatKey);
    } catch (error) {
      logger.error('Error loading private chat messages:', error);
      return [];
    }
  }
  
  /**
   * Load messages for a group chat
   * @param {string} groupId - Group ID
   * @returns {Array} Array of message objects or empty array
   */
  async loadGroupChatMessages(groupId) {
    try {
      const chatKey = this.getGroupChatKey(groupId);
      return await this.loadMessages(chatKey);
    } catch (error) {
      logger.error('Error loading group chat messages:', error);
      return [];
    }
  }
  
  /**
   * Load messages from storage (internal method)
   */
  async loadMessages(chatKey) {
    try {
      const data = await AsyncStorage.getItem(chatKey);
      if (data) {
        const messages = JSON.parse(data);
        logger.log(`📂 Loaded ${messages.length} messages from storage for ${chatKey}`);
        return messages;
      }
      return [];
    } catch (error) {
      logger.error(`Error loading messages for ${chatKey}:`, error);
      return [];
    }
  }
  
  /**
   * Get last sync timestamp for a chat
   */
  async getLastSyncTimestamp(userEmail, contactEmail, isGroup = false, groupId = null) {
    try {
      const chatKey = isGroup 
        ? this.getGroupChatKey(groupId)
        : this.getPrivateChatKey(userEmail, contactEmail);
      const lastSyncKey = this.getLastSyncKey(chatKey);
      const timestamp = await AsyncStorage.getItem(lastSyncKey);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      logger.error('Error getting last sync timestamp:', error);
      return null;
    }
  }
  
  /**
   * Merge new messages with existing messages
   * Removes duplicates and sorts by timestamp
   */
  mergeMessages(existingMessages, newMessages) {
    // Create a map of existing messages by messageId for quick lookup
    const messageMap = new Map();
    
    // Add existing messages to map
    existingMessages.forEach(msg => {
      if (msg.messageId || msg._id) {
        const id = msg.messageId || msg._id;
        messageMap.set(id.toString(), msg);
      } else {
        // For messages without ID, use timestamp + sender + message as key
        const key = `${msg.timestamp}_${msg.senderEmail}_${msg.message}`;
        messageMap.set(key, msg);
      }
    });
    
    // Add/update new messages
    newMessages.forEach(msg => {
      if (msg.messageId || msg._id) {
        const id = msg.messageId || msg._id;
        messageMap.set(id.toString(), msg);
      } else {
        const key = `${msg.timestamp}_${msg.senderEmail}_${msg.message}`;
        messageMap.set(key, msg);
      }
    });
    
    // Convert map to array and sort by timestamp
    const merged = Array.from(messageMap.values());
    merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return merged;
  }
  
  /**
   * Add a single message to stored messages
   */
  async addMessage(userEmail, contactEmail, message, isGroup = false, groupId = null) {
    try {
      const chatKey = isGroup 
        ? this.getGroupChatKey(groupId)
        : this.getPrivateChatKey(userEmail, contactEmail);
      
      const existingMessages = await this.loadMessages(chatKey);
      const merged = this.mergeMessages(existingMessages, [message]);
      
      // Limit messages
      let messagesToSave = merged;
      if (merged.length > this.MAX_MESSAGES_PER_CHAT) {
        const sorted = [...merged].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        messagesToSave = sorted.slice(-this.MAX_MESSAGES_PER_CHAT);
      }
      
      await AsyncStorage.setItem(chatKey, JSON.stringify(messagesToSave));
    } catch (error) {
      logger.error('Error adding message to storage:', error);
    }
  }
  
  /**
   * Update a message in storage (for edits, deletions, status updates)
   */
  async updateMessage(userEmail, contactEmail, messageId, updates, isGroup = false, groupId = null) {
    try {
      const chatKey = isGroup 
        ? this.getGroupChatKey(groupId)
        : this.getPrivateChatKey(userEmail, contactEmail);
      
      const messages = await this.loadMessages(chatKey);
      const updatedMessages = messages.map(msg => {
        const id = msg.messageId || msg._id;
        if (id && id.toString() === messageId.toString()) {
          return { ...msg, ...updates };
        }
        return msg;
      });
      
      await AsyncStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    } catch (error) {
      logger.error('Error updating message in storage:', error);
    }
  }
  
  /**
   * Clear messages for a private chat
   */
  async clearPrivateChat(userEmail, contactEmail) {
    try {
      const chatKey = this.getPrivateChatKey(userEmail, contactEmail);
      await AsyncStorage.removeItem(chatKey);
      const lastSyncKey = this.getLastSyncKey(chatKey);
      await AsyncStorage.removeItem(lastSyncKey);
      logger.log(`🗑️ Cleared private chat storage for ${contactEmail}`);
    } catch (error) {
      logger.error('Error clearing private chat:', error);
    }
  }
  
  /**
   * Clear messages for a group chat
   */
  async clearGroupChat(groupId) {
    try {
      const chatKey = this.getGroupChatKey(groupId);
      await AsyncStorage.removeItem(chatKey);
      const lastSyncKey = this.getLastSyncKey(chatKey);
      await AsyncStorage.removeItem(lastSyncKey);
      logger.log(`🗑️ Cleared group chat storage for ${groupId}`);
    } catch (error) {
      logger.error('Error clearing group chat:', error);
    }
  }
  
  /**
   * Clear all chat storage (for logout)
   */
  async clearAllChats() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter(key => 
        key.startsWith(this.PRIVATE_CHAT_PREFIX) || 
        key.startsWith(this.GROUP_CHAT_PREFIX) ||
        key.startsWith(this.LAST_SYNC_PREFIX)
      );
      
      if (chatKeys.length > 0) {
        await AsyncStorage.multiRemove(chatKeys);
        logger.log(`🗑️ Cleared ${chatKeys.length} chat storage keys`);
      }
    } catch (error) {
      logger.error('Error clearing all chats:', error);
    }
  }
  
  /**
   * Get storage size estimate (for debugging)
   */
  async getStorageInfo() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter(key => 
        key.startsWith(this.PRIVATE_CHAT_PREFIX) || 
        key.startsWith(this.GROUP_CHAT_PREFIX)
      );
      
      let totalMessages = 0;
      for (const key of chatKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const messages = JSON.parse(data);
          totalMessages += messages.length;
        }
      }
      
      return {
        chatCount: chatKeys.length,
        totalMessages,
      };
    } catch (error) {
      logger.error('Error getting storage info:', error);
      return { chatCount: 0, totalMessages: 0 };
    }
  }
}

const chatStorageService = new ChatStorageService();
export default chatStorageService;

