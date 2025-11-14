import socketService from './socketService';
import { SOCKET_EVENTS } from '../constants';
import callService from './callService';

class WebRTCService {
  constructor() {
    this.peerConnections = new Map();
    this.localStream = null;
    this.currentCall = null;
    this.callListeners = new Map();
  }

  /**
   * Initialize call - create peer connection and get user media
   */
  async initiateCall(receiverEmail, groupId, type = 'audio') {
    try {
      // Get user media
      const constraints = {
        audio: true,
        video: type === 'video',
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Create call record
      const callData = {
        receiverEmail: receiverEmail || null,
        groupId: groupId || null,
        type,
      };

      // Emit initiate call event
      socketService.emit(SOCKET_EVENTS.INITIATE_CALL, callData);

      return {
        success: true,
        localStream: this.localStream,
      };
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
      this.currentCall = {
        sessionId,
        callerEmail,
        type,
        status: 'ringing',
      };

      // Notify listeners
      this.notifyListeners('incomingCall', {
        sessionId,
        callerEmail,
        type,
      });

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
      if (!this.currentCall || this.currentCall.sessionId !== sessionId) {
        throw new Error('Call not found');
      }

      // Get user media
      const constraints = {
        audio: true,
        video: this.currentCall.type === 'video',
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create peer connection
      const peerConnection = this.createPeerConnection(sessionId);
      this.peerConnections.set(sessionId, peerConnection);

      // Add local stream tracks
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });

      // Create and send answer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Emit accept call
      socketService.emit(SOCKET_EVENTS.ACCEPT_CALL, { sessionId });

      // Send answer via signaling
      socketService.emit(SOCKET_EVENTS.CALL_SIGNAL, {
        sessionId,
        signal: {
          type: 'answer',
          sdp: offer,
        },
      });

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
   * End call
   */
  async endCall(sessionId) {
    try {
      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Close peer connection
      const peerConnection = this.peerConnections.get(sessionId);
      if (peerConnection) {
        peerConnection.close();
        this.peerConnections.delete(sessionId);
      }

      // Emit end call
      socketService.emit(SOCKET_EVENTS.END_CALL, { sessionId });

      this.currentCall = null;

      return { success: true };
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  /**
   * Create peer connection
   */
  createPeerConnection(sessionId) {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);

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
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socketService.emit(SOCKET_EVENTS.CALL_SIGNAL, {
          sessionId,
          signal: {
            type: 'answer',
            sdp: answer,
          },
        });
      } else if (signal.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.type === 'ice-candidate') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
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
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in call listener:', error);
        }
      });
    }
  }

  /**
   * Setup socket listeners
   */
  setupSocketListeners() {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on(SOCKET_EVENTS.INCOMING_CALL, async (data) => {
      await this.handleIncomingCall(data.sessionId, data.callerEmail, data.type);
    });

    socket.on(SOCKET_EVENTS.CALL_ACCEPTED, (data) => {
      this.notifyListeners('callAccepted', data);
    });

    socket.on(SOCKET_EVENTS.CALL_DECLINED, (data) => {
      this.notifyListeners('callDeclined', data);
      this.currentCall = null;
    });

    socket.on(SOCKET_EVENTS.CALL_ENDED, (data) => {
      this.notifyListeners('callEnded', data);
      this.endCall(data.sessionId);
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

// Setup socket listeners when service is created
webrtcService.setupSocketListeners();

export default webrtcService;

