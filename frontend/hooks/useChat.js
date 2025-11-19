import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import socketService from "../services/socketService";
import { SOCKET_EVENTS } from "../constants";
import encryptionService from "../services/encryptionService";
import chatStorageService from "../services/chatStorageService";

// Removed message limits - WhatsApp-like behavior: all messages accessible

export const useChat = (userEmail, contactEmail, onMessageReceived) => {
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socket = socketService.getSocket();

  // Track message IDs that have been read (to avoid duplicate read receipts)
  const readMessageIds = useRef(new Set());
  
  // Decryption cache to avoid re-decrypting same messages
  const decryptionCache = useRef(new Map());
  
  // Track previous contactEmail to cleanup on chat switch
  const previousContactEmail = useRef(contactEmail);

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
  const decryptMessageIfNeeded = useCallback(async (encryptedMessage, senderEmail) => {
    if (!isEncrypted(encryptedMessage)) {
      // Legacy unencrypted message
      return encryptedMessage;
    }

    // Check cache first
    const cacheKey = `${encryptedMessage}_${senderEmail}`;
    if (decryptionCache.current.has(cacheKey)) {
      return decryptionCache.current.get(cacheKey);
    }

    try {
      const encryptedData = JSON.parse(encryptedMessage);

      // For your own messages, use contactEmail as the other party
      // For messages from contact, use senderEmail as the other party
      const otherPartyEmail =
        senderEmail === userEmail ? contactEmail : senderEmail;

      if (!otherPartyEmail) {
        console.error("Cannot decrypt: missing other party email");
        return "[Encrypted message - decryption failed]";
      }

      // Decrypt using the shared key between userEmail and otherPartyEmail
      const decrypted = await encryptionService.decryptPrivateMessage(
        encryptedData,
        userEmail,
        otherPartyEmail
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
      console.error("Error decrypting message:", error);
      console.error("Message:", encryptedMessage);
      console.error(
        "Sender:",
        senderEmail,
        "User:",
        userEmail,
        "Contact:",
        contactEmail
      );
      return "[Encrypted message - decryption failed]";
    }
  }, [userEmail, contactEmail]);
  
  // Removed cleanupOldMessages - WhatsApp shows all messages

  // Load messages from local storage when contactEmail changes (chat switch)
  useEffect(() => {
    if (!userEmail || !contactEmail) return;
    
    const loadCachedMessages = async () => {
      try {
        // Load messages from local storage first (for offline access)
        const cachedMessages = await chatStorageService.loadPrivateChatMessages(userEmail, contactEmail);
        
        if (cachedMessages.length > 0) {
          console.log(`📂 Loaded ${cachedMessages.length} cached messages for ${contactEmail}`);
          // Show cached messages immediately
          setMessages(cachedMessages);
        }
      } catch (error) {
        console.error('Error loading cached messages:', error);
      }
    };
    
    if (previousContactEmail.current !== contactEmail && previousContactEmail.current !== null) {
      // Chat switched - clear messages to prevent memory leak
      console.log('🧹 Cleaning up messages for chat switch:', {
        from: previousContactEmail.current,
        to: contactEmail
      });
      setMessages([]);
      readMessageIds.current.clear();
      // Load cached messages for new chat
      loadCachedMessages();
    } else if (previousContactEmail.current === null && contactEmail) {
      // Initial load - load cached messages
      loadCachedMessages();
    }
    
    previousContactEmail.current = contactEmail;
  }, [contactEmail, userEmail]);

  useEffect(() => {
    if (!socket || !userEmail) return;

    // Wait for socket to be connected before logging in
    const handleConnect = () => {
      // Login with email when socket connects
      const loginSent = socketService.emit(SOCKET_EVENTS.LOGIN, {
        email: userEmail,
      });

      // Join chat room when contactEmail is available
      if (contactEmail) {
        const joinSent = socketService.emit(SOCKET_EVENTS.JOIN_CHAT, {
          userEmail,
          contactEmail,
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
      // Handle messages from the contact OR call messages (which can be from either user)
      // Also handle messages sent by user (for echo/confirmation)
      const isFromContact = data.senderEmail === contactEmail && data.senderEmail !== userEmail;
      const isFromUser = data.senderEmail === userEmail;
      const isCallMessage = data.isCallMessage === true;
      // Check if message is relevant to this chat (either sender or receiver matches)
      // This handles both: messages FROM contact TO user, and messages FROM user TO contact (echo)
      const isRelevantToChat = 
        (data.senderEmail === contactEmail || data.senderEmail === userEmail) &&
        (data.receiverEmail === contactEmail || data.receiverEmail === userEmail || !data.receiverEmail);
      const isRelevantMessage = isRelevantToChat || isCallMessage;

      if (isRelevantMessage) {
        // For call messages, don't decrypt (they're plain text system messages)
        // For regular messages, decrypt
        // Ensure data.message is a string before decrypting
        // CRITICAL: Handle case where data.message might be an object (e.g., from reminder)
        let messageToDecrypt;
        if (typeof data.message === 'string') {
          messageToDecrypt = data.message;
        } else if (data.message && typeof data.message === 'object') {
          // If message is an object, extract the message text
          messageToDecrypt = data.message.message || data.message.text || JSON.stringify(data.message);
          console.warn('Received message object instead of string, extracted:', messageToDecrypt);
        } else {
          messageToDecrypt = String(data.message || '');
        }
        
        const decryptedMessage = isCallMessage
          ? messageToDecrypt
          : await decryptMessageIfNeeded(messageToDecrypt, data.senderEmail);

        // Add message directly without duplication checks
        const messageId = data.messageId || data._id;

        // Notify parent component that a new message was received (to refresh contacts)
        if (onMessageReceived) {
          onMessageReceived();
        }

        const newMessage = {
          senderEmail: data.senderEmail,
          message: decryptedMessage,
          timestamp: data.timestamp,
          isSent: data.senderEmail === userEmail, // True if from current user, false if from contact
          messageId: messageId || null,
          status: data.senderEmail === userEmail ? (data.status || "sent") : "delivered", // Use status from server if available
          replyTo: data.replyTo || null,
          replyToMessage: data.replyToMessage || null,
          replyToSender: data.replyToSender || null,
          isDeleted: data.isDeleted || false,
          editedAt: data.editedAt || null,
          isCallMessage: data.isCallMessage || false,
          callRecord: data.callRecord || null,
          isBillSplit: data.isBillSplit || false,
          billSplitData: data.billSplitData || null,
        };

        setMessages((prev) => {
          const updatedMessages = [...prev, newMessage];
          
          // Save to local storage
          chatStorageService.addMessage(userEmail, contactEmail, newMessage, false, null).catch(err => {
            console.error('Error saving message to storage:', err);
          });
          
          // Send read receipt AFTER message is added to state (only for messages from contact, not our own)
          // Use setTimeout to ensure state update completes first
          if (messageId && !readMessageIds.current.has(messageId) && data.senderEmail !== userEmail) {
            readMessageIds.current.add(messageId);
            // Delay read receipt slightly to ensure message is displayed
            setTimeout(() => {
              socketService.emit(SOCKET_EVENTS.MESSAGE_READ, {
                messageId: messageId,
                senderEmail: data.senderEmail,
              });
            }, 100);
          }
          
          return updatedMessages;
        });
      }
    };

    const handleChatHistory = async (data) => {
      // Only load history if it's for the current contact
      if (data.contactEmail === contactEmail) {
        setLoadingMessages(true);
        // Decrypt all messages in history
        let formattedMessages = await Promise.all(
          data.messages.map(async (msg) => {
            // Ensure msg.message is a string before decrypting
            const messageToDecrypt = typeof msg.message === 'string' 
              ? msg.message 
              : (msg.message?.message || msg.message?.text || String(msg.message || ''));
            
            const decryptedMessage = await decryptMessageIfNeeded(
              messageToDecrypt,
              msg.senderEmail
            );
            return {
              senderEmail: msg.senderEmail,
              message: decryptedMessage,
              timestamp: msg.timestamp,
              isSent: msg.senderEmail === userEmail,
              messageId: msg._id ? msg._id.toString() : null,
              status: msg.status || "sent",
              deliveredAt: msg.deliveredAt || null,
              replyTo: msg.replyTo || null,
              replyToMessage: msg.replyToMessage || null,
              replyToSender: msg.replyToSender || null,
              isDeleted: msg.isDeleted || false,
              editedAt: msg.editedAt || null,
              isCallMessage: msg.isCallMessage || false,
              callRecord: msg.callRecord || null,
              isBillSplit: msg.isBillSplit || false,
              billSplitData: msg.billSplitData || null,
            };
          })
        );

        // No cleanup - keep all messages

        // Merge with cached messages from local storage
        const cachedMessages = await chatStorageService.loadPrivateChatMessages(userEmail, contactEmail);
        const mergedMessages = chatStorageService.mergeMessages(cachedMessages, formattedMessages);
        
        // Add all messages directly without duplicate checks or limitations
        setMessages((prev) => {
          // Simply combine all messages and sort by timestamp
          const allMessages = [...prev, ...mergedMessages];
          allMessages.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          return allMessages;
        });
        
        // Save merged messages to local storage
        chatStorageService.savePrivateChatMessages(userEmail, contactEmail, mergedMessages).catch(err => {
          console.error('Error saving chat history to storage:', err);
        });

        // Send read receipts for messages from contact that haven't been read yet
        // Only send after a delay to ensure messages are displayed first
        setTimeout(() => {
          formattedMessages.forEach((msg) => {
            if (
              !msg.isSent &&
              msg.messageId &&
              !readMessageIds.current.has(msg.messageId)
            ) {
              // Mark as read and send receipt
              readMessageIds.current.add(msg.messageId);
              socketService.emit(SOCKET_EVENTS.MESSAGE_READ, {
                messageId: msg.messageId,
                senderEmail: msg.senderEmail,
              });
            }
          });
        }, 500); // Delay to ensure messages are displayed
        setLoadingMessages(false);
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
        const messageById = prev.find(
          (msg) => data.messageId && msg.messageId === data.messageId
        );
        if (messageById) {
          const updated = prev.map((msg) => {
            if (msg.messageId === data.messageId) {
              const updatedMsg = {
                ...msg,
                status: data.status,
                deliveredAt: data.deliveredAt || msg.deliveredAt,
              };
              // Update in local storage
              chatStorageService.updateMessage(
                userEmail, 
                contactEmail, 
                data.messageId, 
                { status: data.status, deliveredAt: data.deliveredAt || msg.deliveredAt },
                false,
                null
              ).catch(err => console.error('Error updating message in storage:', err));
              return updatedMsg;
            }
            return msg;
          });
          return updated;
        }

        // If no match by messageId, try to match the most recent 'sent' message without messageId
        // This handles optimistic updates where we don't have messageId yet
        // Match by timestamp proximity (within 2 seconds) to ensure we update the correct message
        const sentMessagesWithoutId = prev
          .filter(
            (msg) =>
              msg.isSent &&
              msg.senderEmail === userEmail &&
              !msg.messageId &&
              msg.status === "sent"
          )
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Most recent first

        if (sentMessagesWithoutId.length > 0) {
          // Try to match by timestamp if available in data
          if (data.timestamp) {
            const matchedByTimestamp = sentMessagesWithoutId.find(
              (msg) =>
                Math.abs(new Date(msg.timestamp) - new Date(data.timestamp)) < 2000
            );
            if (matchedByTimestamp) {
              return prev.map((msg) => {
                if (msg === matchedByTimestamp) {
                  const updatedMsg = {
                    ...msg,
                    status: data.status,
                    deliveredAt: data.deliveredAt || msg.deliveredAt,
                    messageId: data.messageId || msg.messageId,
                  };
                  // Update in local storage
                  if (data.messageId) {
                    chatStorageService.updateMessage(
                      userEmail,
                      contactEmail,
                      data.messageId,
                      { status: data.status, deliveredAt: data.deliveredAt || msg.deliveredAt, messageId: data.messageId },
                      false,
                      null
                    ).catch(err => console.error('Error updating message status in storage:', err));
                  }
                  return updatedMsg;
                }
                return msg;
              });
            }
          }
          
          // Fallback: Update the most recent one
          const mostRecent = sentMessagesWithoutId[0];
          return prev.map((msg) => {
            if (msg === mostRecent) {
              const updatedMsg = {
                ...msg,
                status: data.status,
                deliveredAt: data.deliveredAt || msg.deliveredAt,
                messageId: data.messageId || msg.messageId,
              };
              // Update in local storage
              if (data.messageId) {
                chatStorageService.updateMessage(
                  userEmail,
                  contactEmail,
                  data.messageId,
                  { status: data.status, deliveredAt: data.deliveredAt || msg.deliveredAt, messageId: data.messageId },
                  false,
                  null
                ).catch(err => console.error('Error updating message status in storage:', err));
              }
              return updatedMsg;
            }
            return msg;
          });
        }

        return prev;
      });
    };

    const handleMessageDeleted = (data) => {
      // Update message to show as deleted
      setMessages((prev) => {
        return prev.map((msg) => {
          if (msg.messageId === data.messageId) {
            const updatedMsg = {
              ...msg,
              isDeleted: true,
              message: "This message is deleted",
            };
            // Update in local storage
            chatStorageService.updateMessage(
              userEmail,
              contactEmail,
              data.messageId,
              { isDeleted: true, message: "This message is deleted" },
              false,
              null
            ).catch(err => console.error('Error updating deleted message in storage:', err));
            return updatedMsg;
          }
          return msg;
        });
      });
    };

    const handleMessageEdited = (data) => {
      // Update message with edited content
      setMessages((prev) => {
        return prev.map((msg) => {
          if (msg.messageId === data.messageId) {
            const updatedMsg = {
              ...msg,
              message: data.newMessage,
              editedAt: data.editedAt,
            };
            // Update in local storage
            chatStorageService.updateMessage(
              userEmail,
              contactEmail,
              data.messageId,
              { message: data.newMessage, editedAt: data.editedAt },
              false,
              null
            ).catch(err => console.error('Error updating edited message in storage:', err));
            return updatedMsg;
          }
          return msg;
        });
      });
    };

    const handleChatCleared = (data) => {

      // If current user cleared the chat, filter out old messages
      if (data.clearedBy === userEmail) {
        // Clear all messages - new ones will load on next history fetch
        setMessages([]);
        // Clear local storage
        chatStorageService.clearPrivateChat(userEmail, contactEmail).catch(err => {
          console.error('Error clearing chat storage:', err);
        });
        // Request fresh chat history (will be filtered by clearedAt on backend)
        socketService.emit(SOCKET_EVENTS.JOIN_CHAT, {
          userEmail,
          contactEmail,
        });
      } 
    };

    socket.on(SOCKET_EVENTS.PRIVATE_MESSAGE, handlePrivateMessage);
    socket.on(SOCKET_EVENTS.CHAT_HISTORY, handleChatHistory);
    socket.on(SOCKET_EVENTS.TYPING, handleTyping);
    socket.on(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleMessageStatusUpdate);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("chatCleared", handleChatCleared);
    
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
    
    socket.on("billSplitUpdated", handleBillSplitUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.PRIVATE_MESSAGE, handlePrivateMessage);
      socket.off(SOCKET_EVENTS.CHAT_HISTORY, handleChatHistory);
      socket.off(SOCKET_EVENTS.TYPING, handleTyping);
      socket.off(
        SOCKET_EVENTS.MESSAGE_STATUS_UPDATE,
        handleMessageStatusUpdate
      );
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("chatCleared", handleChatCleared);
      socket.off("billSplitUpdated", handleBillSplitUpdated);
      
      // Cleanup on unmount - clear messages and cache
      setMessages([]);
      readMessageIds.current.clear();
      // Optionally clear decryption cache on unmount
      // decryptionCache.current.clear();
    };
  }, [socket, userEmail, contactEmail, decryptMessageIfNeeded]);

  const sendMessage = async (message, replyInfo = null) => {
    if (message.trim() && socket && contactEmail && userEmail) {
      const messageText = message.trim();

      // Check if message is a file message (JSON string with type: 'file')
      let displayMessage = messageText;
      try {
        const parsed = JSON.parse(messageText);
        if (parsed && parsed.type === "file") {
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
        status: "sent", // Initial status - will be updated when delivered
        messageId: null, // Will be set when we get confirmation from server
        replyTo: replyInfo?.replyTo || null,
        replyToMessage: replyInfo?.replyToMessage || null,
        replyToSender: replyInfo?.replyToSender || null,
      };

      setMessages((prev) => {
        const updated = [...prev, tempMessage];
        // Save optimistic message to local storage
        chatStorageService.addMessage(userEmail, contactEmail, tempMessage, false, null).catch(err => {
          console.error('Error saving optimistic message to storage:', err);
        });
        return updated;
      });

      try {
        // Encrypt the message before sending (file messages are encrypted as JSON strings)
        const encryptedData = await encryptionService.encryptPrivateMessage(
          messageText,
          userEmail,
          contactEmail
        );

        // Convert encrypted data to JSON string for storage
        const encryptedMessage = JSON.stringify(encryptedData);

        // Check socket connection before sending
        const currentSocket = socketService.getSocket();

        if (!currentSocket) {
          console.error("❌ Socket not initialized. Cannot send message.");
          throw new Error("Socket not initialized");
        }

        if (!currentSocket.connected) {
          console.error("❌ Socket not connected. Current state:", {
            connected: currentSocket.connected,
            disconnected: currentSocket.disconnected,
            socketId: currentSocket.id,
            readyState: currentSocket.io?.readyState,
            transport: currentSocket.io?.engine?.transport?.name,
          });
          console.error("❌ Attempting to reconnect...");

          // Try to reconnect with retry
          socketService.connect(userEmail);

          // Wait for connection with timeout
          let retries = 0;
          const maxRetries = 5;
          while (!currentSocket.connected && retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            retries++;
            // Re-check socket
            const updatedSocket = socketService.getSocket();
            if (updatedSocket && updatedSocket.connected) {
              console.log("✅ Socket reconnected after", retries, "retries");
              break;
            }
          }

          if (!currentSocket.connected) {
            throw new Error(
              "Socket not connected. Please check your internet connection and try again."
            );
          }
        }

        // Prepare message payload
        const messagePayload = {
          message: encryptedMessage,
          contactEmail,
          senderEmail: userEmail, // Include senderEmail for reliability
          replyTo: replyInfo?.replyTo || null,
          replyToMessage: replyInfo?.replyToMessage || null,
          replyToSender: replyInfo?.replyToSender || null,
        };

        // Send encrypted message to server
        const messageSent = socketService.emit(
          SOCKET_EVENTS.PRIVATE_MESSAGE,
          messagePayload
        );

        if (!messageSent) {
          console.error("❌ Failed to emit PRIVATE_MESSAGE event");
          throw new Error("Failed to send message");
        }
        socketService.emit(SOCKET_EVENTS.TYPING, {
          contactEmail,
          isTyping: false,
        });
      } catch (error) {
        console.error("❌ Error sending message:", error);
        console.error("❌ Error details:", {
          message: error.message,
          stack: error.stack,
          socketConnected: socketService.getSocket()?.connected,
          socketExists: !!socketService.getSocket(),
        });

        // Mark optimistic message as failed instead of removing it
        // For file messages, need to parse JSON to match properly
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
                    !msg.messageId // Only mark optimistic messages as failed
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
              !msg.messageId // Only mark optimistic messages as failed
            ) {
              return { ...msg, status: 'failed' };
            }
            
            return msg;
          })
        );

        // Show user-friendly error
        console.error("❌ Message send failed, marked as failed for retry");
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
      if (
        !msg.isSent &&
        msg.messageId &&
        !readMessageIds.current.has(msg.messageId)
      ) {
        readMessageIds.current.add(msg.messageId);
        socketService.emit(SOCKET_EVENTS.MESSAGE_READ, {
          messageId: msg.messageId,
          senderEmail: msg.senderEmail,
        });
      }
    });
  };

  // Function to remove a pending message (undo)
  const removePendingMessage = (messageToRemove) => {
    setMessages((prev) => {
      return prev.filter((msg) => {
        // Remove if it matches the message (by content, timestamp, and sender)
        return !(
          (
            msg.message === messageToRemove.message &&
            msg.senderEmail === messageToRemove.senderEmail &&
            msg.isSent === messageToRemove.isSent &&
            Math.abs(
              new Date(msg.timestamp) - new Date(messageToRemove.timestamp)
            ) < 1000 &&
            !msg.messageId
          ) // Only remove pending messages (no messageId)
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
    if (!failedMessage || !socket || !contactEmail || !userEmail) return;
    
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
    
    // Change status to 'sending' while retrying
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
  }, [messages, socket, contactEmail, userEmail, sendMessage]);

  // Memoize messages to prevent unnecessary re-renders
  const memoizedMessages = useMemo(() => {
    return messages;
  }, [messages]);

  return {
    messages: memoizedMessages,
    typingUser,
    loadingMessages,
    sendMessage,
    sendTyping,
    markMessagesAsRead,
    removePendingMessage,
    updateMessage,
    retryMessage,
  };
};
