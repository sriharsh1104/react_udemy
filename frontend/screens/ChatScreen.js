import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
  SafeAreaView,
} from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useChat } from '../hooks/useChat';
import { useGroupChat } from '../hooks/useGroupChat';
import socketService from '../services/socketService';
import { SOCKET_EVENTS, COLORS, SPACING } from '../constants';
import ChatHeader from '../components/chat/ChatHeader';
import MessageItem from '../components/chat/MessageItem';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import Sidebar, { InviteModal } from '../components/chat/Sidebar';
import RecentChats from '../components/chat/RecentChats';
import CreateGroupModal from '../components/chat/CreateGroupModal';
import GroupInfoModal from '../components/chat/GroupInfoModal';
import contactsService from '../services/contactsService';
import groupService from '../services/groupService';
import fileUploadService from '../services/fileUploadService';
import { Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const ChatScreen = ({ userEmail, onLogout, onProfilePress, onSettingsPress, onLogoutPress, navigation }) => {
  const { colors } = useTheme();
  
  // Extract username from email (part before @)
  const getUsernameFromEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  const [chatType, setChatType] = useState(null); // 'private' or 'group'
  const [contactEmail, setContactEmail] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const [contactName, setContactName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(null);
  const flatListRef = useRef(null);
  
  const { socket, isConnected } = useSocket();
  const { messages: privateMessages, typingUser, sendMessage: sendPrivateMessage, sendTyping: sendPrivateTyping } = useChat(userEmail, contactEmail);
  const { messages: groupMessages, typingUsers, sendMessage: sendGroupMessage, sendTyping: sendGroupTyping } = useGroupChat(userEmail, groupId);
  
  // Use appropriate messages and functions based on chat type
  const messages = chatType === 'group' ? groupMessages : privateMessages;
  const sendMessage = chatType === 'group' ? sendGroupMessage : sendPrivateMessage;
  const sendTyping = chatType === 'group' ? sendGroupTyping : sendPrivateTyping;
  const currentTypingUser = chatType === 'group' ? (typingUsers.length > 0 ? typingUsers[0] : null) : typingUser;

  // Load contacts and groups on mount
  useEffect(() => {
    loadContacts(true); // Show loading only on initial load
    loadGroups();
  }, []);

  // Periodically refresh contacts and groups (only when not in active chat)
  useEffect(() => {
    if (contactEmail || groupId) {
      // Don't auto-refresh when in active chat to prevent flickering
      return;
    }
    
    // Refresh every 10 seconds to update online status and unread count
    const interval = setInterval(() => {
      loadContacts(false); // Don't show loading spinner
      loadGroups();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [contactEmail, groupId]);

  const loadGroups = async () => {
    const result = await groupService.getGroups();
    if (result.success) {
      // Always update groups to ensure favorite status is current
      setGroups(result.groups || []);
    }
  };

  // Load contact/group info when chat changes
  useEffect(() => {
    if (chatType === 'private' && contactEmail) {
      const name = getUsernameFromEmail(contactEmail);
      setContactName(name);
      // Mark messages as read when chat is opened
      contactsService.markMessagesAsRead(contactEmail).then(() => {
        // Reload contacts to update unread count
        loadContacts();
      });
    } else if (chatType === 'group' && groupId) {
      const group = groups.find(g => g._id === groupId);
      if (group) {
        setGroupName(group.name);
        setCurrentGroup(group);
        // Mark group messages as read when chat is opened
        groupService.markMessagesAsRead(groupId).then(() => {
          // Reload groups to update unread count
          loadGroups();
        });
      } else {
        // Load group details if not in list
        groupService.getGroup(groupId).then(result => {
          if (result.success && result.group) {
            setGroupName(result.group.name);
            setCurrentGroup(result.group);
            // Mark group messages as read when chat is opened
            groupService.markMessagesAsRead(groupId).then(() => {
              loadGroups();
            });
          }
        });
      }
    }
  }, [contactEmail, groupId, chatType, groups]);

  const loadContacts = async (showLoading = false) => {
    if (showLoading) {
      setLoadingContacts(true);
    }
    const result = await contactsService.getContacts();
    if (result.success) {
      // Only update if data actually changed to prevent unnecessary re-renders
      setContacts(prevContacts => {
        const newContacts = result.contacts || [];
        // Check if data is actually different
        if (JSON.stringify(prevContacts) !== JSON.stringify(newContacts)) {
          return newContacts;
        }
        return prevContacts;
      });
    }
    if (showLoading) {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 50);
      });
    }
  }, [messages.length]); // Only depend on length to prevent unnecessary scrolls

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };
  
  const handleFileSelect = async (file) => {
    try {
      // Show upload progress with time estimate
      const fileSizeMB = ((file.size || 0) / 1024 / 1024).toFixed(2);
      const estimatedTimeSeconds = Math.ceil((file.size || 0) / (1024 * 1024));
      const estimatedTimeMinutes = Math.floor(estimatedTimeSeconds / 60);
      const estimatedTimeSecondsRemainder = estimatedTimeSeconds % 60;
      
      let estimatedTimeText = '';
      if (estimatedTimeMinutes > 0) {
        estimatedTimeText = `${estimatedTimeMinutes} min ${estimatedTimeSecondsRemainder} sec`;
      } else {
        estimatedTimeText = `${estimatedTimeSeconds} sec`;
      }
      
      Alert.alert(
        'Uploading File',
        `File size: ${fileSizeMB} MB\nEstimated time: ${estimatedTimeText}`,
        [{ text: 'OK' }]
      );
      
      // Upload file
      const uploadResult = await fileUploadService.uploadFile(file, userEmail);
      
      if (uploadResult.success && uploadResult.fileId) {
        // Send file message
        const fileMessage = JSON.stringify({
          type: 'file',
          fileId: uploadResult.fileId,
          fileName: uploadResult.fileName || file.name,
          fileType: uploadResult.fileType || file.type,
          fileSize: uploadResult.fileSize || file.size || 0,
        });
        
        sendMessage(fileMessage);
        
        // Show success with actual time
        Alert.alert(
          'Upload Complete',
          `File uploaded successfully in ${uploadResult.actualTime || estimatedTimeSeconds} seconds`
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to upload file');
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
      setChatType('private');
      setContactEmail(selectedContactEmail);
      setGroupId(null);
      setShowSidebar(false);
    } else {
      // User doesn't exist - show invite option
      setInviteEmail(selectedContactEmail);
      setShowInviteModal(true);
      setShowSidebar(false);
    }
  };

  const handleSelectGroup = (selectedGroupId) => {
    setChatType('group');
    setGroupId(selectedGroupId);
    setContactEmail(null);
    setShowSidebar(false);
  };

  const handleCreateGroup = () => {
    setShowCreateGroupModal(true);
  };

  const handleGroupCreated = async (group) => {
    await loadGroups();
    if (group && group._id) {
      handleSelectGroup(group._id);
    }
  };

  const handleGroupUpdated = async (updatedGroup) => {
    await loadGroups();
    if (updatedGroup && updatedGroup._id === groupId) {
      setCurrentGroup(updatedGroup);
      setGroupName(updatedGroup.name);
    }
  };

  const handleExitGroup = () => {
    setChatType(null);
    setGroupId(null);
    setCurrentGroup(null);
    setGroupName('');
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

  const renderMessage = React.useCallback(({ item, index }) => {
    // Determine if message is sent by current user
    const isSent = item.isSent || item.senderEmail === userEmail;
    const senderName = item.senderEmail ? getUsernameFromEmail(item.senderEmail) : 'Unknown';
    const showSenderName = chatType === 'group' && !isSent;
    
    return (
      <MessageItem
        key={index}
        message={item.message}
        username={showSenderName ? senderName : undefined}
        timestamp={item.timestamp}
        isSystemMessage={false}
        isSent={isSent}
      />
    );
  }, [userEmail, chatType]);

  // Show recent chats if no contact or group selected
  if (!contactEmail && !groupId) {
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
                    groups={groups}
                    onSelectContact={handleSelectContact}
                    onSelectGroup={handleSelectGroup}
                    onNewChat={handleNewChat}
                    onCreateGroup={handleCreateGroup}
                    onSaveContact={handleSaveContact}
                    onInvite={handleInvite}
                    onContactsUpdate={loadContacts}
                    onGroupsUpdate={loadGroups}
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

      <CreateGroupModal
        visible={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={handleGroupCreated}
      />
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
        username={chatType === 'group' ? groupName : (contactName || contactEmail)} 
        isOnline={isConnected} 
        onProfilePress={onProfilePress}
        onSettingsPress={onSettingsPress}
        onLogoutPress={onLogoutPress}
        onSidebarPress={() => setShowSidebar(true)}
        onBackPress={() => {
          setContactEmail(null);
          setGroupId(null);
          setChatType(null);
          setCurrentGroup(null);
        }}
        showBackButton={true}
        isGroup={chatType === 'group'}
        onGroupInfoPress={() => setShowGroupInfoModal(true)}
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
          keyExtractor={(item, index) => `message-${index}-${item.timestamp}-${item.senderEmail}-${item.message?.substring(0, 10)}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 50);
          }}
          showsVerticalScrollIndicator={false}
          inverted={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
        />
      </View>

      <TypingIndicator typingUsers={currentTypingUser ? [currentTypingUser] : []} />

      <MessageInput
        value={inputMessage}
        onChangeText={handleTyping}
        onSend={handleSendMessage}
        onFileSelect={handleFileSelect}
        userEmail={userEmail}
      />

      {currentGroup && (
        <GroupInfoModal
          visible={showGroupInfoModal}
          onClose={() => setShowGroupInfoModal(false)}
          group={currentGroup}
          userEmail={userEmail}
          onGroupUpdated={handleGroupUpdated}
          onExitGroup={handleExitGroup}
        />
      )}
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
