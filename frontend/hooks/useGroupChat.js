import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants';

export const useGroupChat = (userEmail, groupId) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const socket = socketService.getSocket();

  useEffect(() => {
    if (!socket || !userEmail) return;

    // Login with email when socket connects
    socketService.emit(SOCKET_EVENTS.LOGIN, { email: userEmail });

    // Join group when groupId is available
    if (groupId) {
      socketService.emit(SOCKET_EVENTS.JOIN_GROUP, {
        groupId,
      });
    }

    return () => {
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

    const handleGroupMessage = (data) => {
      console.log('Received group message:', data, 'Current group:', groupId, 'User:', userEmail);
      
      // Only handle messages from the group (not from ourselves via optimistic update)
      const isFromGroup = data.groupId === groupId;
      const isFromSelf = data.senderEmail === userEmail;
      
      if (isFromGroup && !isFromSelf) {
        // Check if message already exists (prevent duplicates)
        setMessages((prev) => {
          const messageExists = prev.some(
            msg => msg.message === data.message && 
                   msg.senderEmail === data.senderEmail && 
                   Math.abs(new Date(msg.timestamp) - new Date(data.timestamp)) < 1000 // Within 1 second
          );
          
          if (messageExists) {
            console.log('Duplicate group message ignored:', data.message);
            return prev;
          }
          
          return [...prev, {
            senderEmail: data.senderEmail,
            message: data.message,
            timestamp: data.timestamp,
            isSent: false, // Always false since this is from another member
          }];
        });
      }
    };

    const handleGroupChatHistory = (data) => {
      // Only load history if it's for the current group
      if (data.groupId === groupId) {
        const formattedMessages = data.messages.map(msg => ({
          senderEmail: msg.senderEmail,
          message: msg.message,
          timestamp: msg.timestamp,
          isSent: msg.senderEmail === userEmail,
        }));
        
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

    socket.on(SOCKET_EVENTS.GROUP_MESSAGE, handleGroupMessage);
    socket.on(SOCKET_EVENTS.GROUP_CHAT_HISTORY, handleGroupChatHistory);
    socket.on(SOCKET_EVENTS.GROUP_TYPING, handleGroupTyping);

    return () => {
      socket.off(SOCKET_EVENTS.GROUP_MESSAGE, handleGroupMessage);
      socket.off(SOCKET_EVENTS.GROUP_CHAT_HISTORY, handleGroupChatHistory);
      socket.off(SOCKET_EVENTS.GROUP_TYPING, handleGroupTyping);
    };
  }, [socket, userEmail, groupId]);

  const sendMessage = (message) => {
    if (message.trim() && socket && groupId && userEmail) {
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
      socketService.emit(SOCKET_EVENTS.GROUP_MESSAGE, {
        message: messageText,
        groupId,
      });
      
      socketService.emit(SOCKET_EVENTS.GROUP_TYPING, {
        groupId,
        isTyping: false,
      });
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

