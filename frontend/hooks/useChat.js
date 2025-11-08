import { useState, useEffect, useRef } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants';
import encryptionService from '../services/encryptionService';

export const useChat = (userEmail, contactEmail, onMessageReceived) => {
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const socket = socketService.getSocket();
  
  // Track message IDs that have been read (to avoid duplicate read receipts)
  const readMessageIds = useRef(new Set());
  
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
      
      // For your own messages, use contactEmail as the other party
      // For messages from contact, use senderEmail as the other party
      const otherPartyEmail = senderEmail === userEmail ? contactEmail : senderEmail;
      
      if (!otherPartyEmail) {
        console.error('Cannot decrypt: missing other party email');
        return '[Encrypted message - decryption failed]';
      }
      
      // Decrypt using the shared key between userEmail and otherPartyEmail
      const decrypted = await encryptionService.decryptPrivateMessage(
        encryptedData,
        userEmail,
        otherPartyEmail
      );
      return decrypted;
    } catch (error) {
      console.error('Error decrypting message:', error);
      console.error('Message:', encryptedMessage);
      console.error('Sender:', senderEmail, 'User:', userEmail, 'Contact:', contactEmail);
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
          
          // Notify parent component that a new message was received (to refresh contacts)
          if (onMessageReceived) {
            onMessageReceived();
          }
          
          const newMessage = {
            senderEmail: data.senderEmail,
            message: decryptedMessage,
            timestamp: data.timestamp,
            isSent: false, // Always false since this is from contact
            messageId: data.messageId || null,
            status: 'delivered', // Messages received are already delivered
            replyTo: data.replyTo || null,
            replyToMessage: data.replyToMessage || null,
            replyToSender: data.replyToSender || null,
          };
          
          // Send read receipt immediately if we have messageId
          if (data.messageId && !readMessageIds.current.has(data.messageId)) {
            readMessageIds.current.add(data.messageId);
            socketService.emit(SOCKET_EVENTS.MESSAGE_READ, {
              messageId: data.messageId,
              senderEmail: data.senderEmail,
            });
          }
          
          return [...prev, newMessage];
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
              messageId: msg._id ? msg._id.toString() : null,
              status: msg.status || 'sent',
              deliveredAt: msg.deliveredAt || null,
              replyTo: msg.replyTo || null,
              replyToMessage: msg.replyToMessage || null,
              replyToSender: msg.replyToSender || null,
            };
          })
        );
        
        // Only replace messages if we don't have any messages yet, or if this is the initial load
        // Otherwise, merge with existing messages to avoid clearing optimistic updates
        setMessages((prev) => {
          // If we already have messages, merge them intelligently
          if (prev.length > 0) {
            // Create a map of existing messages by messageId for quick lookup
            const existingMessagesMap = new Map();
            prev.forEach(msg => {
              if (msg.messageId) {
                existingMessagesMap.set(msg.messageId, msg);
              }
            });
            
            // Merge: keep existing messages that aren't in history (optimistic updates)
            // and add/update messages from history
            const mergedMessages = [...prev];
            
            formattedMessages.forEach((historyMsg) => {
              if (historyMsg.messageId) {
                const existingIndex = mergedMessages.findIndex(
                  m => m.messageId === historyMsg.messageId
                );
                if (existingIndex >= 0) {
                  // Update existing message with history data (preserve status if it's more recent)
                  mergedMessages[existingIndex] = {
                    ...mergedMessages[existingIndex],
                    ...historyMsg,
                    // Keep the more recent status if we have one
                    status: mergedMessages[existingIndex].status === 'read' || 
                            mergedMessages[existingIndex].status === 'delivered' 
                            ? mergedMessages[existingIndex].status 
                            : historyMsg.status,
                  };
                } else {
                  // Add new message from history
                  mergedMessages.push(historyMsg);
                }
              } else {
                // Message without ID - add it if not duplicate
                const isDuplicate = mergedMessages.some(
                  m => m.message === historyMsg.message && 
                       m.senderEmail === historyMsg.senderEmail &&
                       Math.abs(new Date(m.timestamp) - new Date(historyMsg.timestamp)) < 1000
                );
                if (!isDuplicate) {
                  mergedMessages.push(historyMsg);
                }
              }
            });
            
            // Sort by timestamp
            mergedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            return mergedMessages;
          }
          
          // First load - just set the messages
          return formattedMessages;
        });
        
        // Send read receipts for messages from contact that haven't been read yet
        formattedMessages.forEach((msg) => {
          if (!msg.isSent && msg.messageId && !readMessageIds.current.has(msg.messageId)) {
            // Mark as read and send receipt
            readMessageIds.current.add(msg.messageId);
            socketService.emit(SOCKET_EVENTS.MESSAGE_READ, {
              messageId: msg.messageId,
              senderEmail: msg.senderEmail,
            });
          }
        });
        
        console.log(`📬 Received ${formattedMessages.length} message(s) from chat history for ${contactEmail}`);
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

    const handleMessageStatusUpdate = (data) => {
      // Update message status when server notifies us
      setMessages((prev) => {
        // First, try to match by messageId
        const messageById = prev.find(msg => data.messageId && msg.messageId === data.messageId);
        if (messageById) {
          return prev.map((msg) => {
            if (msg.messageId === data.messageId) {
              return {
                ...msg,
                status: data.status,
                deliveredAt: data.deliveredAt || msg.deliveredAt,
              };
            }
            return msg;
          });
        }
        
        // If no match by messageId, try to match the most recent 'sent' message without messageId
        // This handles optimistic updates where we don't have messageId yet
        const sentMessagesWithoutId = prev
          .filter(msg => msg.isSent && msg.senderEmail === userEmail && !msg.messageId && msg.status === 'sent')
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Most recent first
        
        if (sentMessagesWithoutId.length > 0) {
          // Update the most recent one
          const mostRecent = sentMessagesWithoutId[0];
          return prev.map((msg) => {
            if (msg === mostRecent) {
              return {
                ...msg,
                status: data.status,
                deliveredAt: data.deliveredAt || msg.deliveredAt,
                messageId: data.messageId || msg.messageId,
              };
            }
            return msg;
          });
        }
        
        return prev;
      });
    };

    socket.on(SOCKET_EVENTS.PRIVATE_MESSAGE, handlePrivateMessage);
    socket.on(SOCKET_EVENTS.CHAT_HISTORY, handleChatHistory);
    socket.on(SOCKET_EVENTS.TYPING, handleTyping);
    socket.on(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleMessageStatusUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.PRIVATE_MESSAGE, handlePrivateMessage);
      socket.off(SOCKET_EVENTS.CHAT_HISTORY, handleChatHistory);
      socket.off(SOCKET_EVENTS.TYPING, handleTyping);
      socket.off(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleMessageStatusUpdate);
    };
  }, [socket, userEmail, contactEmail]);

  const sendMessage = async (message, replyInfo = null) => {
    if (message.trim() && socket && contactEmail && userEmail) {
      const messageText = message.trim();
      
      // Check if message is a file message (JSON string with type: 'file')
      let displayMessage = messageText;
      try {
        const parsed = JSON.parse(messageText);
        if (parsed && parsed.type === 'file') {
          // Keep the JSON string for file messages so MessageItem can parse it
          displayMessage = messageText;
        }
      } catch {
        // Not a JSON message, use as-is
      }
      
      // Optimistically add message to UI
      const tempMessage = {
        senderEmail: userEmail,
        message: displayMessage,
        timestamp: new Date().toISOString(),
        isSent: true,
        status: 'sent', // Initial status - will be updated when delivered
        messageId: null, // Will be set when we get confirmation from server
        replyTo: replyInfo?.replyTo || null,
        replyToMessage: replyInfo?.replyToMessage || null,
        replyToSender: replyInfo?.replyToSender || null,
      };
      
      setMessages((prev) => [...prev, tempMessage]);
      
      try {
        // Encrypt the message before sending (file messages are encrypted as JSON strings)
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
          senderEmail: userEmail, // Include senderEmail for reliability
          replyTo: replyInfo?.replyTo || null,
          replyToMessage: replyInfo?.replyToMessage || null,
          replyToSender: replyInfo?.replyToSender || null,
      });
      
      socketService.emit(SOCKET_EVENTS.TYPING, {
        contactEmail,
        isTyping: false,
      });
      } catch (error) {
        console.error('Error encrypting message:', error);
        // Remove optimistic message on error
        setMessages((prev) => prev.filter(msg => 
          !(msg.message === displayMessage && msg.senderEmail === userEmail && msg.isSent)
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

  // Function to mark messages as read (called when chat is viewed)
  const markMessagesAsRead = () => {
    if (!contactEmail || !userEmail) return;
    
    // Send read receipts for all unread messages from contact
    messages.forEach((msg) => {
      if (!msg.isSent && msg.messageId && !readMessageIds.current.has(msg.messageId)) {
        readMessageIds.current.add(msg.messageId);
        socketService.emit(SOCKET_EVENTS.MESSAGE_READ, {
          messageId: msg.messageId,
          senderEmail: msg.senderEmail,
        });
      }
    });
  };

  return {
    messages,
    typingUser,
    sendMessage,
    sendTyping,
    markMessagesAsRead,
  };
};
