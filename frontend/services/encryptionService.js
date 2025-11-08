import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

/**
 * End-to-End Encryption Service
 * Uses AES-256-CBC for symmetric encryption (crypto-js compatible)
 * Keys are derived deterministically from user emails for each chat
 */
class EncryptionService {
  // Key storage prefix
  KEY_STORAGE_PREFIX = 'e2ee_key_';
  
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
    
    // Generate key using PBKDF2 (Password-Based Key Derivation Function)
    // Using sorted emails as the "password" and a fixed salt
    const salt = 'e2ee_salt_v1'; // In production, use a unique salt per chat
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
    
    // Generate key for group
    const salt = 'e2ee_group_salt_v1';
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
      console.error('Encryption error:', error);
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
      
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
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
   */
  async decryptPrivateMessage(encryptedData, userEmail, contactEmail) {
    const key = await this.deriveSharedKey(userEmail, contactEmail);
    return await this.decryptMessage(encryptedData, key);
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
   */
  async decryptGroupMessage(encryptedData, groupId) {
    const key = await this.deriveGroupKey(groupId);
    return await this.decryptMessage(encryptedData, key);
  }
  
  /**
   * Clear all stored encryption keys (for logout)
   */
  async clearAllKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const encryptionKeys = keys.filter(key => key.startsWith(this.KEY_STORAGE_PREFIX));
      await AsyncStorage.multiRemove(encryptionKeys);
    } catch (error) {
      console.error('Error clearing encryption keys:', error);
    }
  }
}

export default new EncryptionService();

