import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants';

export const useSocket = (userEmail = null) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = socketService.connect(userEmail);
    setSocket(newSocket);

    // Set user email in socket service
    if (userEmail) {
      socketService.setUserEmail(userEmail);
    }

    const handleConnect = () => {
      setIsConnected(true);
      console.log('✅ Connected to server');
      
      // Re-login if we have userEmail
      if (userEmail) {
        console.log('🔐 Logging in after connection:', userEmail);
        socketService.emit(SOCKET_EVENTS.LOGIN, { email: userEmail });
      }
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
      // Login if already connected
      if (userEmail) {
        socketService.emit(SOCKET_EVENTS.LOGIN, { email: userEmail });
      }
    }

    return () => {
      newSocket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      newSocket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      newSocket.off('connect_error', handleConnectError);
      // Don't disconnect here - let socketService manage it
    };
  }, [userEmail]);

  return { socket, isConnected };
};

