import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = socketService.connect();
    setSocket(newSocket);

    const handleConnect = () => {
      setIsConnected(true);
      console.log('✅ Connected to server');
    };

    const handleDisconnect = (reason) => {
      setIsConnected(false);
      console.log('❌ Disconnected from server:', reason);
    };

    const handleConnectError = (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
    };

    newSocket.on(SOCKET_EVENTS.CONNECT, handleConnect);
    newSocket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
    newSocket.on('connect_error', handleConnectError);

    // Check initial connection state
    if (newSocket.connected) {
      setIsConnected(true);
    }

    return () => {
      newSocket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      newSocket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      newSocket.off('connect_error', handleConnectError);
      // Don't disconnect here - let socketService manage it
    };
  }, []);

  return { socket, isConnected };
};

