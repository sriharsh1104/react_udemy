import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import CallHistoryTab from '../../components/call/CallHistoryTab';
import { useTheme } from '../../contexts/ThemeContext';
import { useCall } from '../../hooks/useCall';
import useUserEmail from '../../hooks/useUserEmail';
import { Alert } from 'react-native';
import IncomingCallScreen from '../../components/call/IncomingCallScreen';
import ActiveCallScreen from '../../components/call/ActiveCallScreen';
import styles from './styles';

const CallScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const currentRoute = useRoute();
  const { userEmail } = useUserEmail();
  const [contacts, setContacts] = useState([]);
  const currentRouteName = currentRoute?.name || 'Call';

  // Get all call state and handlers from useCall hook
  const {
    callState,
    callData,
    localStream,
    remoteStream,
    isMuted,
    isSpeakerOn,
    isVideoOn,
    callDuration,
    initiateCall: initiateCallHook,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleVideo,
    showPermissionPrompt,
    permissionDeviceType,
    handlePermissionRetry,
    handlePermissionCancel,
  } = useCall(userEmail);

  // Get contact name from email
  const getContactName = useCallback((email) => {
    if (!email) return null;
    // Try to find contact by contactEmail or email field
    const contact = contacts.find(c => 
      (c.contactEmail === email) || (c.email === email)
    );
    // Return contact name if found, otherwise extract from email
    return contact?.name || email.split('@')[0];
  }, [contacts]);

  const handleCallFromHistory = async (type, targetEmail, targetGroupId) => {
    try {
      if (targetGroupId) {
        await initiateCallHook(null, targetGroupId, type);
        // Call UI will show directly in CallScreen, no need to navigate
      } else if (targetEmail) {
        await initiateCallHook(targetEmail, null, type);
        // Call UI will show directly in CallScreen, no need to navigate
      }
    } catch (error) {
      console.error('Error calling from history:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  };

  // Render call screens
  const renderCallScreens = useCallback(() => {
    if (!callState || callState === 'idle') return null;

    const isOutgoing = callData?.direction === 'outgoing';
    
    // Get names for incoming calls
    const incomingCallerName = callData?.direction === 'incoming' 
      ? (getContactName(callData?.callerEmail) || callData?.callerEmail?.split('@')[0] || 'Unknown')
      : null;
    
    // Get names for outgoing calls
    const outgoingReceiverName = callData?.direction === 'outgoing'
      ? (getContactName(callData?.receiverEmail) || callData?.receiverEmail?.split('@')[0] || 'Unknown')
      : null;
    
    // Get participant name for active call
    const participantEmail = callData?.direction === 'outgoing' 
      ? callData?.receiverEmail 
      : callData?.callerEmail;
    const participantName = getContactName(participantEmail) || participantEmail?.split('@')[0] || 'Unknown';
    
    return (
      <>
        <IncomingCallScreen
          visible={callState === 'ringing'}
          callerName={incomingCallerName}
          callerEmail={callData?.callerEmail}
          callType={callData?.type || 'audio'}
          isOutgoing={isOutgoing}
          receiverName={outgoingReceiverName}
          receiverEmail={callData?.receiverEmail}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
        <ActiveCallScreen
          visible={callState === 'active' || callState === 'connecting'}
          participantName={participantName}
          participantEmail={participantEmail}
          callType={callData?.type || 'audio'}
          duration={callDuration}
          localStream={localStream}
          remoteStream={remoteStream}
          onEndCall={endCall}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
          onToggleVideo={toggleVideo}
          isMuted={isMuted}
          isSpeakerOn={isSpeakerOn}
          isVideoOn={isVideoOn}
        />
      </>
    );
  }, [callState, callData, callDuration, localStream, remoteStream, acceptCall, declineCall, endCall, toggleMute, toggleSpeaker, toggleVideo, isMuted, isSpeakerOn, isVideoOn, getContactName]);

  const handleContactsLoaded = useCallback((loadedContacts) => {
    setContacts(loadedContacts);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CallHistoryTab
        userEmail={userEmail}
        onCallPress={handleCallFromHistory}
        onContactsLoaded={handleContactsLoaded}
      />
      
      {/* Call UI Screens - Ringing and Active Call */}
      {renderCallScreens()}
      
      {/* Bottom Tab Bar */}
      <View style={[styles.bottomTabBar, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.tabButton, currentRouteName === 'Chat' && styles.activeTabButton]}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'Chat' && styles.activeTabIcon]}>💬</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'Chat' && styles.activeTabLabel, { color: currentRouteName === 'Chat' ? colors.primary : colors.textSecondary }]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentRouteName === 'Feed' && styles.activeTabButton]}
          onPress={() => navigation.navigate('Feed')}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'Feed' && styles.activeTabIcon]}>📰</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'Feed' && styles.activeTabLabel, { color: currentRouteName === 'Feed' ? colors.primary : colors.textSecondary }]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentRouteName === 'Status' && styles.activeTabButton]}
          onPress={() => navigation.navigate('Status')}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'Status' && styles.activeTabIcon]}>📱</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'Status' && styles.activeTabLabel, { color: currentRouteName === 'Status' ? colors.primary : colors.textSecondary }]}>Status</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentRouteName === 'Call' && styles.activeTabButton]}
          onPress={() => navigation.navigate('Call')}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'Call' && styles.activeTabIcon]}>📞</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'Call' && styles.activeTabLabel, { color: currentRouteName === 'Call' ? colors.primary : colors.textSecondary }]}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentRouteName === 'CalorieCount' && styles.activeTabButton]}
          onPress={() => navigation.navigate('CalorieCount')}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'CalorieCount' && styles.activeTabIcon]}>🔥</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'CalorieCount' && styles.activeTabLabel, { color: currentRouteName === 'CalorieCount' ? colors.primary : colors.textSecondary }]}>Health</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Powered by onlygossips247
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default CallScreen;

