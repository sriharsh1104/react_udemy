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
import Sidebar from '../components/chat/Sidebar';

const ChatScreen = ({ userEmail, onLogout, onProfilePress, onLogoutPress, navigation }) => {
  // Extract username from email (part before @)
  const getUsernameFromEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  const [username, setUsername] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const flatListRef = useRef(null);
  
  const { socket, isConnected } = useSocket();
  const { messages, typingUsers, sendMessage, sendTyping } = useChat(username);

  // Initialize username from email
  useEffect(() => {
    if (userEmail) {
      const name = getUsernameFromEmail(userEmail);
      setUsername(name);
    }
  }, [userEmail]);

  // Join chat when socket is connected
  useEffect(() => {
    if (username && socket && isConnected) {
      socketService.emit(SOCKET_EVENTS.JOIN, username);
    }
  }, [username, socket, isConnected]);

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

  const handleSelectContact = (contactEmail) => {
    // For now, we'll just show an alert
    // In future, this can navigate to a specific chat screen
    console.log('Selected contact:', contactEmail);
    // You can implement navigation to individual chat here
  };

  const renderMessage = ({ item, index }) => {
    const isSystemMessage = 
      item.message.includes('joined') || item.message.includes('left');
    
    // Determine if message is sent by current user
    const isSent = item.username === username;
    
    return (
      <MessageItem
        key={index}
        message={item.message}
        username={item.username}
        timestamp={item.timestamp}
        isSystemMessage={isSystemMessage}
        isSent={isSent}
      />
    );
  };

  if (!username) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ChatHeader 
        username={username} 
        isOnline={isConnected} 
        onProfilePress={onProfilePress}
        onLogoutPress={onLogoutPress}
        onSidebarPress={() => setShowSidebar(true)}
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
          keyExtractor={(item, index) => `message-${index}-${item.timestamp}`}
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

      <TypingIndicator typingUsers={typingUsers} />

      <MessageInput
        value={inputMessage}
        onChangeText={handleTyping}
        onSend={handleSendMessage}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
});

export default ChatScreen;
