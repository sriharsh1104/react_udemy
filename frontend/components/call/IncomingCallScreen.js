import React, { useEffect, useState } from 'react';
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
    }
  }, [visible]);

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
              onPress={onDecline}
            >
              <Text style={styles.endButtonText}>End</Text>
            </TouchableOpacity>
          ) : (
            // Incoming call - accept and decline
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={onDecline}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={onAccept}
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

