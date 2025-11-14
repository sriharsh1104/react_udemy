import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';

const ActiveCallScreen = ({
  visible,
  participantName,
  participantEmail,
  callType, // 'audio' or 'video'
  duration, // in seconds
  localStream,
  remoteStream,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onToggleVideo,
  isMuted = false,
  isSpeakerOn = false,
  isVideoOn = true,
}) => {
  const [callDuration, setCallDuration] = useState(duration || 0);
  const remoteAudioRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoContainerRef = useRef(null);
  const localVideoContainerRef = useRef(null);

  useEffect(() => {
    if (visible && duration === 0) {
      // Start timer
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (duration > 0) {
      setCallDuration(duration);
    }
  }, [visible, duration]);

  // Attach remote audio stream for web platform
  useEffect(() => {
    if (Platform.OS === 'web' && remoteStream) {
      // Create audio element if it doesn't exist
      if (!remoteAudioRef.current) {
        const audioElement = document.createElement('audio');
        audioElement.autoplay = true;
        audioElement.playsInline = true;
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);
        remoteAudioRef.current = audioElement;
      }
      
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(err => {
          console.error('Error playing remote audio:', err);
        });
      }
    }
    return () => {
      if (Platform.OS === 'web' && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
        if (remoteAudioRef.current.parentNode) {
          remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current);
        }
        remoteAudioRef.current = null;
      }
    };
  }, [remoteStream]);

  // Attach remote video stream for web platform
  useEffect(() => {
    if (Platform.OS === 'web' && callType === 'video' && remoteStream && remoteVideoContainerRef.current) {
      // Create video element if it doesn't exist
      if (!remoteVideoRef.current) {
        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        videoElement.style.position = 'absolute';
        videoElement.style.top = '0';
        videoElement.style.left = '0';
        
        // Get the native DOM element from React Native View
        const container = remoteVideoContainerRef.current;
        if (container && container._nativeNode) {
          container._nativeNode.appendChild(videoElement);
          remoteVideoRef.current = videoElement;
        }
      }
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(err => {
          console.error('Error playing remote video:', err);
        });
      }
    }
    return () => {
      if (Platform.OS === 'web' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        if (remoteVideoRef.current.parentNode) {
          remoteVideoRef.current.parentNode.removeChild(remoteVideoRef.current);
        }
        remoteVideoRef.current = null;
      }
    };
  }, [remoteStream, callType]);

  // Attach local video stream for web platform
  useEffect(() => {
    if (Platform.OS === 'web' && callType === 'video' && localStream && localVideoContainerRef.current) {
      // Create video element if it doesn't exist
      if (!localVideoRef.current) {
        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = true;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        videoElement.style.position = 'absolute';
        videoElement.style.top = '0';
        videoElement.style.left = '0';
        
        // Get the native DOM element from React Native View
        const container = localVideoContainerRef.current;
        if (container && container._nativeNode) {
          container._nativeNode.appendChild(videoElement);
          localVideoRef.current = videoElement;
        }
      }
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(err => {
          console.error('Error playing local video:', err);
        });
      }
    }
    return () => {
      if (Platform.OS === 'web' && localVideoRef.current) {
        localVideoRef.current.srcObject = null;
        if (localVideoRef.current.parentNode) {
          localVideoRef.current.parentNode.removeChild(localVideoRef.current);
        }
        localVideoRef.current = null;
      }
    };
  }, [localStream, callType]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const displayName = participantName || participantEmail?.split('@')[0] || 'Unknown';

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onEndCall}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
      style={{ zIndex: 9999 }}
      hardwareAccelerated={true}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
      
      {/* Video View (if video call) */}
      {callType === 'video' && remoteStream && (
        <View style={styles.videoContainer} ref={remoteVideoContainerRef}>
          <View style={styles.remoteVideoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>Remote Video</Text>
          </View>
        </View>
      )}

      {/* Local video (if video call) */}
      {callType === 'video' && localStream && (
        <View style={styles.localVideoContainer} ref={localVideoContainerRef}>
          <View style={styles.localVideoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>You</Text>
          </View>
        </View>
      )}

      {/* Audio call view */}
      {callType === 'audio' && (
        <View style={styles.audioContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
          <Text style={styles.status}>Connected</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Mute button */}
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={onToggleMute}
        >
          <Text style={styles.controlButtonIcon}>
            {isMuted ? '🔇' : '🎤'}
          </Text>
        </TouchableOpacity>

        {/* Speaker button */}
        <TouchableOpacity
          style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
          onPress={onToggleSpeaker}
        >
          <Text style={styles.controlButtonIcon}>
            {isSpeakerOn ? '🔊' : '🔈'}
          </Text>
        </TouchableOpacity>

        {/* Video toggle (only for video calls) */}
        {callType === 'video' && (
          <TouchableOpacity
            style={[styles.controlButton, isVideoOn && styles.controlButtonActive]}
            onPress={onToggleVideo}
          >
            <Text style={styles.controlButtonIcon}>
              {isVideoOn ? '📹' : '📷'}
            </Text>
          </TouchableOpacity>
        )}

        {/* End call button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={onEndCall}
        >
          <Text style={styles.endCallButtonIcon}>📞</Text>
        </TouchableOpacity>
      </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.receivedMessage,
  },
  videoPlaceholderText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  localVideoContainer: {
    position: 'absolute',
    top: SPACING.xl,
    right: SPACING.xl,
    width: 120,
    height: 160,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.receivedMessage,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  localVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  duration: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  status: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.online,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
    backgroundColor: COLORS.headerBackground,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.receivedMessage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: COLORS.primary,
  },
  controlButtonIcon: {
    fontSize: 24,
  },
  endCallButton: {
    backgroundColor: '#EF4444',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  endCallButtonIcon: {
    fontSize: 24,
    transform: [{ rotate: '135deg' }],
  },
});

export default ActiveCallScreen;

