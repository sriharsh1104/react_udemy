import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants';

export const useChat = (userEmail, contactEmail) => {
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const socket = socketService.getSocket();

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

    const handlePrivateMessage = (data) => {
      console.log('Received private message:', data, 'Current contact:', contactEmail, 'User:', userEmail);
      
      // Check if message is for current chat
      // Message is for this chat if:
      // 1. Sender is the contact (they sent to us)
      // 2. OR we sent it (sender is us and contactEmail matches)
      const isForCurrentChat = 
        (data.senderEmail === contactEmail && data.senderEmail !== userEmail) ||
        (data.senderEmail === userEmail && data.contactEmail === contactEmail);
      
      if (isForCurrentChat) {
        // Check if message already exists (prevent duplicates)
        setMessages((prev) => {
          const messageExists = prev.some(
            msg => msg.message === data.message && 
                   msg.senderEmail === data.senderEmail && 
                   msg.timestamp === data.timestamp
          );
          
          if (messageExists) {
            return prev;
          }
          
          return [...prev, {
            senderEmail: data.senderEmail,
            message: data.message,
            timestamp: data.timestamp,
            isSent: data.senderEmail === userEmail,
          }];
        });
      }
    };

    const handleChatHistory = (data) => {
      // Only load history if it's for the current contact
      if (data.contactEmail === contactEmail) {
        const formattedMessages = data.messages.map(msg => ({
          senderEmail: msg.senderEmail,
          message: msg.message,
          timestamp: msg.timestamp,
          isSent: msg.senderEmail === userEmail,
        }));
        
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

  const sendMessage = (message) => {
    if (message.trim() && socket && contactEmail && userEmail) {
      const messageText = message.trim();
      
      // Optimistically add message to UI
      const tempMessage = {
        senderEmail: userEmail,
        message: messageText,
        timestamp: new Date().toISOString(),
        isSent: true,
      };
      
      setMessages((prev) => [...prev, tempMessage]);
      
      // Send to server
      socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
        message: messageText,
        contactEmail,
      });
      
      socketService.emit(SOCKET_EVENTS.TYPING, {
        contactEmail,
        isTyping: false,
      });
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
