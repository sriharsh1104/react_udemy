const userService = require('./userService');
const redisService = require('./redisService');
const Call = require('../models/Call');
const SocketService = require('./socketService');

class CallingService {
  constructor() {
    this.callTimeouts = new Map(); // Track call timeouts
    this.activeCalls = new Map(); // Track active calls
    this.callRingTimeouts = new Map(); // Track ringing timeouts
  }

  /**
   * Initiate a call
   */
  async initiateCall(callerEmail, receiverEmail, groupId, type, socketId) {
    try {
      const io = SocketService.getIO();
      if (!io) {
        throw new Error('Socket.IO not initialized');
      }

      const sessionId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const callData = {
        sessionId,
        callerEmail,
        receiverEmail: receiverEmail || null,
        groupId: groupId || null,
        type, // 'audio' or 'video'
        status: 'ringing',
        direction: 'outgoing',
        createdAt: new Date(),
        callerSocketId: socketId,
      };

      // Store call session in Redis
      await redisService.set(`call:${sessionId}`, callData, 300); // 5 min TTL

      // Create call record in database
      const call = new Call({
        callerEmail,
        receiverEmail: receiverEmail || null,
        groupId: groupId || null,
        type,
        direction: 'outgoing',
        status: 'ringing',
        sessionId,
      });
      await call.save();

      // Check if receiver is online and available
      if (receiverEmail) {
        const receiverSocketId = userService.getSocketByEmail(receiverEmail);
        const isReceiverOnline = receiverSocketId !== null;
        const isReceiverBusy = await this.isUserBusy(receiverEmail);

        if (!isReceiverOnline) {
          // User is offline - mark as missed
          await this.handleCallFailed(sessionId, 'missed', 'User offline');
          return {
            success: false,
            status: 'missed',
            message: 'User is offline',
            sessionId,
          };
        }

        if (isReceiverBusy) {
          // User is busy
          await this.handleCallFailed(sessionId, 'busy', 'User busy');
          return {
            success: false,
            status: 'busy',
            message: 'User is busy',
            sessionId,
          };
        }

        // Check if user is blocked
        const isBlocked = await this.isUserBlocked(callerEmail, receiverEmail);
        if (isBlocked) {
          // Caller is blocked - still ring on caller side but receiver won't get it
          await this.handleBlockedCall(sessionId, callerEmail, receiverEmail);
        }

        // Emit call to receiver
        io.to(receiverSocketId).emit('incomingCall', {
          sessionId,
          callerEmail,
          type,
          timestamp: new Date().toISOString(),
        });

        // Set ringing timeout (30 seconds)
        const ringTimeout = setTimeout(async () => {
          await this.handleCallTimeout(sessionId);
        }, 30000);
        this.callRingTimeouts.set(sessionId, ringTimeout);

        // Track active call
        this.activeCalls.set(sessionId, {
          ...callData,
          receiverSocketId,
        });

        // Return success immediately - caller should get sessionId
        return {
          success: true,
          status: 'ringing',
          sessionId,
          message: 'Call initiated',
        };
      } else if (groupId) {
        // Group call logic
        const Group = require('../models/Group');
        const group = await Group.findById(groupId);
        if (!group) {
          throw new Error('Group not found');
        }

        // Emit to all group members
        const memberEmails = group.members || [];
        const onlineMembers = [];

        for (const memberEmail of memberEmails) {
          if (memberEmail === callerEmail) continue; // Skip caller

          const memberSocketId = userService.getSocketByEmail(memberEmail);
          if (memberSocketId) {
            const isBusy = await this.isUserBusy(memberEmail);
            if (!isBusy) {
              io.to(memberSocketId).emit('incomingGroupCall', {
                sessionId,
                groupId,
                callerEmail,
                type,
                timestamp: new Date().toISOString(),
              });
              onlineMembers.push(memberEmail);
            }
          }
        }

        if (onlineMembers.length === 0) {
          await this.handleCallFailed(sessionId, 'missed', 'No online members');
          return {
            success: false,
            status: 'missed',
            message: 'No online members',
            sessionId,
          };
        }

        // Set timeout for group call
        const ringTimeout = setTimeout(async () => {
          await this.handleCallTimeout(sessionId);
        }, 30000);
        this.callRingTimeouts.set(sessionId, ringTimeout);

        // Return success for group call
        return {
          success: true,
          status: 'ringing',
          sessionId,
          message: 'Call initiated',
        };
      }

      // Fallback return (should not reach here)
      return {
        success: true,
        status: 'ringing',
        sessionId,
        message: 'Call initiated',
      };
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  /**
   * Accept a call
   */
  async acceptCall(sessionId, receiverEmail, socketId) {
    try {
      const io = SocketService.getIO();
      const callData = await redisService.get(`call:${sessionId}`);
      
      if (!callData) {
        throw new Error('Call session not found');
      }

      // Clear ringing timeout
      const ringTimeout = this.callRingTimeouts.get(sessionId);
      if (ringTimeout) {
        clearTimeout(ringTimeout);
        this.callRingTimeouts.delete(sessionId);
      }

      // Update call status
      callData.status = 'connecting';
      callData.receiverSocketId = socketId;
      callData.acceptedAt = new Date();
      await redisService.set(`call:${sessionId}`, callData, 3600); // 1 hour TTL

      // Update database
      await Call.updateOne(
        { sessionId },
        {
          status: 'connecting',
          startedAt: new Date(),
        }
      );

      // Start call duration tracking - use same timestamp for both sides
      const callStartTime = new Date();
      callData.startedAt = callStartTime;
      this.activeCalls.set(sessionId, callData);

      // Notify caller with start time for timer sync
      io.to(callData.callerSocketId).emit('callAccepted', {
        sessionId,
        receiverEmail,
        startedAt: callStartTime.toISOString(),
        timestamp: callStartTime.toISOString(),
      });

      // Notify receiver with start time for timer sync
      io.to(socketId).emit('callActive', {
        sessionId,
        startedAt: callStartTime.toISOString(),
        timestamp: callStartTime.toISOString(),
      });

      return {
        success: true,
        sessionId,
        status: 'connecting',
      };
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }

  /**
   * Reject/Decline a call
   */
  async declineCall(sessionId, receiverEmail) {
    try {
      const io = SocketService.getIO();
      const callData = await redisService.get(`call:${sessionId}`);
      
      if (!callData) {
        return { success: false, message: 'Call session not found' };
      }

      // Clear ringing timeout
      const ringTimeout = this.callRingTimeouts.get(sessionId);
      if (ringTimeout) {
        clearTimeout(ringTimeout);
        this.callRingTimeouts.delete(sessionId);
      }

      // Update status to 'busy' (as per user requirement: receiver decline = busy for caller)
      await this.updateCallStatus(sessionId, 'busy');

      // Notify caller with 'busy' status
      io.to(callData.callerSocketId).emit('callDeclined', {
        sessionId,
        receiverEmail,
        status: 'busy',
        message: 'User is busy',
        timestamp: new Date().toISOString(),
      });
      
      // Also emit callFailed with busy status for consistency
      io.to(callData.callerSocketId).emit('callFailed', {
        sessionId,
        status: 'busy',
        message: 'User is busy',
        reason: 'User is busy',
      });

      // Cleanup
      await redisService.delete(`call:${sessionId}`);
      this.activeCalls.delete(sessionId);

      return { success: true, status: 'busy' };
    } catch (error) {
      console.error('Error declining call:', error);
      throw error;
    }
  }

  /**
   * Handle call timeout (no answer)
   */
  async handleCallTimeout(sessionId) {
    try {
      const callData = await redisService.get(`call:${sessionId}`);
      if (!callData) return;

      const io = SocketService.getIO();
      
      // Update status to missed
      await this.updateCallStatus(sessionId, 'missed');

      // Notify caller
      io.to(callData.callerSocketId).emit('callMissed', {
        sessionId,
        message: 'No answer',
        timestamp: new Date().toISOString(),
      });

      // Cleanup
      await redisService.delete(`call:${sessionId}`);
      this.activeCalls.delete(sessionId);
      this.callRingTimeouts.delete(sessionId);
    } catch (error) {
      console.error('Error handling call timeout:', error);
    }
  }

  /**
   * Handle call failed
   */
  async handleCallFailed(sessionId, status, reason) {
    try {
      const io = SocketService.getIO();
      const callData = await redisService.get(`call:${sessionId}`);
      
      if (callData) {
        io.to(callData.callerSocketId).emit('callFailed', {
          sessionId,
          status,
          reason,
          timestamp: new Date().toISOString(),
        });
      }

      await this.updateCallStatus(sessionId, status);
      await redisService.delete(`call:${sessionId}`);
      this.activeCalls.delete(sessionId);
      
      const ringTimeout = this.callRingTimeouts.get(sessionId);
      if (ringTimeout) {
        clearTimeout(ringTimeout);
        this.callRingTimeouts.delete(sessionId);
      }
    } catch (error) {
      console.error('Error handling call failed:', error);
    }
  }

  /**
   * Handle blocked call scenario
   */
  async handleBlockedCall(sessionId, callerEmail, receiverEmail) {
    try {
      // Caller will see ringing, but receiver won't get notification
      // After timeout, mark as "Call Ended" without "missed" status
      const timeout = setTimeout(async () => {
        await this.updateCallStatus(sessionId, 'cancelled');
        const io = SocketService.getIO();
        const callData = await redisService.get(`call:${sessionId}`);
        if (callData) {
          io.to(callData.callerSocketId).emit('callEnded', {
            sessionId,
            message: 'Call ended',
            timestamp: new Date().toISOString(),
          });
        }
        await redisService.delete(`call:${sessionId}`);
        this.activeCalls.delete(sessionId);
      }, 30000);

      this.callTimeouts.set(sessionId, timeout);
    } catch (error) {
      console.error('Error handling blocked call:', error);
    }
  }

  /**
   * End a call
   */
  async endCall(sessionId, endedBy) {
    try {
      const callData = await redisService.get(`call:${sessionId}`);
      
      const io = SocketService.getIO();
      let duration = 0;
      let status = 'cancelled';

      if (callData) {
        // Calculate duration if call was started
        if (callData.startedAt) {
          duration = Math.floor((new Date() - callData.startedAt) / 1000);
          status = duration > 0 ? 'completed' : 'cancelled';
        } else {
          // Call was ended before being accepted
          status = 'cancelled';
        }

        // Update database
        await Call.updateOne(
          { sessionId },
          {
            status,
            duration,
            endedAt: new Date(),
            updatedAt: new Date(),
          }
        );

        // Notify both parties - CRITICAL: both must receive callEnded event
        // Emit both event names for compatibility
        const callEndedData = {
          sessionId,
          duration,
          endedBy,
          timestamp: new Date().toISOString(),
        };
        
        if (callData.callerSocketId) {
          io.to(callData.callerSocketId).emit('callEnded', callEndedData);
          io.to(callData.callerSocketId).emit('CALL_ENDED', callEndedData);
          console.log('📞 Backend: Emitted callEnded to caller:', callData.callerSocketId);
        }

        // Get receiver socket ID (might not be in callData if call ended during ringing)
        let receiverSocketId = callData.receiverSocketId;
        if (!receiverSocketId && callData.receiverEmail) {
          receiverSocketId = userService.getSocketByEmail(callData.receiverEmail);
        }

        if (receiverSocketId) {
          const receiverCallEndedData = {
            ...callEndedData,
            status: 'cancelled',
          };
          io.to(receiverSocketId).emit('callEnded', receiverCallEndedData);
          io.to(receiverSocketId).emit('CALL_ENDED', receiverCallEndedData);
          console.log('📞 Backend: Emitted callEnded to receiver:', receiverSocketId);
        } else {
          console.warn('⚠️ Backend: Receiver socket ID not found for callEnded event');
        }

        // Cleanup Redis
        await redisService.delete(`call:${sessionId}`);
      } else {
        // Call data not in Redis, but try to update database anyway
        await Call.updateOne(
          { sessionId },
          {
            status: 'cancelled',
            endedAt: new Date(),
            updatedAt: new Date(),
          }
        );
      }

      // Always cleanup from activeCalls (even if Redis data is missing)
      this.activeCalls.delete(sessionId);
      
      // Clear any timeouts
      const ringTimeout = this.callRingTimeouts.get(sessionId);
      if (ringTimeout) {
        clearTimeout(ringTimeout);
        this.callRingTimeouts.delete(sessionId);
      }

      // Also clear any call timeouts
      const callTimeout = this.callTimeouts.get(sessionId);
      if (callTimeout) {
        clearTimeout(callTimeout);
        this.callTimeouts.delete(sessionId);
      }

      return { success: true, duration, status };
    } catch (error) {
      console.error('Error ending call:', error);
      // Even if there's an error, try to cleanup
      this.activeCalls.delete(sessionId);
      this.callRingTimeouts.delete(sessionId);
      this.callTimeouts.delete(sessionId);
      throw error;
    }
  }

  /**
   * Update call status
   */
  async updateCallStatus(sessionId, status, additionalData = {}) {
    try {
      await Call.updateOne(
        { sessionId },
        {
          status,
          ...additionalData,
          updatedAt: new Date(),
        }
      );
    } catch (error) {
      console.error('Error updating call status:', error);
    }
  }

  /**
   * Check if user is busy (in another call)
   */
  async isUserBusy(email) {
    try {
      // Check Redis for active calls
      const activeCallKeys = await this.getActiveCallKeysForUser(email);
      return activeCallKeys.length > 0;
    } catch (error) {
      console.error('Error checking if user is busy:', error);
      return false;
    }
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(callerEmail, receiverEmail) {
    try {
      const Contact = require('../models/Contact');
      const contact = await Contact.findOne({
        userEmail: receiverEmail,
        contactEmail: callerEmail,
      });
      // Assuming there's a blocked field - adjust based on your schema
      return contact?.blocked || false;
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return false;
    }
  }

  /**
   * Get active call keys for a user
   * Checks both in-memory activeCalls and Redis
   * Only returns calls that are actually active (not ended/completed)
   */
  async getActiveCallKeysForUser(email) {
    const activeKeys = [];
    const staleKeys = [];
    
    // Check in-memory active calls
    for (const [sessionId, callData] of this.activeCalls.entries()) {
      if (callData && (callData.callerEmail === email || callData.receiverEmail === email)) {
        // Verify call is still active in Redis
        try {
          const redisData = await redisService.get(`call:${sessionId}`);
          if (redisData && 
              redisData.status !== 'completed' && 
              redisData.status !== 'cancelled' && 
              redisData.status !== 'ended' &&
              redisData.status !== 'declined' &&
              redisData.status !== 'missed') {
            activeKeys.push(sessionId);
          } else {
            // Call is no longer active, mark for cleanup
            staleKeys.push(sessionId);
          }
        } catch (error) {
          // If Redis check fails, assume call is still active (conservative approach)
          activeKeys.push(sessionId);
        }
      }
    }
    
    // Cleanup stale entries
    staleKeys.forEach(sessionId => {
      this.activeCalls.delete(sessionId);
    });
    
    return activeKeys;
  }

  /**
   * Handle WebRTC signaling (ICE candidates, offers, answers)
   */
  async handleSignaling(sessionId, fromEmail, signalData) {
    try {
      const io = SocketService.getIO();
      const callData = await redisService.get(`call:${sessionId}`);
      
      if (!callData) {
        throw new Error('Call session not found');
      }

      // Determine target
      const targetEmail = callData.callerEmail === fromEmail 
        ? callData.receiverEmail 
        : callData.callerEmail;
      
      const targetSocketId = userService.getSocketByEmail(targetEmail);
      if (targetSocketId) {
        io.to(targetSocketId).emit('callSignal', {
          sessionId,
          signal: signalData,
          from: fromEmail,
        });
      }
    } catch (error) {
      console.error('Error handling signaling:', error);
      throw error;
    }
  }

  /**
   * Get call session data
   */
  async getCallSession(sessionId) {
    try {
      const callData = await redisService.get(`call:${sessionId}`);
      return callData;
    } catch (error) {
      console.error('Error getting call session:', error);
      return null;
    }
  }
}

module.exports = new CallingService();

