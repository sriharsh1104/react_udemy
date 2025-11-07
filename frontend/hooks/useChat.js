import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants';

export const useChat = (username) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const socket = socketService.getSocket();

  useEffect(() => {
    if (!socket || !username) return;

    const handleMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleUserJoined = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleUserLeft = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleTyping = (data) => {
      if (data.isTyping) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
          return prev;
        });
      } else {
        setTypingUsers((prev) => prev.filter((user) => user !== data.username));
      }
    };

    socket.on(SOCKET_EVENTS.MESSAGE, handleMessage);
    socket.on(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
    socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
    socket.on(SOCKET_EVENTS.TYPING, handleTyping);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE, handleMessage);
      socket.off(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
      socket.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
      socket.off(SOCKET_EVENTS.TYPING, handleTyping);
    };
  }, [socket, username]);

  const sendMessage = (message) => {
    if (message.trim() && socket) {
      socketService.emit(SOCKET_EVENTS.MESSAGE, { message: message.trim() });
      socketService.emit(SOCKET_EVENTS.TYPING, { isTyping: false });
    }
  };

  const sendTyping = (isTyping) => {
    if (socket) {
      socketService.emit(SOCKET_EVENTS.TYPING, { isTyping });
    }
  };

  return {
    messages,
    typingUsers,
    sendMessage,
    sendTyping,
  };
};

