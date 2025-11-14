import { useState, useEffect, useRef } from 'react';
import webrtcService from '../services/webrtcService';
import { Alert, Platform } from 'react-native';

export const useCall = (userEmail) => {
  const [callState, setCallState] = useState(null); // null, 'ringing', 'connecting', 'active', 'ended'
  const [callData, setCallData] = useState(null); // { sessionId, callerEmail, receiverEmail, type, direction }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [permissionDeviceType, setPermissionDeviceType] = useState('microphone');
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    // Setup webrtc service listeners
    webrtcService.on('incomingCall', handleIncomingCall);
    webrtcService.on('callAccepted', handleCallAccepted);
    webrtcService.on('callDeclined', handleCallDeclined);
    webrtcService.on('callEnded', handleCallEnded);
    webrtcService.on('callMissed', handleCallMissed);
    webrtcService.on('callFailed', handleCallFailed);
    webrtcService.on('remoteStream', handleRemoteStream);

    return () => {
      webrtcService.off('incomingCall', handleIncomingCall);
      webrtcService.off('callAccepted', handleCallAccepted);
      webrtcService.off('callDeclined', handleCallDeclined);
      webrtcService.off('callEnded', handleCallEnded);
      webrtcService.off('callMissed', handleCallMissed);
      webrtcService.off('callFailed', handleCallFailed);
      webrtcService.off('remoteStream', handleRemoteStream);
    };
  }, []);

  const handleIncomingCall = (data) => {
    setCallState('ringing');
    setCallData({
      sessionId: data.sessionId,
      callerEmail: data.callerEmail,
      type: data.type,
      direction: 'incoming',
    });
  };

  const handleCallAccepted = (data) => {
    setCallState('connecting');
  };

  const handleCallDeclined = (data) => {
    resetCall();
    Alert.alert('Call Declined', 'The call was declined');
  };

  const handleCallEnded = (data) => {
    resetCall();
    if (data.duration) {
      Alert.alert('Call Ended', `Call duration: ${formatDuration(data.duration)}`);
    }
  };

  const handleCallMissed = (data) => {
    resetCall();
    Alert.alert('Missed Call', 'The call was not answered');
  };

  const handleCallFailed = (data) => {
    resetCall();
    Alert.alert('Call Failed', data.reason || 'Call connection failed');
  };

  const handleRemoteStream = (data) => {
    setRemoteStream(data.stream);
    if (callState === 'connecting') {
      setCallState('active');
      startCallTimer();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCallTimer = () => {
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
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
      const result = await webrtcService.acceptCall(callData.sessionId);
      if (result.success) {
        setLocalStream(result.localStream);
        setCallState('connecting');
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
      if (callData && callData.sessionId) {
        await webrtcService.endCall(callData.sessionId);
      }
      // Always reset call state, even if there's an error
      resetCall();
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

