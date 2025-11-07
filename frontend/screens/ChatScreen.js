import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useChat } from '../hooks/useChat';
import socketService from '../services/socketService';
import { SOCKET_EVENTS, COLORS, SPACING } from '../constants';
import ChatHeader from '../components/chat/ChatHeader';
import MessageItem from '../components/chat/MessageItem';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import Sidebar, { InviteModal } from '../components/chat/Sidebar';
import RecentChats from '../components/chat/RecentChats';
import contactsService from '../services/contactsService';
import { Alert } from 'react-native';

const ChatScreen = ({ userEmail, onLogout, onProfilePress, onSettingsPress, onLogoutPress, navigation }) => {
  // Extract username from email (part before @)
  const getUsernameFromEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  const [contactEmail, setContactEmail] = useState(null);
  const [contactName, setContactName] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(null);
  const flatListRef = useRef(null);
  
  const { socket, isConnected } = useSocket();
  const { messages, typingUser, sendMessage, sendTyping } = useChat(userEmail, contactEmail);

  // Load contacts on mount and periodically refresh
  useEffect(() => {
    loadContacts();
    
    // Refresh contacts every 5 seconds to update online status and unread count
    const interval = setInterval(() => {
      loadContacts();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Load contact name when contactEmail changes and mark messages as read
  useEffect(() => {
    if (contactEmail) {
      const name = getUsernameFromEmail(contactEmail);
      setContactName(name);
      // Mark messages as read when chat is opened
      contactsService.markMessagesAsRead(contactEmail).then(() => {
        // Reload contacts to update unread count
        loadContacts();
      });
    }
  }, [contactEmail]);

  const loadContacts = async () => {
    setLoadingContacts(true);
    const result = await contactsService.getContacts();
    if (result.success) {
      setContacts(result.contacts);
    }
    setLoadingContacts(false);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleTyping = (text) => {
    setInputMessage(text);
    sendTyping(text.length > 0);
  };

  const handleSelectContact = async (selectedContactEmail) => {
    // Check if user exists
    const checkResult = await contactsService.checkUserExists(selectedContactEmail);
    
    if (checkResult.success && checkResult.exists) {
      // User exists - start chat
      // Add to contacts if not already added
      const isContact = contacts.some(c => c.email === selectedContactEmail);
      if (!isContact) {
        await contactsService.addContact(selectedContactEmail);
        await loadContacts();
      }
      setContactEmail(selectedContactEmail);
      setShowSidebar(false);
    } else {
      // User doesn't exist - show invite option
      setInviteEmail(selectedContactEmail);
      setShowInviteModal(true);
      setShowSidebar(false);
    }
  };

  const handleNewChat = () => {
    setShowSidebar(true);
  };

  const handleSaveContact = async (email) => {
    const result = await contactsService.addContact(email);
    if (result.success) {
      Alert.alert('Success', 'Contact saved successfully');
      await loadContacts();
    } else {
      Alert.alert('Error', result.message || 'Failed to save contact');
    }
  };

  const handleInvite = (email) => {
    setInviteEmail(email);
    setShowInviteModal(true);
  };

  const renderMessage = ({ item, index }) => {
    // Determine if message is sent by current user
    const isSent = item.isSent || item.senderEmail === userEmail;
    const senderName = item.senderEmail ? getUsernameFromEmail(item.senderEmail) : 'Unknown';
    
    return (
      <MessageItem
        key={index}
        message={item.message}
        username={senderName}
        timestamp={item.timestamp}
        isSystemMessage={false}
        isSent={isSent}
      />
    );
  };

  // Show recent chats if no contact selected
  if (!contactEmail) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ChatHeader 
          username={getUsernameFromEmail(userEmail)} 
          isOnline={isConnected} 
          onProfilePress={onProfilePress}
          onSettingsPress={onSettingsPress}
          onLogoutPress={onLogoutPress}
          onSidebarPress={() => setShowSidebar(true)}
        />
        
      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSelectContact={handleSelectContact}
      />
      
      <RecentChats
        contacts={contacts}
        onSelectContact={handleSelectContact}
        onNewChat={handleNewChat}
        onSaveContact={handleSaveContact}
        onInvite={handleInvite}
      />

      {showInviteModal && (
        <InviteModal
          visible={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setInviteEmail(null);
          }}
          email={inviteEmail}
        />
      )}
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <ChatHeader 
        username={contactName || contactEmail} 
        isOnline={isConnected} 
        onProfilePress={onProfilePress}
        onSettingsPress={onSettingsPress}
        onLogoutPress={onLogoutPress}
        onSidebarPress={() => setShowSidebar(true)}
        onBackPress={() => setContactEmail(null)}
        showBackButton={true}
      />
      
      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSelectContact={handleSelectContact}
      />
      
      <View style={styles.chatBackground}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `message-${index}-${item.timestamp}-${item.senderEmail}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          showsVerticalScrollIndicator={false}
          inverted={false}
        />
      </View>

      <TypingIndicator typingUsers={typingUser ? [typingUser] : []} />

      <MessageInput
        value={inputMessage}
        onChangeText={handleTyping}
        onSend={handleSendMessage}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  chatBackground: {
    flex: 1,
    backgroundColor: COLORS.chatBackground,
    position: 'relative',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default ChatScreen;
