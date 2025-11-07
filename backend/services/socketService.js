const userService = require('../services/userService');

class SocketService {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle user joining
      socket.on('join', (username) => {
        this.handleJoin(socket, username);
      });

      // Handle incoming messages
      socket.on('message', (data) => {
        this.handleMessage(socket, data);
      });

      // Handle typing indicator
      socket.on('typing', (data) => {
        this.handleTyping(socket, data);
      });

      // Handle user disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  handleJoin(socket, username) {
    const users = userService.addUser(socket.id, username);
    
    socket.broadcast.emit('userJoined', {
      username,
      message: `${username} joined the chat`,
      timestamp: new Date().toISOString()
    });
    
    this.io.emit('usersUpdate', users);
  }

  handleMessage(socket, data) {
    const username = userService.getUser(socket.id) || 'Anonymous';
    
    this.io.emit('message', {
      username,
      message: data.message,
      timestamp: new Date().toISOString()
    });
  }

  handleTyping(socket, data) {
    const username = userService.getUser(socket.id) || 'Anonymous';
    
    socket.broadcast.emit('typing', {
      username,
      isTyping: data.isTyping
    });
  }

  handleDisconnect(socket) {
    const username = userService.removeUser(socket.id);
    
    if (username) {
      socket.broadcast.emit('userLeft', {
        username,
        message: `${username} left the chat`,
        timestamp: new Date().toISOString()
      });
      
      this.io.emit('usersUpdate', userService.getAllUsers());
    }
    
    console.log('User disconnected:', socket.id);
  }
}

module.exports = SocketService;

