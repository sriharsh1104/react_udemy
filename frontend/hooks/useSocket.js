import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = socketService.connect();
    setSocket(newSocket);

    newSocket.on(SOCKET_EVENTS.CONNECT, () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on(SOCKET_EVENTS.DISCONNECT, () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  return { socket, isConnected };
};

