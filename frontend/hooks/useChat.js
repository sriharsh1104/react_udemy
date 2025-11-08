import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants';
import encryptionService from '../services/encryptionService';

export const useChat = (userEmail, contactEmail) => {
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const socket = socketService.getSocket();
  
  /**
   * Check if a message is encrypted (contains encrypted and iv fields)
   */
  const isEncrypted = (message) => {
    try {
      const parsed = JSON.parse(message);
      return parsed && parsed.encrypted && parsed.iv;
    } catch {
      return false;
    }
  };
  
  /**
   * Decrypt a message if it's encrypted, otherwise return as-is
   */
  const decryptMessageIfNeeded = async (encryptedMessage, senderEmail) => {
    if (!isEncrypted(encryptedMessage)) {
      // Legacy unencrypted message
      return encryptedMessage;
    }
    
    try {
      const encryptedData = JSON.parse(encryptedMessage);
      // Determine which user is the sender to get the right key
      const decrypted = await encryptionService.decryptPrivateMessage(
        encryptedData,
        userEmail,
        senderEmail
      );
      return decrypted;
    } catch (error) {
      console.error('Error decrypting message:', error);
      return '[Encrypted message - decryption failed]';
    }
  };

  useEffect(() => {
    if (!socket || !userEmail) return;

    // Login with email when socket connects
    socketService.emit(SOCKET_EVENTS.LOGIN, { email: userEmail });

    // Join chat room when contactEmail is available
    if (contactEmail) {
      socketService.emit(SOCKET_EVENTS.JOIN_CHAT, {
        userEmail,
        contactEmail,
      });
    }

    return () => {
      // Leave chat room on cleanup
      if (contactEmail) {
        socketService.emit(SOCKET_EVENTS.LEAVE_CHAT, {
          userEmail,
          contactEmail,
        });
      }
    };
  }, [socket, userEmail, contactEmail]);

  useEffect(() => {
    if (!socket || !contactEmail) return;

    const handlePrivateMessage = async (data) => {
      console.log('Received private message:', data, 'Current contact:', contactEmail, 'User:', userEmail);
      
      // Only handle messages from the contact (not from ourselves)
      // We already have our own messages via optimistic UI update
      const isFromContact = data.senderEmail === contactEmail && data.senderEmail !== userEmail;
      
      if (isFromContact) {
        // Decrypt the message
        const decryptedMessage = await decryptMessageIfNeeded(data.message, data.senderEmail);
        
        // Check if message already exists (prevent duplicates)
        setMessages((prev) => {
          const messageExists = prev.some(
            msg => msg.message === decryptedMessage && 
                   msg.senderEmail === data.senderEmail && 
                   Math.abs(new Date(msg.timestamp) - new Date(data.timestamp)) < 1000 // Within 1 second
          );
          
          if (messageExists) {
            console.log('Duplicate message ignored:', decryptedMessage);
            return prev;
          }
          
          return [...prev, {
            senderEmail: data.senderEmail,
            message: decryptedMessage,
            timestamp: data.timestamp,
            isSent: false, // Always false since this is from contact
          }];
        });
      }
    };

    const handleChatHistory = async (data) => {
      // Only load history if it's for the current contact
      if (data.contactEmail === contactEmail) {
        // Decrypt all messages in history
        const formattedMessages = await Promise.all(
          data.messages.map(async (msg) => {
            const decryptedMessage = await decryptMessageIfNeeded(msg.message, msg.senderEmail);
            return {
              senderEmail: msg.senderEmail,
              message: decryptedMessage,
              timestamp: msg.timestamp,
              isSent: msg.senderEmail === userEmail,
            };
          })
        );
        
        console.log(`📬 Received ${formattedMessages.length} message(s) from chat history for ${contactEmail}`);
        setMessages(formattedMessages);
      }
    };

    const handleTyping = (data) => {
      // Only show typing if it's from the current contact
      if (data.senderEmail === contactEmail) {
      if (data.isTyping) {
          setTypingUser(data.senderEmail);
      } else {
          setTypingUser(null);
        }
      }
    };

    socket.on(SOCKET_EVENTS.PRIVATE_MESSAGE, handlePrivateMessage);
    socket.on(SOCKET_EVENTS.CHAT_HISTORY, handleChatHistory);
    socket.on(SOCKET_EVENTS.TYPING, handleTyping);

    return () => {
      socket.off(SOCKET_EVENTS.PRIVATE_MESSAGE, handlePrivateMessage);
      socket.off(SOCKET_EVENTS.CHAT_HISTORY, handleChatHistory);
      socket.off(SOCKET_EVENTS.TYPING, handleTyping);
    };
  }, [socket, userEmail, contactEmail]);

  const sendMessage = async (message) => {
    if (message.trim() && socket && contactEmail && userEmail) {
      const messageText = message.trim();
      
      // Optimistically add message to UI (plain text for display)
      const tempMessage = {
        senderEmail: userEmail,
        message: messageText,
        timestamp: new Date().toISOString(),
        isSent: true,
      };
      
      setMessages((prev) => [...prev, tempMessage]);
      
      try {
        // Encrypt the message before sending
        const encryptedData = await encryptionService.encryptPrivateMessage(
          messageText,
          userEmail,
          contactEmail
        );
        
        // Convert encrypted data to JSON string for storage
        const encryptedMessage = JSON.stringify(encryptedData);
        
        // Send encrypted message to server
        socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
          message: encryptedMessage,
          contactEmail,
        });
        
        socketService.emit(SOCKET_EVENTS.TYPING, {
          contactEmail,
          isTyping: false,
        });
      } catch (error) {
        console.error('Error encrypting message:', error);
        // Remove optimistic message on error
        setMessages((prev) => prev.filter(msg => 
          !(msg.message === messageText && msg.senderEmail === userEmail && msg.isSent)
        ));
      }
    }
  };

  const sendTyping = (isTyping) => {
    if (socket && contactEmail) {
      socketService.emit(SOCKET_EVENTS.TYPING, {
        contactEmail,
        isTyping,
      });
    }
  };

  return {
    messages,
    typingUser,
    sendMessage,
    sendTyping,
  };
};
