import { io } from 'socket.io-client';
import { API_CONFIG, SOCKET_EVENTS } from '../constants';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(API_CONFIG.SOCKET_URL, {
        transports: ['websocket'],
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

