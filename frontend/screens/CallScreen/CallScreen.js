import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import CallHistoryTab from '../../components/call/CallHistoryTab';
import GLoader from '../../components/common/GLoader';
import { useTheme } from '../../contexts/ThemeContext';
import { useCall } from '../../hooks/useCall';
import { Alert } from 'react-native';
import styles from './styles';

const CallScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const currentRoute = useRoute();
  const userEmail = route?.params?.userEmail || '';
  const [loading, setLoading] = useState(false);
  const currentRouteName = currentRoute?.name || 'Call';

  const {
    initiateCall: initiateCallHook,
  } = useCall(userEmail);

  const handleCallFromHistory = async (type, targetEmail, targetGroupId) => {
    try {
      if (targetGroupId) {
        await initiateCallHook(null, targetGroupId, type);
        // Navigate back to Chat screen where call UI is handled
        navigation.navigate('Chat');
      } else if (targetEmail) {
        await initiateCallHook(targetEmail, null, type);
        // Navigate back to Chat screen where call UI is handled
        navigation.navigate('Chat');
      }
    } catch (error) {
      console.error('Error calling from history:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CallHistoryTab
        userEmail={userEmail}
        onCallPress={handleCallFromHistory}
      />
      
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
          onPress={() => navigation.navigate('Feed', { userEmail })}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'Feed' && styles.activeTabIcon]}>📰</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'Feed' && styles.activeTabLabel, { color: currentRouteName === 'Feed' ? colors.primary : colors.textSecondary }]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentRouteName === 'Status' && styles.activeTabButton]}
          onPress={() => navigation.navigate('Status', { userEmail })}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'Status' && styles.activeTabIcon]}>📱</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'Status' && styles.activeTabLabel, { color: currentRouteName === 'Status' ? colors.primary : colors.textSecondary }]}>Status</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentRouteName === 'Call' && styles.activeTabButton]}
          onPress={() => navigation.navigate('Call', { userEmail })}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'Call' && styles.activeTabIcon]}>📞</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'Call' && styles.activeTabLabel, { color: currentRouteName === 'Call' ? colors.primary : colors.textSecondary }]}>Call</Text>
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

