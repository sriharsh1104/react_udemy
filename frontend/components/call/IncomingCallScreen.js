import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';

const IncomingCallScreen = ({ 
  visible, 
  callerName, 
  callerEmail,
  callType, // 'audio' or 'video'
  onAccept, 
  onDecline,
  isOutgoing = false,
  receiverName,
  receiverEmail,
}) => {
  const [ringAnimation] = useState(new Animated.Value(0));
  const audioRef = useRef(null);
  const audioIntervalRef = useRef(null);

  // Generate bell/ringing sound using Web Audio API
  const playRingingSound = () => {
    if (Platform.OS !== 'web') return; // Only for web
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      
      // Create a bell-like sound (combination of frequencies)
      const playBell = () => {
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // First tone (higher frequency - bell ding)
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        // Second tone (lower frequency - bell dong)
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
        
        // Envelope for bell sound
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator1.start(audioContext.currentTime);
        oscillator2.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.15);
        oscillator2.stop(audioContext.currentTime + 0.15);
      };

      // Play bell sound every 2 seconds (ringing pattern)
      playBell(); // Play immediately
      audioIntervalRef.current = setInterval(() => {
        playBell();
      }, 2000); // Repeat every 2 seconds
    } catch (error) {
      console.error('Error playing ringing sound:', error);
    }
  };

  const stopRingingSound = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  };

  useEffect(() => {
    if (visible) {
      // Ringing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Play ringing sound for both incoming and outgoing calls
      playRingingSound();
    } else {
      // Stop ringing sound when not visible
      stopRingingSound();
    }

    // Cleanup on unmount
    return () => {
      stopRingingSound();
    };
  }, [visible, isOutgoing]);

  const displayName = isOutgoing 
    ? (receiverName || receiverEmail?.split('@')[0] || 'Unknown')
    : (callerName || callerEmail?.split('@')[0] || 'Unknown');

  const scale = ringAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onDecline}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
      style={{ zIndex: 9999 }}
      hardwareAccelerated={true}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.content}>
        {/* Avatar */}
        <Animated.View style={[styles.avatarContainer, { transform: [{ scale }] }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          {!isOutgoing && (
            <View style={styles.ringContainer}>
              <Animated.View 
                style={[
                  styles.ring,
                  {
                    transform: [{ scale }],
                    opacity: ringAnimation,
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.ring,
                  styles.ring2,
                  {
                    transform: [{ scale: ringAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.4],
                    }) }],
                    opacity: ringAnimation,
                  }
                ]} 
              />
            </View>
          )}
        </Animated.View>

        {/* Name */}
        <Text style={styles.name}>{displayName}</Text>
        
        {/* Status */}
        <Text style={styles.status}>
          {isOutgoing ? 'Calling...' : 'Incoming call'}
        </Text>
        <Text style={styles.callType}>
          {callType === 'video' ? '📹 Video' : '📞 Audio'} call
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isOutgoing ? (
            // Outgoing call - only end button
            <TouchableOpacity
              style={[styles.actionButton, styles.endButton]}
              onPress={() => {
                stopRingingSound();
                onDecline();
              }}
            >
              <Text style={styles.endButtonText}>End</Text>
            </TouchableOpacity>
          ) : (
            // Incoming call - accept and decline
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => {
                  stopRingingSound();
                  onDecline();
                }}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => {
                  stopRingingSound();
                  onAccept();
                }}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 9999,
    elevation: 9999, // Android
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.xxl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primaryLight,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  ringContainer: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  ring2: {
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -20,
    left: -20,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  status: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  callType: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.xxl,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.online,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
  declineButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  endButton: {
    backgroundColor: '#EF4444',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  endButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default IncomingCallScreen;

