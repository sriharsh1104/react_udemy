import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import socketService from "../services/socketService";
import { SOCKET_EVENTS } from "../constants";
import encryptionService from "../services/encryptionService";

// Constants for memory management
const MAX_MESSAGES_IN_MEMORY = 500; // Limit messages to prevent memory leaks
const MESSAGE_CLEANUP_THRESHOLD = 600; // Cleanup when exceeding this

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
  
  /**
   * Cleanup old messages to prevent memory leaks
   * Keeps only the most recent MAX_MESSAGES_IN_MEMORY messages
   */
  const cleanupOldMessages = useCallback((messageArray) => {
    if (messageArray.length <= MAX_MESSAGES_IN_MEMORY) {
      return messageArray;
    }
    
    // Keep only the most recent messages
    const sorted = [...messageArray].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    return sorted.slice(-MAX_MESSAGES_IN_MEMORY);
  }, []);

  // Cleanup messages when contactEmail changes (chat switch)
  useEffect(() => {
    if (previousContactEmail.current !== contactEmail && previousContactEmail.current !== null) {
      // Chat switched - clear messages to prevent memory leak
      console.log('🧹 Cleaning up messages for chat switch:', {
        from: previousContactEmail.current,
        to: contactEmail
      });
      setMessages([]);
      readMessageIds.current.clear();
      // Clear decryption cache for old chat (optional - can keep for better performance)
      // decryptionCache.current.clear();
    }
    previousContactEmail.current = contactEmail;
  }, [contactEmail]);

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
      const isFromContact =
        data.senderEmail === contactEmail && data.senderEmail !== userEmail;
      const isCallMessage = data.isCallMessage === true;
      const isRelevantMessage = isFromContact || (isCallMessage && data.receiverEmail === contactEmail);

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

        // Check if message already exists (prevent duplicates)
        // For call messages, check by messageId or sessionId to be more reliable
        setMessages((prev) => {
          let messageExists = false;
          
          if (isCallMessage && data.callRecord?.sessionId) {
            // For call messages, check by sessionId in callRecord
            messageExists = prev.some(
              (msg) =>
                msg.isCallMessage &&
                msg.callRecord?.sessionId === data.callRecord.sessionId
            );
          } else {
            // For regular messages, check by content and timestamp
            messageExists = prev.some(
            (msg) =>
              msg.message === decryptedMessage &&
              msg.senderEmail === data.senderEmail &&
              Math.abs(new Date(msg.timestamp) - new Date(data.timestamp)) <
                1000 // Within 1 second
          );
          }

          if (messageExists) {
            console.log("Duplicate message ignored:", decryptedMessage);
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
            isSent: data.senderEmail === userEmail, // True if from current user, false if from contact
            messageId: data.messageId || data._id || null,
            status: data.senderEmail === userEmail ? "sent" : "delivered", // Sent if from us, delivered if from contact
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

          // Send read receipt immediately if we have messageId (only for messages from contact, not our own)
          if (data.messageId && !readMessageIds.current.has(data.messageId) && data.senderEmail !== userEmail) {
            readMessageIds.current.add(data.messageId);
            socketService.emit(SOCKET_EVENTS.MESSAGE_READ, {
              messageId: data.messageId,
              senderEmail: data.senderEmail,
            });
          }

          const updatedMessages = [...prev, newMessage];
          
          // Cleanup old messages if threshold exceeded
          if (updatedMessages.length > MESSAGE_CLEANUP_THRESHOLD) {
            return cleanupOldMessages(updatedMessages);
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

        // Cleanup old messages if threshold exceeded before merging
        if (formattedMessages.length > MESSAGE_CLEANUP_THRESHOLD) {
          formattedMessages = cleanupOldMessages(formattedMessages);
        }

        // Only replace messages if we don't have any messages yet, or if this is the initial load
        // Otherwise, merge with existing messages to avoid clearing optimistic updates
        setMessages((prev) => {
          // If we already have messages, merge them intelligently
          if (prev.length > 0) {
            // Create a map of existing messages by messageId for quick lookup
            const existingMessagesMap = new Map();
            prev.forEach((msg) => {
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
                  (m) => m.messageId === historyMsg.messageId
                );
                if (existingIndex >= 0) {
                  // Update existing message with history data (preserve status if it's more recent)
                  mergedMessages[existingIndex] = {
                    ...mergedMessages[existingIndex],
                    ...historyMsg,
                    // Keep the more recent status if we have one
                    status:
                      mergedMessages[existingIndex].status === "read" ||
                      mergedMessages[existingIndex].status === "delivered"
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
                  (m) =>
                    m.message === historyMsg.message &&
                    m.senderEmail === historyMsg.senderEmail &&
                    Math.abs(
                      new Date(m.timestamp) - new Date(historyMsg.timestamp)
                    ) < 1000
                );
                if (!isDuplicate) {
                  mergedMessages.push(historyMsg);
                }
              }
            });

            // Sort by timestamp
            mergedMessages.sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );

            // Cleanup old messages if threshold exceeded
            if (mergedMessages.length > MESSAGE_CLEANUP_THRESHOLD) {
              return cleanupOldMessages(mergedMessages);
            }
            
            return mergedMessages;
          }

          // First load - return formatted messages (already cleaned up if needed)
          return formattedMessages;
        });

        // Send read receipts for messages from contact that haven't been read yet
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
          }
          
          // Fallback: Update the most recent one
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

    const handleMessageDeleted = (data) => {
      // Update message to show as deleted
      setMessages((prev) => {
        return prev.map((msg) => {
          if (msg.messageId === data.messageId) {
            return {
              ...msg,
              isDeleted: true,
              message: "This message is deleted",
            };
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
            return {
              ...msg,
              message: data.newMessage,
              editedAt: data.editedAt,
            };
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
  }, [socket, userEmail, contactEmail, cleanupOldMessages, decryptMessageIfNeeded]);

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
        // Cleanup old messages if threshold exceeded
        if (updated.length > MESSAGE_CLEANUP_THRESHOLD) {
          return cleanupOldMessages(updated);
        }
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

        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter(
            (msg) =>
              !(
                msg.message === displayMessage &&
                msg.senderEmail === userEmail &&
                msg.isSent
              )
          )
        );

        // Show user-friendly error (optional - you can add toast here if needed)
        // For now, just log it - the UI will show the message was removed
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
  };
};
