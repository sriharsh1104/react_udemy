import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import logger from '../utils/logger';

/**
 * End-to-End Encryption Service
 * Uses AES-256-CBC for symmetric encryption (crypto-js compatible)
 * Keys are derived deterministically from user emails for each chat
 */
class EncryptionService {
  // Key storage prefix
  KEY_STORAGE_PREFIX = 'e2ee_key_';
  SALT_STORAGE_PREFIX = 'e2ee_salt_';
  
  /**
   * Generate a deterministic salt for a chat pair
   * Salt must be the same for both users in the chat pair
   * Uses a hash of the keyId to ensure both users get the same salt
   */
  async getOrCreateSalt(keyId) {
    const saltKey = `${this.SALT_STORAGE_PREFIX}${keyId}`;
    let salt = await AsyncStorage.getItem(saltKey);
    
    if (!salt) {
      // Generate a DETERMINISTIC salt from keyId (same for both users)
      // This ensures both users in a chat pair get the same salt
      salt = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `salt_${keyId}`
      );
      // Store salt for future use
      await AsyncStorage.setItem(saltKey, salt);
    }
    
    return salt;
  }
  
  /**
   * Derive a shared encryption key from two user emails
   * This creates a deterministic key for each chat pair
   */
  async deriveSharedKey(userEmail1, userEmail2) {
    // Sort emails to ensure same key regardless of order
    const sortedEmails = [userEmail1, userEmail2].sort();
    const keyId = `${sortedEmails[0]}_${sortedEmails[1]}`;
    
    // Check if key already exists in storage
    const storedKey = await AsyncStorage.getItem(`${this.KEY_STORAGE_PREFIX}${keyId}`);
    if (storedKey) {
      return storedKey;
    }
    
    // Get or create unique salt for this chat pair
    const salt = await this.getOrCreateSalt(keyId);
    const keyMaterial = `${sortedEmails[0]}_${sortedEmails[1]}_${salt}`;
    
    // Use expo-crypto to create a deterministic hash
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyMaterial
    );
    
    // Store the key for future use
    await AsyncStorage.setItem(`${this.KEY_STORAGE_PREFIX}${keyId}`, hash);
    
    return hash;
  }
  
  /**
   * Derive a group encryption key from group ID
   */
  async deriveGroupKey(groupId) {
    const keyId = `group_${groupId}`;
    
    // Check if key already exists
    const storedKey = await AsyncStorage.getItem(`${this.KEY_STORAGE_PREFIX}${keyId}`);
    if (storedKey) {
      return storedKey;
    }
    
    // Get or create unique salt for this group
    const salt = await this.getOrCreateSalt(keyId);
    const keyMaterial = `group_${groupId}_${salt}`;
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyMaterial
    );
    
    // Store the key
    await AsyncStorage.setItem(`${this.KEY_STORAGE_PREFIX}${keyId}`, hash);
    
    return hash;
  }
  
  /**
   * Encrypt a message using AES-256-CBC
   * Returns: { encrypted, iv } as base64 strings
   */
  async encryptMessage(message, keyHex) {
    try {
      // Convert hex key to WordArray (SHA256 produces 64 hex chars = 32 bytes = 256 bits)
      const key = CryptoJS.enc.Hex.parse(keyHex);
      
      // Generate random IV (Initialization Vector) - 16 bytes for AES
      const iv = CryptoJS.lib.WordArray.random(128/8);
      
      // Encrypt using AES-256-CBC
      const encrypted = CryptoJS.AES.encrypt(message, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      return {
        encrypted: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
        iv: iv.toString(CryptoJS.enc.Base64),
      };
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }
  
  /**
   * Decrypt a message using AES-256-CBC
   * Input: { encrypted, iv } as base64 strings
   */
  async decryptMessage(encryptedData, keyHex) {
    try {
      // Convert hex key to WordArray
      const key = CryptoJS.enc.Hex.parse(keyHex);
      
      // Recreate cipher params from base64 strings
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(encryptedData.encrypted)
      });
      
      const iv = CryptoJS.enc.Base64.parse(encryptedData.iv);
      
      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      // Validate decryption result
      if (!decryptedText || decryptedText.length === 0) {
        throw new Error('Decryption resulted in empty string - likely wrong key');
      }
      
      return decryptedText;
    } catch (error) {
      logger.error('Decryption error:', error);
      logger.error('Encrypted data:', encryptedData);
      throw new Error('Failed to decrypt message');
    }
  }
  
  /**
   * Encrypt message for private chat
   */
  async encryptPrivateMessage(message, userEmail, contactEmail) {
    const key = await this.deriveSharedKey(userEmail, contactEmail);
    return await this.encryptMessage(message, key);
  }
  
  /**
   * Decrypt message for private chat
   * If decryption fails, clears old salts/keys and retries with new deterministic salt
   */
  async decryptPrivateMessage(encryptedData, userEmail, contactEmail, retryCount = 0) {
    try {
      const key = await this.deriveSharedKey(userEmail, contactEmail);
      return await this.decryptMessage(encryptedData, key);
    } catch (error) {
      // If decryption fails and we haven't retried yet, clear salts/keys and retry
      if (retryCount === 0 && (error.message.includes('empty string') || error.message.includes('Failed to decrypt'))) {
        logger.log('Decryption failed, clearing old salts/keys and retrying...');
        const sortedEmails = [userEmail, contactEmail].sort();
        const keyId = `${sortedEmails[0]}_${sortedEmails[1]}`;
        
        // Clear salt and key for this chat pair
        await AsyncStorage.multiRemove([
          `${this.SALT_STORAGE_PREFIX}${keyId}`,
          `${this.KEY_STORAGE_PREFIX}${keyId}`
        ]);
        
        // Retry with new deterministic salt
        return await this.decryptPrivateMessage(encryptedData, userEmail, contactEmail, 1);
      }
      throw error;
    }
  }
  
  /**
   * Encrypt message for group chat
   */
  async encryptGroupMessage(message, groupId) {
    const key = await this.deriveGroupKey(groupId);
    return await this.encryptMessage(message, key);
  }
  
  /**
   * Decrypt message for group chat
   * If decryption fails, clears old salts/keys and retries with new deterministic salt
   */
  async decryptGroupMessage(encryptedData, groupId, retryCount = 0) {
    try {
      const key = await this.deriveGroupKey(groupId);
      return await this.decryptMessage(encryptedData, key);
    } catch (error) {
      // If decryption fails and we haven't retried yet, clear salts/keys and retry
      if (retryCount === 0 && (error.message.includes('empty string') || error.message.includes('Failed to decrypt'))) {
        logger.log('Decryption failed, clearing old salts/keys and retrying...');
        const keyId = `group_${groupId}`;
        
        // Clear salt and key for this group
        await AsyncStorage.multiRemove([
          `${this.SALT_STORAGE_PREFIX}${keyId}`,
          `${this.KEY_STORAGE_PREFIX}${keyId}`
        ]);
        
        // Retry with new deterministic salt
        return await this.decryptGroupMessage(encryptedData, groupId, 1);
      }
      throw error;
    }
  }
  
  /**
   * Clear all stored encryption keys and salts (for logout)
   */
  async clearAllKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const encryptionKeys = keys.filter(key => 
        key.startsWith(this.KEY_STORAGE_PREFIX) || key.startsWith(this.SALT_STORAGE_PREFIX)
      );
      await AsyncStorage.multiRemove(encryptionKeys);
    } catch (error) {
      logger.error('Error clearing encryption keys:', error);
    }
  }

  /**
   * Clear only salts (to regenerate with deterministic values)
   * This fixes the issue where different users had different random salts
   */
  async clearAllSalts() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const saltKeys = keys.filter(key => key.startsWith(this.SALT_STORAGE_PREFIX));
      await AsyncStorage.multiRemove(saltKeys);
      logger.log('Cleared all salts - will regenerate with deterministic values');
    } catch (error) {
      logger.error('Error clearing salts:', error);
    }
  }
}

export default new EncryptionService();

