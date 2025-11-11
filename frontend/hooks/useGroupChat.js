import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants';
import encryptionService from '../services/encryptionService';

export const useGroupChat = (userEmail, groupId) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
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
  const decryptMessageIfNeeded = async (encryptedMessage) => {
    if (!isEncrypted(encryptedMessage)) {
      // Legacy unencrypted message
      return encryptedMessage;
    }
    
    try {
      const encryptedData = JSON.parse(encryptedMessage);
      const decrypted = await encryptionService.decryptGroupMessage(
        encryptedData,
        groupId
      );
      return decrypted;
    } catch (error) {
      console.error('Error decrypting group message:', error);
      return '[Encrypted message - decryption failed]';
    }
  };

  useEffect(() => {
    if (!socket || !userEmail) return;

    // Wait for socket to be connected before logging in
    const handleConnect = () => {
      // Login with email when socket connects
      socketService.emit(SOCKET_EVENTS.LOGIN, { email: userEmail });

      // Join group when groupId is available
      if (groupId) {
        socketService.emit(SOCKET_EVENTS.JOIN_GROUP, {
          groupId,
        });
      }
    };

    // If already connected, login immediately
    if (socket.connected) {
      handleConnect();
    } else {
      // Wait for connection
      socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
    }

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      // Leave group on cleanup
      if (groupId) {
        socketService.emit(SOCKET_EVENTS.LEAVE_GROUP, {
          groupId,
        });
      }
    };
  }, [socket, userEmail, groupId]);

  useEffect(() => {
    if (!socket || !groupId) return;

    const handleGroupMessage = async (data) => {
      console.log('Received group message:', data, 'Current group:', groupId, 'User:', userEmail);
      
      // Only handle messages from the group (not from ourselves via optimistic update)
      const isFromGroup = data.groupId === groupId;
      const isFromSelf = data.senderEmail === userEmail;
      
      if (isFromGroup && !isFromSelf) {
        // Decrypt the message
        const decryptedMessage = await decryptMessageIfNeeded(data.message);
        
        // Check if message already exists (prevent duplicates)
        setMessages((prev) => {
          const messageExists = prev.some(
            msg => msg.message === decryptedMessage && 
                   msg.senderEmail === data.senderEmail && 
                   Math.abs(new Date(msg.timestamp) - new Date(data.timestamp)) < 1000 // Within 1 second
          );
          
          if (messageExists) {
            console.log('Duplicate group message ignored:', decryptedMessage);
            return prev;
          }
          
          return [...prev, {
            senderEmail: data.senderEmail,
            message: decryptedMessage,
            timestamp: data.timestamp,
            isSent: false, // Always false since this is from another member
            messageId: data._id || data.messageId,
            _id: data._id || data.messageId,
            isPinned: data.isPinned || false,
            replyTo: data.replyTo || null,
            replyToMessage: data.replyToMessage || null,
            replyToSender: data.replyToSender || null,
            readBy: data.readBy || [],
            status: data.status || 'sent',
          }];
        });
      }
    };

    const handleGroupChatHistory = async (data) => {
      // Only load history if it's for the current group
      if (data.groupId === groupId) {
        // Decrypt all messages in history
        const formattedMessages = await Promise.all(
          data.messages.map(async (msg) => {
            const decryptedMessage = await decryptMessageIfNeeded(msg.message);
            return {
          senderEmail: msg.senderEmail,
              message: decryptedMessage,
          timestamp: msg.timestamp,
          isSent: msg.senderEmail === userEmail,
              messageId: msg._id || msg.messageId,
              _id: msg._id || msg.messageId,
              isPinned: msg.isPinned || false,
              replyTo: msg.replyTo || null,
              replyToMessage: msg.replyToMessage || null,
              replyToSender: msg.replyToSender || null,
              readBy: msg.readBy || [],
              status: msg.status || 'sent',
            };
          })
        );
        
        console.log(`📬 Received ${formattedMessages.length} message(s) from group chat history for ${groupId}`);
        setMessages(formattedMessages);
      }
    };

    const handleGroupTyping = (data) => {
      // Only show typing if it's from the current group
      if (data.groupId === groupId && data.senderEmail !== userEmail) {
        if (data.isTyping) {
          setTypingUsers((prev) => {
            if (!prev.includes(data.senderEmail)) {
              return [...prev, data.senderEmail];
            }
            return prev;
          });
        } else {
          setTypingUsers((prev) => prev.filter(email => email !== data.senderEmail));
        }
      }
    };

    // Handle message pinned event
    const handleMessagePinned = (data) => {
      if (data.groupId === groupId) {
        setMessages((prev) =>
          prev.map((msg) =>
            (msg.messageId === data.messageId || msg._id === data.messageId)
              ? { ...msg, isPinned: true }
              : { ...msg, isPinned: false } // Unpin all other messages
          )
        );
      }
    };

    // Handle message unpinned event
    const handleMessageUnpinned = (data) => {
      if (data.groupId === groupId) {
        setMessages((prev) =>
          prev.map((msg) =>
            (msg.messageId === data.messageId || msg._id === data.messageId)
              ? { ...msg, isPinned: false }
              : msg
          )
        );
      }
    };

    // Handle message deleted event
    const handleMessageDeleted = (data) => {
      if (data.groupId === groupId) {
        setMessages((prev) =>
          prev.filter(
            (msg) => (msg.messageId !== data.messageId && msg._id !== data.messageId)
          )
        );
      }
    };

    // Handle group message read update event
    const handleGroupMessageReadUpdate = (data) => {
      if (data.groupId === groupId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if ((msg.messageId || msg._id) === data.messageId) {
              return {
                ...msg,
                readBy: data.readBy || [],
                status: data.status || 'sent',
              };
            }
            return msg;
          })
        );
      }
    };

    socket.on(SOCKET_EVENTS.GROUP_MESSAGE, handleGroupMessage);
    socket.on(SOCKET_EVENTS.GROUP_CHAT_HISTORY, handleGroupChatHistory);
    socket.on(SOCKET_EVENTS.GROUP_TYPING, handleGroupTyping);
    socket.on('messagePinned', handleMessagePinned);
    socket.on('messageUnpinned', handleMessageUnpinned);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('groupMessageReadUpdate', handleGroupMessageReadUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.GROUP_MESSAGE, handleGroupMessage);
      socket.off(SOCKET_EVENTS.GROUP_CHAT_HISTORY, handleGroupChatHistory);
      socket.off(SOCKET_EVENTS.GROUP_TYPING, handleGroupTyping);
      socket.off('messagePinned', handleMessagePinned);
      socket.off('messageUnpinned', handleMessageUnpinned);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('groupMessageReadUpdate', handleGroupMessageReadUpdate);
    };
  }, [socket, userEmail, groupId]);

  const sendMessage = async (message, replyInfo = null) => {
    if (message.trim() && socket && groupId && userEmail) {
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
        isPinned: false,
        replyTo: replyInfo?.replyTo || null,
        replyToMessage: replyInfo?.replyToMessage || null,
        replyToSender: replyInfo?.replyToSender || null,
      };
      
      setMessages((prev) => [...prev, tempMessage]);
      
      try {
        // Encrypt the message before sending (file messages are encrypted as JSON strings)
        const encryptedData = await encryptionService.encryptGroupMessage(
          messageText,
          groupId
        );
        
        // Convert encrypted data to JSON string for storage
        const encryptedMessage = JSON.stringify(encryptedData);
        
        // Send encrypted message to server
      socketService.emit(SOCKET_EVENTS.GROUP_MESSAGE, {
          message: encryptedMessage,
        groupId,
          senderEmail: userEmail, // Include senderEmail for reliability
          replyTo: replyInfo?.replyTo || null,
          replyToMessage: replyInfo?.replyToMessage || null,
          replyToSender: replyInfo?.replyToSender || null,
      });
      
      socketService.emit(SOCKET_EVENTS.GROUP_TYPING, {
        groupId,
        isTyping: false,
      });
      } catch (error) {
        console.error('Error encrypting group message:', error);
        // Remove optimistic message on error
        setMessages((prev) => prev.filter(msg => 
          !(msg.message === displayMessage && msg.senderEmail === userEmail && msg.isSent)
        ));
      }
    }
  };

  const sendTyping = (isTyping) => {
    if (socket && groupId) {
      socketService.emit(SOCKET_EVENTS.GROUP_TYPING, {
        groupId,
        isTyping,
      });
    }
  };

  return {
    messages,
    typingUsers,
    sendMessage,
    sendTyping,
  };
};

