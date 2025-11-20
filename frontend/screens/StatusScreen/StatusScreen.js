import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Status from '../../components/chat/Status';
import { useTheme } from '../../contexts/ThemeContext';
import useUserEmail from '../../hooks/useUserEmail';
import styles from './styles';

const StatusScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const currentRoute = useRoute();
  const { userEmail } = useUserEmail();
  const currentRouteName = currentRoute?.name || 'Status';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Status userEmail={userEmail} contacts={[]} />
      
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

export default StatusScreen;

