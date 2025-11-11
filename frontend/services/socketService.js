import { io } from 'socket.io-client';
import { API_CONFIG, SOCKET_EVENTS } from '../constants';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      console.log('🔌 Connecting to socket:', API_CONFIG.SOCKET_URL);
      this.socket = io(API_CONFIG.SOCKET_URL, {
        transports: ['websocket', 'polling'], // Allow fallback to polling for mobile
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: 20000,
        forceNew: false,
      });
      
      // Add connection event handlers
      this.socket.on('connect', () => {
        console.log('✅ Socket connected successfully to:', API_CONFIG.SOCKET_URL);
        console.log('✅ Socket ID:', this.socket.id);
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        console.error('❌ Socket URL:', API_CONFIG.SOCKET_URL);
        console.error('❌ Error details:', error);
      });
      
      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Socket reconnection attempt ${attemptNumber}`);
      });
      
      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
        console.log('✅ Socket ID:', this.socket.id);
      });
      
      this.socket.on('reconnect_failed', () => {
        console.error('❌ Socket reconnection failed');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  emit(event, data) {
    if (!this.socket) {
      console.error('❌ Socket not initialized. Cannot emit:', event);
      return false;
    }
    
    if (!this.socket.connected) {
      console.error('❌ Socket not connected. Cannot emit:', event);
      return false;
    }
    
    try {
      this.socket.emit(event, data);
      console.log('✅ Socket emit:', event, data ? Object.keys(data) : 'no data');
      return true;
    } catch (error) {
      console.error('❌ Error emitting socket event:', event, error);
      return false;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();

