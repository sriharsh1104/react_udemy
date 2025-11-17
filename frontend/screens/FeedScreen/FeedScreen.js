import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import StatusFeed from '../../components/chat/StatusFeed';
import contactsService from '../../services/contactsService';
import GLoader from '../../components/common/GLoader';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './styles';

const FeedScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const currentRoute = useRoute();
  const userEmail = route?.params?.userEmail || '';
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentRouteName = currentRoute?.name || 'Feed';

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const recentChatsResult = await contactsService.getRecentChats();
      if (recentChatsResult.success) {
        const nonArchivedContacts = recentChatsResult.contacts || [];
        setContacts(nonArchivedContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <GLoader visible={true} message="Loading..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusFeed userEmail={userEmail} contacts={contacts} />
      
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

export default FeedScreen;

