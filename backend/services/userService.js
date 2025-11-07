class UserService {
  constructor() {
    this.users = new Map(); // socketId -> username
    this.sessions = new Map(); // token -> email
    this.emailToToken = new Map(); // email -> token
  }

  addUser(socketId, username) {
    this.users.set(socketId, username);
    return Array.from(this.users.values());
  }

  removeUser(socketId) {
    const username = this.users.get(socketId);
    this.users.delete(socketId);
    return username;
  }

  getUser(socketId) {
    return this.users.get(socketId);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  getUserCount() {
    return this.users.size;
  }

  // Session management for email-based auth
  addUserSession(email, token) {
    this.sessions.set(token, email);
    this.emailToToken.set(email, token);
  }

  getUserByToken(token) {
    return this.sessions.get(token);
  }

  removeSession(token) {
    const email = this.sessions.get(token);
    if (email) {
      this.sessions.delete(token);
      this.emailToToken.delete(email);
    }
  }

  getTokenByEmail(email) {
    return this.emailToToken.get(email);
  }
}

module.exports = new UserService();

