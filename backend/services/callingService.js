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
      
      // Get receiver socket ID early if receiverEmail is provided
      let receiverSocketId = null;
      if (receiverEmail) {
        receiverSocketId = userService.getSocketByEmail(receiverEmail);
      }
      
      const callData = {
        sessionId,
        callerEmail,
        receiverEmail: receiverEmail || null,
        groupId: groupId || null,
        type, // 'audio' or 'video'
        status: 'ringing',
        direction: 'outgoing',
        createdAt: new Date().toISOString(), // Use ISO string for Redis compatibility
        callerSocketId: socketId,
        receiverSocketId: receiverSocketId, // Store receiver socket ID immediately
      };

      // Store call session in Redis
      const redisStored = await redisService.set(`call:${sessionId}`, callData, 300); // 5 min TTL
      if (!redisStored) {
        console.warn('⚠️ Backend: Failed to store call session in Redis');
        console.warn('⚠️ Backend: Redis connected:', redisService.isConnected);
        // Continue anyway - database will have the record
      } else {
        console.log('✅ Backend: Call session stored in Redis:', sessionId);
      }
      
      // Verify it was stored (for debugging)
      const verifyStored = await redisService.get(`call:${sessionId}`);
      if (!verifyStored) {
        console.warn('⚠️ Backend: Warning - Call session not found in Redis immediately after storing');
      } else {
        console.log('✅ Backend: Verified call session in Redis');
      }

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
        // receiverSocketId already retrieved above
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
      console.log('📞 Backend: acceptCall called with sessionId:', sessionId);
      
      // Try to get from Redis first
      let callData = await redisService.get(`call:${sessionId}`);
      
      // If not in Redis, try to get from database as fallback
      if (!callData) {
        console.warn('⚠️ Backend: Call session not found in Redis, checking database...');
        const Call = require('../models/Call');
        const dbCall = await Call.findOne({ sessionId, status: { $in: ['ringing', 'connecting'] } });
        
        if (dbCall) {
          // Reconstruct callData from database
          callData = {
            sessionId: dbCall.sessionId,
            callerEmail: dbCall.callerEmail,
            receiverEmail: dbCall.receiverEmail,
            groupId: dbCall.groupId,
            type: dbCall.type,
            status: dbCall.status,
            direction: dbCall.direction,
            createdAt: dbCall.createdAt,
            callerSocketId: null, // Will need to get from userService
          };
          
          // Get caller socket ID
          const userService = require('./userService');
          callData.callerSocketId = userService.getSocketByEmail(dbCall.callerEmail);
          
          // Store back in Redis
          await redisService.set(`call:${sessionId}`, callData, 3600);
          console.log('✅ Backend: Recovered call session from database');
        }
      }
      
      if (!callData) {
        console.error('❌ Backend: Call session not found in Redis or database:', sessionId);
        throw new Error('Call session not found');
      }
      
      console.log('✅ Backend: Call session found:', {
        sessionId: callData.sessionId,
        callerEmail: callData.callerEmail,
        receiverEmail: callData.receiverEmail,
        status: callData.status,
      });

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
      console.log('📞 Backend: declineCall called with sessionId:', sessionId, 'receiverEmail:', receiverEmail);
      
      const io = SocketService.getIO();
      
      // Try to get from Redis first
      let callData = await redisService.get(`call:${sessionId}`);
      
      // If not in Redis, try to get from database as fallback
      if (!callData) {
        console.warn('⚠️ Backend: Call session not found in Redis for decline, checking database...');
        const dbCall = await Call.findOne({ sessionId, status: { $in: ['ringing', 'connecting'] } });
        
        if (dbCall) {
          // Reconstruct callData from database
          callData = {
            sessionId: dbCall.sessionId,
            callerEmail: dbCall.callerEmail,
            receiverEmail: dbCall.receiverEmail,
            groupId: dbCall.groupId,
            type: dbCall.type,
            status: dbCall.status,
            direction: dbCall.direction,
            createdAt: dbCall.createdAt,
            callerSocketId: null,
            receiverSocketId: null,
          };
          
          // Get socket IDs
          callData.callerSocketId = userService.getSocketByEmail(dbCall.callerEmail);
          if (dbCall.receiverEmail) {
            callData.receiverSocketId = userService.getSocketByEmail(dbCall.receiverEmail);
          }
          
          // Store back in Redis
          await redisService.set(`call:${sessionId}`, callData, 3600);
          console.log('✅ Backend: Recovered call session from database for decline');
        }
      }
      
      if (!callData) {
        console.error('❌ Backend: Call session not found in Redis or database for decline:', sessionId);
        return { success: false, message: 'Call session not found' };
      }

      // Clear ringing timeout
      const ringTimeout = this.callRingTimeouts.get(sessionId);
      if (ringTimeout) {
        clearTimeout(ringTimeout);
        this.callRingTimeouts.delete(sessionId);
      }

      // Update status to 'declined'
      await this.updateCallStatus(sessionId, 'declined');

      // Notify caller that call was declined - emit callEnded to end call on caller side
      const callEndedData = {
        sessionId,
        duration: 0,
        endedBy: receiverEmail,
        timestamp: new Date().toISOString(),
      };
      
      // Notify caller
      if (callData.callerSocketId) {
        io.to(callData.callerSocketId).emit('callEnded', callEndedData);
        io.to(callData.callerSocketId).emit('CALL_ENDED', callEndedData);
        console.log('📞 Backend: Emitted callEnded to caller after decline:', callData.callerSocketId);
      } else {
        console.warn('⚠️ Backend: Caller socket ID not found for decline');
      }
      
      // IMPORTANT: Also notify receiver to close incoming call screen
      let receiverSocketId = callData.receiverSocketId;
      if (!receiverSocketId && callData.receiverEmail) {
        receiverSocketId = userService.getSocketByEmail(callData.receiverEmail);
      }
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('callEnded', callEndedData);
        io.to(receiverSocketId).emit('CALL_ENDED', callEndedData);
        console.log('📞 Backend: Emitted callEnded to receiver after decline:', receiverSocketId);
      } else {
        console.warn('⚠️ Backend: Receiver socket ID not found for decline, receiverEmail:', callData.receiverEmail);
      }
      
      // Also emit callDeclined for backward compatibility
      if (callData.callerSocketId) {
        io.to(callData.callerSocketId).emit('callDeclined', {
        sessionId,
          receiverEmail,
          status: 'declined',
          message: 'Call declined',
          timestamp: new Date().toISOString(),
        });
      }

      // Cleanup
      await redisService.delete(`call:${sessionId}`);
      this.activeCalls.delete(sessionId);

      return { success: true, status: 'declined' };
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
      console.log('📞 Backend: endCall called with sessionId:', sessionId, 'endedBy:', endedBy);
      
      // Try to get from Redis first
      let callData = await redisService.get(`call:${sessionId}`);
      
      // If not in Redis, try to get from database as fallback
      if (!callData) {
        console.warn('⚠️ Backend: Call session not found in Redis, checking database...');
        const dbCall = await Call.findOne({ sessionId });
        
        if (dbCall) {
          // Reconstruct callData from database
          callData = {
            sessionId: dbCall.sessionId,
            callerEmail: dbCall.callerEmail,
            receiverEmail: dbCall.receiverEmail,
            groupId: dbCall.groupId,
            type: dbCall.type,
            status: dbCall.status,
            direction: dbCall.direction,
            createdAt: dbCall.createdAt,
            startedAt: dbCall.startedAt,
            callerSocketId: null,
            receiverSocketId: null,
          };
          
          // Get socket IDs
          callData.callerSocketId = userService.getSocketByEmail(dbCall.callerEmail);
          if (dbCall.receiverEmail) {
            callData.receiverSocketId = userService.getSocketByEmail(dbCall.receiverEmail);
          }
          
          console.log('✅ Backend: Recovered call session from database for endCall');
        }
      }
      
      const io = SocketService.getIO();
      let duration = 0;
      let status = 'cancelled';
      let startedAt = null;

      if (callData) {
        // Calculate duration if call was started
        startedAt = callData.startedAt;
        if (startedAt) {
          // Handle both Date objects and ISO strings
          const startTime = startedAt instanceof Date ? startedAt : new Date(startedAt);
          duration = Math.floor((new Date() - startTime) / 1000);
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

        // Prepare callEnded data
        const callEndedData = {
          sessionId,
          duration,
          endedBy,
          timestamp: new Date().toISOString(),
        };
        
        // Notify caller
        if (callData.callerSocketId) {
          io.to(callData.callerSocketId).emit('callEnded', callEndedData);
          io.to(callData.callerSocketId).emit('CALL_ENDED', callEndedData);
          console.log('📞 Backend: Emitted callEnded to caller:', callData.callerSocketId);
        } else {
          console.warn('⚠️ Backend: Caller socket ID not found');
        }

        // Handle private call (receiver) - IMPORTANT: Always notify receiver when caller cancels
        if (callData.receiverEmail && !callData.groupId) {
        let receiverSocketId = callData.receiverSocketId;
          console.log('📞 Backend: endCall - receiverEmail:', callData.receiverEmail, 'receiverSocketId from callData:', receiverSocketId);
          
          if (!receiverSocketId) {
            console.log('📞 Backend: receiverSocketId not in callData, fetching from userService...');
          receiverSocketId = userService.getSocketByEmail(callData.receiverEmail);
            console.log('📞 Backend: Fetched receiverSocketId:', receiverSocketId);
        }

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('callEnded', callEndedData);
            io.to(receiverSocketId).emit('CALL_ENDED', callEndedData);
            console.log('✅ Backend: Emitted callEnded to receiver:', receiverSocketId, 'with data:', callEndedData);
          } else {
            console.error('❌ Backend: Receiver socket ID not found for callEnded event, receiverEmail:', callData.receiverEmail);
            console.error('❌ Backend: This means receiver will not be notified of call cancellation');
            // Even if socket not found, try to emit to all sockets for that email (fallback)
            // This handles cases where socket ID might not be in callData
          }
        } else {
          console.log('📞 Backend: Not a private call or no receiverEmail, skipping receiver notification');
        }
        
        // Handle group call - notify all group members
        if (callData.groupId) {
          const Group = require('../models/Group');
          const group = await Group.findById(callData.groupId);
          
          if (group && group.members) {
            const memberEmails = group.members || [];
            let notifiedCount = 0;
            
            for (const memberEmail of memberEmails) {
              if (memberEmail === endedBy) continue; // Skip the person who ended
              
              const memberSocketId = userService.getSocketByEmail(memberEmail);
              if (memberSocketId) {
                io.to(memberSocketId).emit('callEnded', callEndedData);
                io.to(memberSocketId).emit('CALL_ENDED', callEndedData);
                notifiedCount++;
                console.log('📞 Backend: Emitted callEnded to group member:', memberEmail);
              }
            }
            
            console.log(`📞 Backend: Notified ${notifiedCount} group members about call end`);
          }
        }

        // Cleanup Redis
        await redisService.delete(`call:${sessionId}`);
      } else {
        // Call data not in Redis, but try to get from database and notify parties
        console.warn('⚠️ Backend: Call data not found in Redis for endCall, checking database...');
        
        const dbCall = await Call.findOne({ sessionId });
        if (dbCall) {
          // Update database
        await Call.updateOne(
          { sessionId },
          {
            status: 'cancelled',
            endedAt: new Date(),
            updatedAt: new Date(),
          }
        );
          
          // Prepare callEnded data
          const callEndedData = {
            sessionId,
            duration: 0,
            endedBy,
            timestamp: new Date().toISOString(),
          };
          
          // Notify caller
          const callerSocketId = userService.getSocketByEmail(dbCall.callerEmail);
          if (callerSocketId) {
            io.to(callerSocketId).emit('callEnded', callEndedData);
            io.to(callerSocketId).emit('CALL_ENDED', callEndedData);
            console.log('📞 Backend: Emitted callEnded to caller from database fallback');
          }
          
          // Notify receiver if exists (IMPORTANT: When caller cancels, receiver must be notified)
          if (dbCall.receiverEmail) {
            const receiverSocketId = userService.getSocketByEmail(dbCall.receiverEmail);
            if (receiverSocketId) {
              io.to(receiverSocketId).emit('callEnded', callEndedData);
              io.to(receiverSocketId).emit('CALL_ENDED', callEndedData);
              console.log('📞 Backend: Emitted callEnded to receiver from database fallback');
            } else {
              console.warn('⚠️ Backend: Receiver socket ID not found in database fallback, receiverEmail:', dbCall.receiverEmail);
            }
          }
        } else {
          console.error('❌ Backend: Call not found in Redis or database for endCall:', sessionId);
        }
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
      console.log('📞 Backend: handleSignaling called with sessionId:', sessionId, 'fromEmail:', fromEmail);
      
      const io = SocketService.getIO();
      
      // Try to get from Redis first
      let callData = await redisService.get(`call:${sessionId}`);
      
      // If not in Redis, try to get from database as fallback
      if (!callData) {
        console.warn('⚠️ Backend: Call session not found in Redis for signaling, checking database...');
        const dbCall = await Call.findOne({ sessionId });
        
        if (dbCall) {
          // Reconstruct callData from database
          callData = {
            sessionId: dbCall.sessionId,
            callerEmail: dbCall.callerEmail,
            receiverEmail: dbCall.receiverEmail,
            groupId: dbCall.groupId,
            type: dbCall.type,
            status: dbCall.status,
            direction: dbCall.direction,
            createdAt: dbCall.createdAt,
            startedAt: dbCall.startedAt,
            callerSocketId: null,
            receiverSocketId: null,
          };
          
          // Get socket IDs
          callData.callerSocketId = userService.getSocketByEmail(dbCall.callerEmail);
          if (dbCall.receiverEmail) {
            callData.receiverSocketId = userService.getSocketByEmail(dbCall.receiverEmail);
          }
          
          // Store back in Redis
          await redisService.set(`call:${sessionId}`, callData, 3600);
          console.log('✅ Backend: Recovered call session from database for signaling');
        }
      }
      
      if (!callData) {
        console.error('❌ Backend: Call session not found in Redis or database for signaling:', sessionId);
        throw new Error('Call session not found');
      }

      // Handle private call signaling
      if (callData.receiverEmail && !callData.groupId) {
        // Determine target for private call
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
          console.log('📞 Backend: Emitted callSignal to private call target:', targetEmail);
        } else {
          console.warn('⚠️ Backend: Target socket ID not found for signaling:', targetEmail);
        }
      } 
      // Handle group call signaling
      else if (callData.groupId) {
        const Group = require('../models/Group');
        const group = await Group.findById(callData.groupId);
        
        if (group && group.members) {
          const memberEmails = group.members || [];
          let notifiedCount = 0;
          
          // Send signal to all other group members (except sender)
          for (const memberEmail of memberEmails) {
            if (memberEmail === fromEmail) continue; // Skip sender
            
            const memberSocketId = userService.getSocketByEmail(memberEmail);
            if (memberSocketId) {
              io.to(memberSocketId).emit('callSignal', {
                sessionId,
                signal: signalData,
                from: fromEmail,
              });
              notifiedCount++;
            }
          }
          
          console.log(`📞 Backend: Emitted callSignal to ${notifiedCount} group members`);
        }
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

