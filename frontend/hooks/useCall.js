import { useState, useEffect, useRef, useCallback } from 'react';
import webrtcService from '../services/webrtcService';
import { Alert, Platform } from 'react-native';

export const useCall = (userEmail) => {
  const [callState, setCallState] = useState(null); // null, 'ringing', 'connecting', 'active', 'ended'
  const [callData, setCallData] = useState(null); // { sessionId, callerEmail, receiverEmail, type, direction }
  const callDataRef = useRef(null); // Ref to always have latest callData
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [permissionDeviceType, setPermissionDeviceType] = useState('microphone');
  const durationIntervalRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    callDataRef.current = callData;
  }, [callData]);

  // Helper functions (defined early so handlers can use them)
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetCall = () => {
    setCallState(null);
    setCallData(null);
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsSpeakerOn(false);
    setIsVideoOn(true);
    setCallDuration(0);
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  // Event handlers (defined before useEffect that uses them)
  const handleIncomingCall = useCallback((data) => {
    console.log('📞 useCall: Incoming call handler called:', data);
    console.log('📞 useCall: Setting callState to ringing, direction to incoming');
    setCallState('ringing');
    setCallData({
      sessionId: data.sessionId,
      callerEmail: data.callerEmail,
      type: data.type,
      direction: 'incoming',
    });
  }, []);

  const handleCallAccepted = useCallback((data) => {
    console.log('✅ useCall: Call accepted on other side:', data);
    const currentCallData = callDataRef.current;
    console.log('✅ useCall: Current callData (from ref):', currentCallData);
    
    // Check if this is for the current call by sessionId or direction
    const isOutgoingCall = currentCallData?.direction === 'outgoing' || 
                          (data.sessionId && currentCallData?.sessionId === data.sessionId);
    
    if (isOutgoingCall) {
      console.log('✅ useCall: This is an outgoing call, updating state...');
      // Start timer immediately when call is accepted (for sync)
      if (data.startedAt) {
        const startTime = new Date(data.startedAt);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        setCallDuration(Math.max(0, elapsed));
        setCallState('active');
        console.log('⏱️ useCall: Timer started on caller side from accepted time, elapsed:', elapsed, 'seconds');
      } else {
        // Fallback: if startedAt is missing, start timer from now
        console.warn('⚠️ useCall: startedAt missing in callAccepted, starting timer from now');
        setCallDuration(0);
        setCallState('active');
      }
    } else {
      console.warn('⚠️ useCall: callAccepted received but not for current outgoing call:', {
        callDataDirection: currentCallData?.direction,
        callDataSessionId: currentCallData?.sessionId,
        dataSessionId: data.sessionId,
      });
    }
  }, []);

  const handleCallActive = useCallback((data) => {
    console.log('✅ useCall: Call active event received:', data);
    // Receiver side: start timer when call becomes active
    if (data.startedAt) {
      const startTime = new Date(data.startedAt);
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000);
      setCallDuration(Math.max(0, elapsed));
      setCallState('active');
      console.log('⏱️ useCall: Timer started on receiver side from active time');
    }
  }, []);

  const handleCallDeclined = useCallback((data) => {
    resetCall();
    const message = data.status === 'busy' ? 'User is busy' : 'The call was declined';
    Alert.alert('Call Ended', message);
  }, []);

  const handleCallEnded = useCallback((data) => {
    console.log('📞 useCall: Call ended event received:', data);
    const currentCallData = callDataRef.current;
    
    // Verify this is for the current call
    if (currentCallData && data.sessionId && currentCallData.sessionId !== data.sessionId) {
      console.warn('⚠️ useCall: callEnded received for different session:', {
        currentSessionId: currentCallData.sessionId,
        receivedSessionId: data.sessionId,
      });
      return;
    }
    
    // Reset call state
    resetCall();
    
    // Don't show alert if call was ended by current user (they already know)
    // Only show alert if call was ended by the other party and call had duration
    if (data.duration !== undefined && data.duration > 0 && data.endedBy !== userEmail) {
      Alert.alert('Call Ended', `Call duration: ${formatDuration(data.duration)}`);
    } else if (data.duration === 0 || !data.duration) {
      // Call ended before being accepted, no need to show duration
      console.log('📞 useCall: Call ended before acceptance');
    }
  }, [userEmail]);

  const handleCallMissed = useCallback((data) => {
    resetCall();
    Alert.alert('Missed Call', 'The call was not answered');
  }, []);

  const handleCallFailed = useCallback((data) => {
    resetCall();
    Alert.alert('Call Failed', data.reason || 'Call connection failed');
  }, []);

  const handleRemoteStream = useCallback((data) => {
    console.log('🎥 useCall: Remote stream received:', data);
    setRemoteStream(data.stream);
    
    // Attach remote stream to audio element for playback
    if (data.stream && Platform.OS === 'web') {
      // For web, we need to attach the stream to an audio element
      // This will be handled by ActiveCallScreen component
    }
    
    // Only update state if not already active (timer already started via callAccepted/callActive)
    setCallState((currentState) => {
      if (currentState !== 'active') {
        console.log('✅ useCall: Remote stream received, call is active');
        // Timer will continue/start via useEffect when callState becomes 'active'
        return 'active';
      }
      return currentState;
    });
  }, []);

  const handleCallError = useCallback((data) => {
    console.error('❌ useCall: Call error received:', data);
    const errorMessage = data.message || 'Call error occurred';
    Alert.alert('Call Error', errorMessage, [
      {
        text: 'OK',
        onPress: () => resetCall(),
      },
    ]);
    resetCall();
  }, []);

  useEffect(() => {
    console.log('🔧 useCall: Setting up webrtc service listeners');
    // Setup webrtc service listeners
    webrtcService.on('incomingCall', handleIncomingCall);
    webrtcService.on('callAccepted', handleCallAccepted);
    webrtcService.on('callDeclined', handleCallDeclined);
    webrtcService.on('callEnded', handleCallEnded);
    webrtcService.on('callMissed', handleCallMissed);
    webrtcService.on('callFailed', handleCallFailed);
    webrtcService.on('remoteStream', handleRemoteStream);
    webrtcService.on('callActive', handleCallActive);
    webrtcService.on('callError', handleCallError);

    return () => {
      console.log('🔧 useCall: Cleaning up webrtc service listeners');
      webrtcService.off('incomingCall', handleIncomingCall);
      webrtcService.off('callAccepted', handleCallAccepted);
      webrtcService.off('callDeclined', handleCallDeclined);
      webrtcService.off('callEnded', handleCallEnded);
      webrtcService.off('callMissed', handleCallMissed);
      webrtcService.off('callFailed', handleCallFailed);
      webrtcService.off('remoteStream', handleRemoteStream);
      webrtcService.off('callActive', handleCallActive);
      webrtcService.off('callError', handleCallError);
    };
  }, [handleIncomingCall, handleCallAccepted, handleCallDeclined, handleCallEnded, handleCallMissed, handleCallFailed, handleRemoteStream, handleCallActive, handleCallError]);

  // Update timer every second when call is active
  // Duration is set by handleCallAccepted (caller) or handleCallActive (receiver)
  useEffect(() => {
    if (callState === 'active' && !durationIntervalRef.current) {
      console.log('⏱️ useCall: Starting timer interval, current duration:', callDuration);
      // Don't reset duration - it's already set by handleCallAccepted/handleCallActive
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (callState !== 'active' && durationIntervalRef.current) {
      // Stop timer if call is not active
      console.log('⏱️ useCall: Stopping timer');
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [callState]);

  // Debug: Log callState and callData changes
  useEffect(() => {
    console.log('📊 useCall: callState changed to:', callState);
    console.log('📊 useCall: callData:', callData);
  }, [callState, callData]);

  const startCallTimer = () => {
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const initiateCall = async (receiverEmail, groupId, type) => {
    try {
      const result = await webrtcService.initiateCall(receiverEmail, groupId, type);
      if (result.success) {
        setCallState('ringing');
        setCallData({
          sessionId: result.sessionId,
          receiverEmail,
          groupId,
          type,
          direction: 'outgoing',
        });
        setLocalStream(result.localStream);
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      const errorMessage = error.message || 'Failed to initiate call';
      
      // Check if it's a permission error
      if (errorMessage.includes('permission denied') || errorMessage.includes('Permission denied')) {
        setPermissionDeviceType(type === 'video' ? 'camera and microphone' : 'microphone');
        setShowPermissionPrompt(true);
      } else {
        Alert.alert(
          'Error',
          errorMessage,
          [
            {
              text: 'OK',
              onPress: () => resetCall(),
            },
          ]
        );
        resetCall();
      }
    }
  };

  const handlePermissionRetry = async () => {
    setShowPermissionPrompt(false);
    // Small delay to let user update permissions
    setTimeout(() => {
      if (callData) {
        // Retry the call
        const { receiverEmail, groupId, type } = callData;
        initiateCall(receiverEmail, groupId, type);
      }
    }, 500);
  };

  const handlePermissionCancel = () => {
    setShowPermissionPrompt(false);
    resetCall();
  };

  const acceptCall = async () => {
    try {
      if (!callData) return;
      console.log('📞 useCall: Receiver accepting call...');
      const result = await webrtcService.acceptCall(callData.sessionId);
      if (result.success) {
        setLocalStream(result.localStream);
        setCallState('connecting');
        console.log('✅ useCall: Call accepted, waiting for callActive event...');
        // Timer will start when callActive event is received from backend
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      const errorMessage = error.message || 'Failed to accept call';
      Alert.alert(
        'Permission Required',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => resetCall(),
          },
        ]
      );
      resetCall();
    }
  };

  const declineCall = async () => {
    try {
      if (!callData) return;
      await webrtcService.declineCall(callData.sessionId);
      resetCall();
    } catch (error) {
      console.error('Error declining call:', error);
      resetCall();
    }
  };

  const endCall = async () => {
    try {
      console.log('📞 useCall: Ending call from this side...');
      const currentCallData = callDataRef.current;
      if (currentCallData && currentCallData.sessionId) {
        await webrtcService.endCall(currentCallData.sessionId);
        // Backend will emit callEnded to both parties
        // Don't reset immediately - wait for callEnded event from backend for proper sync
        console.log('✅ useCall: End call request sent, waiting for callEnded event...');
      } else {
        // No sessionId, just reset locally
        console.warn('⚠️ useCall: No sessionId found, resetting locally');
        resetCall();
      }
    } catch (error) {
      console.error('Error ending call:', error);
      // Force reset even on error
      resetCall();
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    // Speaker toggle logic would go here
    // This requires native modules for React Native
    setIsSpeakerOn(!isSpeakerOn);
  };

  const toggleVideo = () => {
    if (localStream && callData?.type === 'video') {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  return {
    callState,
    callData,
    localStream,
    remoteStream,
    isMuted,
    isSpeakerOn,
    isVideoOn,
    callDuration,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleVideo,
  };
};

