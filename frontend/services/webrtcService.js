import socketService from './socketService';
import { SOCKET_EVENTS } from '../constants';
import callService from './callService';
import { Platform, Alert } from 'react-native';

class WebRTCService {
  constructor() {
    this.peerConnections = new Map();
    this.localStream = null;
    this.currentCall = null;
    this.callListeners = new Map();
  }

  /**
   * Check permission status (web only)
   */
  async checkPermissionStatus(permissionName) {
    if (Platform.OS === 'web' && navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: permissionName });
        return result.state; // 'granted', 'denied', or 'prompt'
      } catch (error) {
        // Permissions API might not support this permission name
        return 'prompt';
      }
    }
    return 'prompt';
  }

  /**
   * Request permissions for microphone/camera
   */
  async requestPermissions(type = 'audio') {
    if (Platform.OS === 'web') {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        throw new Error('WebRTC is only available in browser environments. This may be a server-side rendering issue.');
      }
      
      // Check HTTPS requirement first (common issue)
      if (typeof location !== 'undefined' && location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('WebRTC requires HTTPS connection. Please use HTTPS or localhost.');
      }
      
      // Check for mediaDevices support
      if (!navigator.mediaDevices) {
        // Provide helpful error message based on what's missing
        if (!navigator.getUserMedia && !navigator.webkitGetUserMedia && !navigator.mozGetUserMedia) {
          throw new Error('Media devices not supported in this browser. Please use a modern browser like Chrome, Firefox, Safari, or Edge.');
        } else {
          throw new Error('Media devices API not available. Please use HTTPS or ensure your browser supports WebRTC.');
        }
      }
      
      // Check for getUserMedia method
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not available. Please use a modern browser with WebRTC support.');
      }
      
      return true;
    } else {
      // For React Native, we would use expo-av or react-native-permissions
      // For now, we'll handle it in the getUserMedia call
      return true;
    }
  }

  /**
   * Get user media with proper error handling and retry mechanism
   * Supports both web and mobile (with proper native modules)
   */
  async getUserMedia(constraints, retryCount = 0) {
    try {
      if (Platform.OS === 'web') {
        // Web platform - use browser WebRTC API
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Media devices not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        }
        
        // Try to get user media
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        return stream;
      } else {
        // Mobile platform (iOS/Android)
        // For React Native, we need react-native-webrtc or expo-av
        // Check if react-native-webrtc is available
        try {
          // Try to use react-native-webrtc if available
          const { mediaDevices } = require('react-native-webrtc');
          if (mediaDevices && mediaDevices.getUserMedia) {
            return await mediaDevices.getUserMedia(constraints);
          }
        } catch (rnError) {
          // react-native-webrtc not available
          console.warn('react-native-webrtc not found, WebRTC calls may not work on mobile');
        }
        
        // Fallback: Show helpful error
        throw new Error('WebRTC calls require react-native-webrtc package for mobile. Please install it: npm install react-native-webrtc');
      }
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        // Provide detailed instructions
        const deviceType = constraints.video ? 'camera' : 'microphone';
        const instructions = Platform.OS === 'web' 
          ? `\n\nTo enable ${deviceType} access:\n1. Click the lock icon (🔒) in your browser's address bar\n2. Find "${deviceType}" in the permissions list\n3. Change it to "Allow"\n4. Refresh the page and try again.`
          : '';
        throw new Error(`Microphone/Camera permission denied.${instructions}`);
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No microphone/camera found. Please connect a microphone/camera and try again.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('Microphone/Camera is already in use by another application. Please close other apps using the microphone/camera.');
      } else if (error.name === 'OverconstrainedError') {
        throw new Error('Requested media constraints cannot be satisfied. Please check your device settings.');
      } else {
        throw new Error(error.message || 'Failed to access microphone/camera');
      }
    }
  }

  /**
   * Initialize call - create peer connection and get user media
   */
  async initiateCall(receiverEmail, groupId, type = 'audio') {
    try {
      // Request permissions first
      await this.requestPermissions(type);

      // Get user media
      const constraints = {
        audio: true,
        video: type === 'video',
      };

      this.localStream = await this.getUserMedia(constraints);
      
      // Create call record
      const callData = {
        receiverEmail: receiverEmail || null,
        groupId: groupId || null,
        type,
      };

      // Emit initiate call event
      socketService.emit(SOCKET_EVENTS.INITIATE_CALL, callData);
      
      // Wait for sessionId before creating peer connection
      // Peer connection will be created after we get sessionId from backend

      // Wait for call initiated response to get sessionId
      return new Promise((resolve, reject) => {
        const socket = socketService.getSocket();
        if (!socket || !socket.connected) {
          reject(new Error('Socket not connected. Please check your connection.'));
          return;
        }

        let timeout;
        let resolved = false;

        const cleanup = () => {
          if (timeout) clearTimeout(timeout);
          // Remove all possible event listeners
          socket.off(SOCKET_EVENTS.CALL_INITIATED, onCallInitiated);
          socket.off('callInitiated', onCallInitiated);
          socket.off(SOCKET_EVENTS.CALL_FAILED, onCallFailed);
          socket.off('callFailed', onCallFailed);
        };

        const onCallInitiated = async (data) => {
          if (resolved) return;
          resolved = true;
          cleanup();
          
          const sessionId = data.sessionId;
          
          // Create peer connection for caller
          const peerConnection = this.createPeerConnection(sessionId);
          this.peerConnections.set(sessionId, peerConnection);
          
          // Add local stream tracks to peer connection
          this.localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, this.localStream);
          });
          
          // Create and set local offer
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          // Send offer via signaling
          socketService.emit(SOCKET_EVENTS.CALL_SIGNAL, {
            sessionId,
            signal: {
              type: 'offer',
              sdp: offer,
            },
          });
          
          resolve({
            success: true,
            sessionId,
            localStream: this.localStream,
            status: data.status,
          });
        };

        const onCallFailed = (data) => {
          if (resolved) return;
          resolved = true;
          cleanup();
          
          reject(new Error(data.message || data.reason || 'Call failed'));
        };

        // Set up timeout
        timeout = setTimeout(() => {
          if (resolved) return;
          resolved = true;
          cleanup();
          reject(new Error('Call initiation timeout. The server did not respond. Please try again.'));
        }, 15000); // 15 seconds timeout

        // Listen to both event name formats (backend uses 'callInitiated', frontend constant is 'CALL_INITIATED')
        socket.on(SOCKET_EVENTS.CALL_INITIATED, onCallInitiated);
        socket.on('callInitiated', onCallInitiated); // Backend emits this
        socket.on(SOCKET_EVENTS.CALL_FAILED, onCallFailed);
        socket.on('callFailed', onCallFailed); // Backend emits this
      });
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  /**
   * Handle incoming call
   */
  async handleIncomingCall(sessionId, callerEmail, type) {
    try {
      console.log('📞 webrtcService.handleIncomingCall called:', { sessionId, callerEmail, type });
      this.currentCall = {
        sessionId,
        callerEmail,
        type,
        status: 'ringing',
      };

      // Notify listeners
      const callData = {
        sessionId,
        callerEmail,
        type,
      };
      console.log('📞 Notifying listeners with data:', callData);
      this.notifyListeners('incomingCall', callData);

      return this.currentCall;
    } catch (error) {
      console.error('Error handling incoming call:', error);
      throw error;
    }
  }

  /**
   * Accept incoming call
   */
  async acceptCall(sessionId) {
    try {
      console.log('📞 webrtcService: acceptCall called with sessionId:', sessionId);
      console.log('📞 webrtcService: currentCall:', this.currentCall);
      
      if (!this.currentCall || this.currentCall.sessionId !== sessionId) {
        console.error('❌ webrtcService: Call not found or sessionId mismatch');
        throw new Error('Call not found');
      }

      // Request permissions first
      await this.requestPermissions(this.currentCall.type);

      // Get user media
      const constraints = {
        audio: true,
        video: this.currentCall.type === 'video',
      };

      this.localStream = await this.getUserMedia(constraints);

      // Create peer connection
      const peerConnection = this.createPeerConnection(sessionId);
      this.peerConnections.set(sessionId, peerConnection);

      // Add local stream tracks
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });

      // Emit accept call first
      console.log('📞 webrtcService: Emitting ACCEPT_CALL with sessionId:', sessionId);
      const emitSuccess = socketService.emit(SOCKET_EVENTS.ACCEPT_CALL, { sessionId });
      if (!emitSuccess) {
        console.error('❌ webrtcService: Failed to emit ACCEPT_CALL event');
        throw new Error('Failed to send accept call request');
      }
      console.log('✅ webrtcService: ACCEPT_CALL event emitted successfully');
      
      // Wait for offer from caller, then create answer
      // The answer will be sent in handleSignaling when offer is received

      this.currentCall.status = 'connecting';

      return {
        success: true,
        localStream: this.localStream,
        peerConnection,
      };
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }

  /**
   * Decline incoming call
   */
  async declineCall(sessionId) {
    try {
      socketService.emit(SOCKET_EVENTS.DECLINE_CALL, { sessionId });
      this.currentCall = null;
      return { success: true };
    } catch (error) {
      console.error('Error declining call:', error);
      throw error;
    }
  }

  /**
   * Cleanup call resources (called when callEnded event is received)
   * This is separate from endCall to avoid loops
   */
  cleanupCallResources(sessionId) {
    try {
      console.log('🧹 webrtcService: Cleaning up call resources for session:', sessionId);
      
      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        this.localStream = null;
      }

      // Close peer connection for this session
      if (sessionId) {
        const peerConnection = this.peerConnections.get(sessionId);
        if (peerConnection) {
          try {
            peerConnection.close();
          } catch (pcError) {
            console.warn('Error closing peer connection:', pcError);
          }
          this.peerConnections.delete(sessionId);
        }
      } else {
        // Close all peer connections if sessionId not provided
        this.peerConnections.forEach((pc, sid) => {
          try {
            pc.close();
          } catch (pcError) {
            console.warn('Error closing peer connection:', pcError);
          }
        });
        this.peerConnections.clear();
      }

      // Clear current call
      this.currentCall = null;
      
      console.log('✅ webrtcService: Call resources cleaned up');
    } catch (error) {
      console.error('Error cleaning up call resources:', error);
    }
  }

  /**
   * End call - emits to backend, backend will send callEnded event to both parties
   */
  async endCall(sessionId) {
    try {
      console.log('📞 webrtcService: endCall called with sessionId:', sessionId);
      
      // Emit end call to backend first (so it can cleanup and notify both parties)
      if (sessionId) {
        const emitSuccess = socketService.emit(SOCKET_EVENTS.END_CALL, { sessionId });
        if (!emitSuccess) {
          console.error('❌ webrtcService: Failed to emit END_CALL event');
          throw new Error('Failed to send end call request');
        }
        console.log('✅ webrtcService: END_CALL event emitted to backend');
      }

      // Don't cleanup immediately - wait for backend's callEnded event
      // This ensures both sides are notified properly
      // The cleanupCallResources will be called when callEnded event is received

      return { success: true };
    } catch (error) {
      console.error('Error ending call:', error);
      // On error, still cleanup locally
      this.cleanupCallResources(sessionId);
      throw error;
    }
  }

  /**
   * Create peer connection
   * Supports both web and mobile platforms
   */
  createPeerConnection(sessionId) {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    let RTCPeerConnectionClass;
    
    if (Platform.OS === 'web') {
      // Web platform - use browser WebRTC API
      RTCPeerConnectionClass = RTCPeerConnection;
    } else {
      // Mobile platform - try to use react-native-webrtc
      try {
        const { RTCPeerConnection: RTC } = require('react-native-webrtc');
        RTCPeerConnectionClass = RTC;
      } catch (error) {
        throw new Error('RTCPeerConnection not available. Please install react-native-webrtc for mobile support.');
      }
    }

    const peerConnection = new RTCPeerConnectionClass(configuration);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emit(SOCKET_EVENTS.CALL_SIGNAL, {
          sessionId,
          signal: {
            type: 'ice-candidate',
            candidate: event.candidate,
          },
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      this.notifyListeners('remoteStream', {
        sessionId,
        stream: remoteStream,
      });
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      this.notifyListeners('connectionStateChange', {
        sessionId,
        state,
      });

      if (state === 'failed' || state === 'disconnected') {
        this.handleCallFailed(sessionId, 'Connection failed');
      }
    };

    return peerConnection;
  }

  /**
   * Handle WebRTC signaling
   */
  async handleSignaling(sessionId, signal) {
    try {
      const peerConnection = this.peerConnections.get(sessionId);
      if (!peerConnection) {
        console.warn('Peer connection not found for session:', sessionId);
        return;
      }

      if (signal.type === 'offer') {
        // Receiver side: received offer from caller
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Send answer back to caller
        socketService.emit(SOCKET_EVENTS.CALL_SIGNAL, {
          sessionId,
          signal: {
            type: 'answer',
            sdp: answer,
          },
        });
      } else if (signal.type === 'answer') {
        // Caller side: received answer from receiver
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.type === 'ice-candidate') {
        // Add ICE candidate for both sides
        if (signal.candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      }
    } catch (error) {
      console.error('Error handling signaling:', error);
      throw error;
    }
  }

  /**
   * Handle call failed
   */
  handleCallFailed(sessionId, reason) {
    this.notifyListeners('callFailed', {
      sessionId,
      reason,
    });
    this.endCall(sessionId);
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.callListeners.has(event)) {
      this.callListeners.set(event, []);
    }
    this.callListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    const listeners = this.callListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners
   */
  notifyListeners(event, data) {
    const listeners = this.callListeners.get(event);
    console.log(`📢 notifyListeners: event="${event}", listeners count=${listeners?.size || 0}`, data);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in call listener:', error);
        }
      });
    } else {
      console.warn(`⚠️ No listeners registered for event: ${event}`);
    }
  }

  /**
   * Setup socket listeners
   */
  setupSocketListeners() {
    const socket = socketService.getSocket();
    if (!socket) {
      // If socket not available, try to setup when it connects
      // This will be called again when socket connects
      return;
    }

    // Remove existing listeners to avoid duplicates
    socket.off(SOCKET_EVENTS.INCOMING_CALL);
    socket.off(SOCKET_EVENTS.CALL_ACCEPTED);
    socket.off('callAccepted'); // Also remove lowercase version
    socket.off(SOCKET_EVENTS.CALL_DECLINED);
    socket.off(SOCKET_EVENTS.CALL_ENDED);
    socket.off(SOCKET_EVENTS.CALL_MISSED);
    socket.off(SOCKET_EVENTS.CALL_FAILED);
    socket.off(SOCKET_EVENTS.CALL_SIGNAL);
    socket.off(SOCKET_EVENTS.CALL_ERROR);

    socket.on(SOCKET_EVENTS.INCOMING_CALL, async (data) => {
      console.log('📞 Incoming call received:', data);
      await this.handleIncomingCall(data.sessionId, data.callerEmail, data.type);
    });

    socket.on(SOCKET_EVENTS.CALL_ACCEPTED, (data) => {
      console.log('📞 webrtcService: CALL_ACCEPTED event received:', data);
      this.notifyListeners('callAccepted', data);
    });

    // Also listen for lowercase event name (backend emits 'callAccepted')
    socket.on('callAccepted', (data) => {
      console.log('📞 webrtcService: callAccepted event received (lowercase):', data);
      this.notifyListeners('callAccepted', data);
    });

    socket.on(SOCKET_EVENTS.CALL_ACTIVE, (data) => {
      console.log('📞 webrtcService: CALL_ACTIVE event received:', data);
      this.notifyListeners('callActive', data);
    });

    socket.on(SOCKET_EVENTS.CALL_DECLINED, (data) => {
      this.notifyListeners('callDeclined', data);
      this.currentCall = null;
    });

    socket.on(SOCKET_EVENTS.CALL_ENDED, (data) => {
      console.log('📞 webrtcService: CALL_ENDED event received:', data);
      // Notify listeners first
      this.notifyListeners('callEnded', data);
      // Then cleanup local resources (but don't emit endCall again to avoid loop)
      this.cleanupCallResources(data.sessionId);
    });

    // Also listen for lowercase event name (backend emits both)
    socket.on('callEnded', (data) => {
      console.log('📞 webrtcService: callEnded event received (lowercase):', data);
      // Notify listeners first
      this.notifyListeners('callEnded', data);
      // Then cleanup local resources (but don't emit endCall again to avoid loop)
      this.cleanupCallResources(data.sessionId);
    });

    socket.on(SOCKET_EVENTS.CALL_MISSED, (data) => {
      this.notifyListeners('callMissed', data);
      this.currentCall = null;
    });

    socket.on(SOCKET_EVENTS.CALL_FAILED, (data) => {
      this.handleCallFailed(data.sessionId, data.reason || 'Call failed');
    });

    socket.on(SOCKET_EVENTS.CALL_SIGNAL, async (data) => {
      await this.handleSignaling(data.sessionId, data.signal);
    });

    socket.on(SOCKET_EVENTS.CALL_ERROR, (data) => {
      this.notifyListeners('callError', data);
    });
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Stop all streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((pc, sessionId) => {
      pc.close();
    });
    this.peerConnections.clear();

    this.currentCall = null;
    this.callListeners.clear();
  }
}

const webrtcService = new WebRTCService();

// Setup socket listeners when service is created (if socket is available)
// Also setup when socket connects
webrtcService.setupSocketListeners();

// Also setup listeners when socket becomes available
// This handles the case where socket connects after service creation
let setupAttempts = 0;
const MAX_SETUP_ATTEMPTS = 10;
const setupListenersWhenSocketReady = () => {
  if (setupAttempts >= MAX_SETUP_ATTEMPTS) {
    console.warn('⚠️ Max attempts reached for setting up call listeners');
    return;
  }
  
  const socket = socketService.getSocket();
  if (socket) {
    if (socket.connected) {
      webrtcService.setupSocketListeners();
      setupAttempts = MAX_SETUP_ATTEMPTS; // Stop retrying
    } else {
      // Wait for socket to connect
      socket.once('connect', () => {
        webrtcService.setupSocketListeners();
        setupAttempts = MAX_SETUP_ATTEMPTS; // Stop retrying
      });
      setupAttempts++;
    }
  } else {
    // Socket not created yet, try again after a short delay
    setupAttempts++;
    if (setupAttempts < MAX_SETUP_ATTEMPTS) {
      setTimeout(setupListenersWhenSocketReady, 1000);
    }
  }
};

// Try to setup listeners when socket is ready (only if socket not already connected)
const socket = socketService.getSocket();
if (!socket || !socket.connected) {
  setupListenersWhenSocketReady();
}

export default webrtcService;

