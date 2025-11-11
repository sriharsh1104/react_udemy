import { io } from 'socket.io-client';
import { API_CONFIG, SOCKET_EVENTS } from '../constants';
import { AppState, Platform } from 'react-native';

class SocketService {
  constructor() {
    this.socket = null;
    this.appState = 'active';
    this.userEmail = null;
    this.appStateListener = null;
  }

  connect(userEmail = null) {
    if (userEmail) {
      this.userEmail = userEmail;
    }

    if (!this.socket) {
      console.log('🔌 Connecting to socket:', API_CONFIG.SOCKET_URL);
      this.socket = io(API_CONFIG.SOCKET_URL, {
        transports: ['websocket', 'polling'], // Allow fallback to polling for mobile
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: 30000, // Increased timeout for mobile networks
        forceNew: false,
        autoConnect: true,
        upgrade: true, // Allow transport upgrade
        rememberUpgrade: true, // Remember transport preference
        // Mobile-specific settings
        ...(Platform.OS !== 'web' && {
          // Force polling first on mobile for better reliability
          transports: ['polling', 'websocket'],
        }),
      });
      
      // Add connection event handlers
      this.socket.on('connect', () => {
        console.log('✅ Socket connected successfully to:', API_CONFIG.SOCKET_URL);
        console.log('✅ Socket ID:', this.socket.id);
        
        // Re-login if we have userEmail
        if (this.userEmail) {
          console.log('🔐 Re-authenticating after connection:', this.userEmail);
          this.socket.emit(SOCKET_EVENTS.LOGIN, { email: this.userEmail });
        }
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
        
        // Re-login after reconnection
        if (this.userEmail) {
          console.log('🔐 Re-authenticating after reconnection:', this.userEmail);
          this.socket.emit(SOCKET_EVENTS.LOGIN, { email: this.userEmail });
        }
      });
      
      this.socket.on('reconnect_failed', () => {
        console.error('❌ Socket reconnection failed');
      });

      // Setup app state listener for mobile
      if (Platform.OS !== 'web') {
        this.setupAppStateListener();
      }
    } else if (this.socket && !this.socket.connected) {
      // If socket exists but not connected, try to reconnect
      console.log('🔄 Socket exists but not connected, attempting reconnect...');
      this.socket.connect();
    }
    
    return this.socket;
  }

  setupAppStateListener() {
    // Remove existing listener if any
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }

    const handleAppStateChange = (nextAppState) => {
      console.log('📱 App state changed:', this.appState, '->', nextAppState);
      
      if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('📱 App came to foreground, checking socket connection...');
        
        if (this.socket && !this.socket.connected) {
          console.log('🔄 Reconnecting socket after app came to foreground...');
          this.socket.connect();
        } else if (this.socket && this.socket.connected && this.userEmail) {
          // Re-authenticate to ensure we're still logged in
          console.log('🔐 Re-authenticating after app came to foreground:', this.userEmail);
          this.socket.emit(SOCKET_EVENTS.LOGIN, { email: this.userEmail });
        }
      }
      
      this.appState = nextAppState;
    };

    // Add listener and store subscription
    this.appStateListener = AppState.addEventListener('change', handleAppStateChange);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Remove app state listener
    if (this.appStateListener && Platform.OS !== 'web') {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
    
    this.userEmail = null;
  }

  setUserEmail(email) {
    this.userEmail = email;
    // If socket is connected, login immediately
    if (this.socket && this.socket.connected && email) {
      console.log('🔐 Setting user email and logging in:', email);
      this.socket.emit(SOCKET_EVENTS.LOGIN, { email });
    }
  }

  emit(event, data) {
    if (!this.socket) {
      console.error('❌ Socket not initialized. Cannot emit:', event);
      // Try to reconnect
      if (this.userEmail) {
        console.log('🔄 Attempting to reconnect socket...');
        this.connect(this.userEmail);
      }
      return false;
    }
    
    // Check connection state more thoroughly
    const isConnected = this.socket.connected && !this.socket.disconnected;
    
    if (!isConnected) {
      console.error('❌ Socket not connected. Cannot emit:', event, {
        socketExists: !!this.socket,
        connected: this.socket.connected,
        disconnected: this.socket.disconnected,
        socketId: this.socket.id,
        readyState: this.socket.io?.readyState,
      });
      
      // Try to reconnect if we have userEmail
      if (this.userEmail && !this.socket.connecting) {
        console.log('🔄 Attempting to reconnect before emit...');
        this.socket.connect();
        // Wait a bit for connection, but don't block
        setTimeout(() => {
          if (this.socket.connected) {
            console.log('✅ Reconnected, retrying emit...');
            this.socket.emit(event, data);
          }
        }, 1000);
      }
      return false;
    }
    
    try {
      // Log detailed emit information
      console.log('📤 SOCKET EMIT:', {
        event,
        socketId: this.socket.id,
        connected: this.socket.connected,
        transport: this.socket.io?.engine?.transport?.name,
        dataKeys: data ? Object.keys(data) : [],
        hasMessage: data?.message ? true : false,
        messageLength: data?.message?.length || 0,
        senderEmail: data?.senderEmail,
        contactEmail: data?.contactEmail,
        platform: Platform.OS,
      });
      
      // Use callback to verify message was sent
      this.socket.emit(event, data, (response) => {
        if (response && response.error) {
          console.error('❌ Server responded with error:', response.error);
        } else {
          console.log('✅ Server acknowledged message:', event);
        }
      });
      
      console.log('✅ Socket emit successful:', event);
      return true;
    } catch (error) {
      console.error('❌ Error emitting socket event:', {
        event,
        error: error.message,
        stack: error.stack,
        socketId: this.socket?.id,
        connected: this.socket?.connected,
        platform: Platform.OS,
      });
      
      // Try to reconnect on error
      if (this.userEmail && !this.socket.connecting) {
        console.log('🔄 Attempting reconnect after emit error...');
        this.socket.connect();
      }
      
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

