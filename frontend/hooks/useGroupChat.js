import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants';
import encryptionService from '../services/encryptionService';
import chatStorageService from '../services/chatStorageService';

// Removed message limits - WhatsApp-like behavior: all messages accessible

export const useGroupChat = (userEmail, groupId) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socket = socketService.getSocket();
  
  // Decryption cache to avoid re-decrypting same messages
  const decryptionCache = useRef(new Map());
  
  // Track previous groupId to cleanup on group switch
  const previousGroupId = useRef(groupId);
  
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
   * Uses caching to avoid re-decrypting same messages
   */
  const decryptMessageIfNeeded = useCallback(async (encryptedMessage) => {
    if (!isEncrypted(encryptedMessage)) {
      // Legacy unencrypted message
      return encryptedMessage;
    }
    
    // Check cache first
    const cacheKey = `${encryptedMessage}_${groupId}`;
    if (decryptionCache.current.has(cacheKey)) {
      return decryptionCache.current.get(cacheKey);
    }
    
    try {
      const encryptedData = JSON.parse(encryptedMessage);
      const decrypted = await encryptionService.decryptGroupMessage(
        encryptedData,
        groupId
      );
      
      // Cache the decrypted message (limit cache size to prevent memory issues)
      if (decryptionCache.current.size > 1000) {
        // Remove oldest entries (simple FIFO)
        const firstKey = decryptionCache.current.keys().next().value;
        decryptionCache.current.delete(firstKey);
      }
      decryptionCache.current.set(cacheKey, decrypted);
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting group message:', error);
      return '[Encrypted message - decryption failed]';
    }
  }, [groupId]);
  
  // Removed cleanupOldMessages - WhatsApp shows all messages

  // Load messages from local storage when groupId changes (group switch)
  useEffect(() => {
    if (!groupId) return;
    
    const loadCachedMessages = async () => {
      try {
        // Load messages from local storage first (for offline access)
        const cachedMessages = await chatStorageService.loadGroupChatMessages(groupId);
        
        if (cachedMessages.length > 0) {
          console.log(`📂 Loaded ${cachedMessages.length} cached messages for group ${groupId}`);
          // Show cached messages immediately
          setMessages(cachedMessages);
        }
      } catch (error) {
        console.error('Error loading cached group messages:', error);
      }
    };
    
    if (previousGroupId.current !== groupId && previousGroupId.current !== null) {
      // Group switched - clear messages to prevent memory leak
      console.log('🧹 Cleaning up messages for group switch:', {
        from: previousGroupId.current,
        to: groupId
      });
      setMessages([]);
      // Load cached messages for new group
      loadCachedMessages();
    } else if (previousGroupId.current === null && groupId) {
      // Initial load - load cached messages
      loadCachedMessages();
    }
    
    previousGroupId.current = groupId;
  }, [groupId]);

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
        // Ensure data.message is a string before decrypting
        const messageToDecrypt = typeof data.message === 'string' 
          ? data.message 
          : (data.message?.message || data.message?.text || String(data.message || ''));
        
        // Decrypt the message
        const decryptedMessage = await decryptMessageIfNeeded(messageToDecrypt);
        
        // Add message directly without duplication checks
        const messageId = data._id || data.messageId;
        
        const newMessage = {
          senderEmail: data.senderEmail,
          message: decryptedMessage,
          timestamp: data.timestamp,
          isSent: false, // Always false since this is from another member
          messageId: messageId || null,
          _id: messageId || null,
          isPinned: data.isPinned || false,
          replyTo: data.replyTo || null,
          replyToMessage: data.replyToMessage || null,
          replyToSender: data.replyToSender || null,
          readBy: data.readBy || [],
          status: data.status || 'sent',
          isBillSplit: data.isBillSplit || false,
          billSplitData: data.billSplitData || null,
        };
        
        setMessages((prev) => {
          const updatedMessages = [...prev, newMessage];
          
          // Save to local storage
          chatStorageService.addMessage(userEmail, null, newMessage, true, groupId).catch(err => {
            console.error('Error saving group message to storage:', err);
          });
          
          return updatedMessages;
        });
      }
    };

    const handleGroupChatHistory = async (data) => {
      // Only load history if it's for the current group
      if (data.groupId === groupId) {
        setLoadingMessages(true);
        // Decrypt all messages in history
        const formattedMessages = await Promise.all(
          data.messages.map(async (msg) => {
            // Ensure msg.message is a string before decrypting
            const messageToDecrypt = typeof msg.message === 'string' 
              ? msg.message 
              : (msg.message?.message || msg.message?.text || String(msg.message || ''));
            
            const decryptedMessage = await decryptMessageIfNeeded(messageToDecrypt);
            return {
          senderEmail: msg.senderEmail,
              message: decryptedMessage,
          timestamp: msg.timestamp,
          isSent: msg.senderEmail === userEmail,
              messageId: msg._id || msg.messageId,
              _id: msg._id || msg.messageId,
              isPinned: msg.isPinned || false,
              isDeleted: msg.isDeleted || false,
              editedAt: msg.editedAt || null,
              readBy: msg.readBy || [],
              replyTo: msg.replyTo || null,
              replyToMessage: msg.replyToMessage || null,
              replyToSender: msg.replyToSender || null,
              status: msg.status || 'sent',
              isBillSplit: msg.isBillSplit || false,
              billSplitData: msg.billSplitData || null,
            };
          })
        );
        
        console.log(`📬 Received ${formattedMessages.length} message(s) from group chat history for ${groupId}`);
        
        // Merge with cached messages from local storage
        const cachedMessages = await chatStorageService.loadGroupChatMessages(groupId);
        const mergedMessages = chatStorageService.mergeMessages(cachedMessages, formattedMessages);
        
        // No cleanup - keep all messages
        setMessages(mergedMessages);
        
        // Save merged messages to local storage
        chatStorageService.saveGroupChatMessages(groupId, mergedMessages).catch(err => {
          console.error('Error saving group chat history to storage:', err);
        });
        
        setLoadingMessages(false);
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
          prev.map((msg) => {
            const isTargetMessage = (msg.messageId === data.messageId || msg._id === data.messageId);
            const updatedMsg = isTargetMessage
              ? { ...msg, isPinned: true }
              : { ...msg, isPinned: false }; // Unpin all other messages
            
            // Update in local storage
            if (isTargetMessage && msg.messageId) {
              chatStorageService.updateMessage(
                userEmail,
                null,
                msg.messageId,
                { isPinned: true },
                true,
                groupId
              ).catch(err => console.error('Error updating pinned message in storage:', err));
            }
            return updatedMsg;
          })
        );
      }
    };

    // Handle message unpinned event
    const handleMessageUnpinned = (data) => {
      if (data.groupId === groupId) {
        setMessages((prev) =>
          prev.map((msg) => {
            const isTargetMessage = (msg.messageId === data.messageId || msg._id === data.messageId);
            if (isTargetMessage) {
              const updatedMsg = { ...msg, isPinned: false };
              // Update in local storage
              if (msg.messageId) {
                chatStorageService.updateMessage(
                  userEmail,
                  null,
                  msg.messageId,
                  { isPinned: false },
                  true,
                  groupId
                ).catch(err => console.error('Error updating unpinned message in storage:', err));
              }
              return updatedMsg;
            }
            return msg;
          })
        );
      }
    };

    // Handle message deleted event
    const handleMessageDeleted = (data) => {
      if (data.groupId === groupId) {
        // Update message to show as deleted (soft delete)
        setMessages((prev) => {
          return prev.map((msg) => {
            if ((msg.messageId || msg._id) === data.messageId) {
              const updatedMsg = {
                ...msg,
                isDeleted: true,
                message: 'This message is deleted',
              };
              // Update in local storage
              chatStorageService.updateMessage(
                userEmail,
                null,
                data.messageId,
                { isDeleted: true, message: 'This message is deleted' },
                true,
                groupId
              ).catch(err => console.error('Error updating deleted group message in storage:', err));
              return updatedMsg;
            }
            return msg;
          });
        });
      }
    };

    const handleMessageEdited = (data) => {
      if (data.groupId === groupId) {
        // Update message with edited content
        setMessages((prev) => {
          return prev.map((msg) => {
            if ((msg.messageId || msg._id) === data.messageId) {
              const updatedMsg = {
                ...msg,
                message: data.newMessage,
                editedAt: data.editedAt,
              };
              // Update in local storage
              chatStorageService.updateMessage(
                userEmail,
                null,
                data.messageId,
                { message: data.newMessage, editedAt: data.editedAt },
                true,
                groupId
              ).catch(err => console.error('Error updating edited group message in storage:', err));
              return updatedMsg;
            }
            return msg;
          });
        });
      }
    };

    // Handle group message read update event
    const handleGroupMessageReadUpdate = (data) => {
      if (data.groupId === groupId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if ((msg.messageId || msg._id) === data.messageId) {
              const updatedMsg = {
                ...msg,
                readBy: data.readBy || [],
                status: data.status || 'sent',
              };
              // Update in local storage
              chatStorageService.updateMessage(
                userEmail,
                null,
                data.messageId,
                { readBy: data.readBy || [], status: data.status || 'sent' },
                true,
                groupId
              ).catch(err => console.error('Error updating group message read status in storage:', err));
              return updatedMsg;
            }
            return msg;
          })
        );
      }
    };

    const handleChatCleared = (data) => {
      console.log('🔔 CHAT CLEARED EVENT RECEIVED (GROUP):', {
        data,
        userEmail,
        groupId,
        clearedBy: data.clearedBy,
        dataGroupId: data.groupId,
        shouldClear: data.groupId === groupId && data.clearedBy === userEmail,
      });
      
      // If current user cleared the chat, filter out old messages
      if (data.groupId === groupId && data.clearedBy === userEmail) {
        console.log('✅ Clearing group messages for current user');
        // Clear all messages - new ones will load on next history fetch
        setMessages([]);
        // Clear local storage
        chatStorageService.clearGroupChat(groupId).catch(err => {
          console.error('Error clearing group chat storage:', err);
        });
        // Request fresh chat history (will be filtered by clearedAt on backend)
        socketService.emit(SOCKET_EVENTS.JOIN_GROUP, {
          groupId,
          userEmail,
        });
        console.log('✅ JOIN_GROUP event emitted to reload filtered messages');
      } else {
        console.log('⚠️ Chat cleared by different user or different group, ignoring');
      }
    };

    socket.on(SOCKET_EVENTS.GROUP_MESSAGE, handleGroupMessage);
    socket.on(SOCKET_EVENTS.GROUP_CHAT_HISTORY, handleGroupChatHistory);
    socket.on(SOCKET_EVENTS.GROUP_TYPING, handleGroupTyping);
    socket.on('messagePinned', handleMessagePinned);
    socket.on('messageUnpinned', handleMessageUnpinned);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('chatCleared', handleChatCleared);
    socket.on('groupMessageReadUpdate', handleGroupMessageReadUpdate);
    
    // Handle bill split updates
    const handleBillSplitUpdated = (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.isBillSplit && msg.billSplitData?._id === data.billSplitId) {
            return {
              ...msg,
              billSplitData: data.billSplit || msg.billSplitData,
            };
          }
          return msg;
        })
      );
    };
    
    socket.on('billSplitUpdated', handleBillSplitUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.GROUP_MESSAGE, handleGroupMessage);
      socket.off(SOCKET_EVENTS.GROUP_CHAT_HISTORY, handleGroupChatHistory);
      socket.off(SOCKET_EVENTS.GROUP_TYPING, handleGroupTyping);
      socket.off('messagePinned', handleMessagePinned);
      socket.off('messageUnpinned', handleMessageUnpinned);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('chatCleared', handleChatCleared);
      socket.off('groupMessageReadUpdate', handleGroupMessageReadUpdate);
      socket.off('billSplitUpdated', handleBillSplitUpdated);
      
      // Cleanup on unmount - clear messages and cache
      setMessages([]);
      // Optionally clear decryption cache on unmount
      // decryptionCache.current.clear();
    };
  }, [socket, userEmail, groupId, decryptMessageIfNeeded]);

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
      
      setMessages((prev) => {
        const updated = [...prev, tempMessage];
        // Save optimistic message to local storage
        chatStorageService.addMessage(userEmail, null, tempMessage, true, groupId).catch(err => {
          console.error('Error saving optimistic group message to storage:', err);
        });
        return updated;
      });
      
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
        // Mark optimistic message as failed instead of removing it
        setMessages((prev) =>
          prev.map((msg) => {
            // Check if it's a file message
            try {
              const msgParsed = typeof msg.message === 'string' ? JSON.parse(msg.message) : msg.message;
              const displayParsed = typeof displayMessage === 'string' ? JSON.parse(displayMessage) : displayMessage;
              
              if (msgParsed && msgParsed.type === 'file' && displayParsed && displayParsed.type === 'file') {
                // Match file messages by fileId
                if (msgParsed.fileId && displayParsed.fileId) {
                  if (
                    msgParsed.fileId === displayParsed.fileId &&
                    msg.senderEmail === userEmail &&
                    msg.isSent &&
                    !msg.messageId
                  ) {
                    return { ...msg, status: 'failed' };
                  }
                } else {
                  // Match by fileName and fileType if fileId not available
                  if (
                    msgParsed.fileName === displayParsed.fileName &&
                    msgParsed.fileType === displayParsed.fileType &&
                    msg.senderEmail === userEmail &&
                    msg.isSent &&
                    !msg.messageId
                  ) {
                    return { ...msg, status: 'failed' };
                  }
                }
              }
            } catch {
              // Not JSON, fall through to regular comparison
            }
            
            // Regular text message comparison
            if (
              msg.message === displayMessage &&
              msg.senderEmail === userEmail &&
              msg.isSent &&
              !msg.messageId
            ) {
              return { ...msg, status: 'failed' };
            }
            
            return msg;
          })
        );
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

  // Function to remove a pending message (undo)
  const removePendingMessage = (messageToRemove) => {
    setMessages((prev) => {
      return prev.filter(msg => {
        // Remove if it matches the message (by content, timestamp, and sender)
        return !(
          msg.message === messageToRemove.message &&
          msg.senderEmail === messageToRemove.senderEmail &&
          msg.isSent === messageToRemove.isSent &&
          Math.abs(new Date(msg.timestamp) - new Date(messageToRemove.timestamp)) < 1000 &&
          !msg.messageId // Only remove pending messages (no messageId)
        );
      });
    });
  };

  // Function to update a specific message (for optimistic updates)
  const updateMessage = useCallback((messageId, updates) => {
    setMessages((prev) => {
      return prev.map((msg) => {
        if ((msg.messageId || msg._id) === messageId) {
          return {
            ...msg,
            ...updates,
          };
        }
        return msg;
      });
    });
  }, []);

  // Function to retry sending a failed message
  const retryMessage = useCallback(async (failedMessage) => {
    if (!failedMessage || !socket || !groupId || !userEmail) return;
    
    // Find the failed message in the list
    const messageToRetry = messages.find(
      (msg) =>
        msg.status === 'failed' &&
        msg.message === failedMessage.message &&
        msg.senderEmail === userEmail &&
        msg.timestamp === failedMessage.timestamp
    );
    
    if (!messageToRetry) {
      console.error('Failed message not found for retry');
      return;
    }
    
    // Extract reply info if present
    const replyInfo = messageToRetry.replyTo ? {
      replyTo: messageToRetry.replyTo,
      replyToMessage: messageToRetry.replyToMessage,
      replyToSender: messageToRetry.replyToSender,
    } : null;
    
    // Change status to 'sent' while retrying
    setMessages((prev) =>
      prev.map((msg) =>
        msg === messageToRetry ? { ...msg, status: 'sent' } : msg
      )
    );
    
    // Retry sending the message
    try {
      await sendMessage(messageToRetry.message, replyInfo);
    } catch (error) {
      console.error('Retry failed:', error);
      // Mark as failed again if retry fails
      setMessages((prev) =>
        prev.map((msg) =>
          msg === messageToRetry ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  }, [messages, socket, groupId, userEmail, sendMessage]);

  // Memoize messages to prevent unnecessary re-renders
  const memoizedMessages = useMemo(() => {
    return messages;
  }, [messages]);

  return {
    messages: memoizedMessages,
    typingUsers,
    loadingMessages,
    sendMessage,
    sendTyping,
    removePendingMessage,
    updateMessage,
    retryMessage,
  };
};

