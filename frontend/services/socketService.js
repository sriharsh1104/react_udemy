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
    if (this.socket) {
      this.socket.emit(event, data);
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

