import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
import ContactInfoModal from '../components/chat/ContactInfoModal';
import GLoader from '../components/common/GLoader';
import contactsService from '../services/contactsService';
import groupService from '../services/groupService';
import fileUploadService from '../services/fileUploadService';
import { Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import encryptionService from '../services/encryptionService';

const ChatScreen = ({ userEmail, onLogout, onProfilePress, onSettingsPress, onLogoutPress, navigation }) => {
  const { colors } = useTheme();
  const { addNotification, clearNotification } = useNotifications();
  
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
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(null);
  const [contactOnlineStatus, setContactOnlineStatus] = useState(false);
  const flatListRef = useRef(null);
  
  const { socket, isConnected } = useSocket();
  const { messages: privateMessages, typingUser, sendMessage: sendPrivateMessage, sendTyping: sendPrivateTyping, markMessagesAsRead: markPrivateMessagesAsRead } = useChat(userEmail, contactEmail, () => {
    // Refresh contacts when a new message is received
    loadContacts();
  });
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

  // Listen for all private messages to refresh contacts list and show notifications
  useEffect(() => {
    if (!socket || !userEmail) return;

    const handleAnyPrivateMessage = async (data) => {
      // Only handle messages from other users (not from ourselves)
      if (data.senderEmail && data.senderEmail !== userEmail) {
        // Refresh contacts list to show new contact or update unread count
        loadContacts();

        // Show notification only if not viewing this chat
        const isViewingThisChat = contactEmail === data.senderEmail && chatType === 'private';
        
        if (!isViewingThisChat) {
          // Decrypt message for notification
          let messageText = data.message;
          try {
            // Check if encrypted
            const parsed = JSON.parse(data.message);
            if (parsed && parsed.encrypted && parsed.iv) {
              messageText = await encryptionService.decryptPrivateMessage(
                parsed,
                userEmail,
                data.senderEmail
              );
            }
          } catch (error) {
            // Not encrypted or parse error, use as-is
            console.log('Message not encrypted or parse error:', error);
          }

          // Get sender name - try from current contacts, fallback to email
          const senderContact = contacts.find(c => c.email === data.senderEmail);
          let senderName = senderContact?.name;
          
          // If not found in contacts, try to get from profile or use email
          if (!senderName) {
            senderName = data.senderEmail?.split('@')[0] || 'Unknown';
          }

          // Add notification
          addNotification({
            senderEmail: data.senderEmail,
            senderName: senderName,
            message: messageText,
            timestamp: data.timestamp || new Date(),
            type: 'private',
            onPress: () => {
              // Navigate to chat
              setContactEmail(data.senderEmail);
              setChatType('private');
              setContactName(senderName);
              clearNotification(data.senderEmail);
            },
            onMarkAsRead: async () => {
              // Mark messages as read
              await contactsService.markMessagesAsRead(data.senderEmail);
              loadContacts();
            },
            onReply: async (replyMessage) => {
              // Send reply message directly
              if (replyMessage && replyMessage.trim()) {
                try {
                  const messageText = replyMessage.trim();
                  
                  // Check if socket is connected
                  const currentSocket = socketService.getSocket();
                  if (!currentSocket) {
                    Alert.alert('Connection Error', 'Socket not initialized. Please refresh the app.');
                    console.error('❌ Socket not initialized');
                    return;
                  }
                  
                  if (!currentSocket.connected) {
                    Alert.alert('Connection Error', 'Not connected to server. Please check your connection.');
                    console.error('❌ Socket not connected. Connection state:', currentSocket.connected);
                    return;
                  }
                  
                  console.log('📤 Starting reply send process...', {
                    to: data.senderEmail,
                    from: userEmail,
                    socketConnected: currentSocket.connected
                  });
                  
                  // Ensure user is logged in via socket (important for message delivery)
                  const loginSuccess = socketService.emit(SOCKET_EVENTS.LOGIN, { email: userEmail });
                  if (!loginSuccess) {
                    throw new Error('Failed to send login event');
                  }
                  
                  // Join the chat room to ensure proper message delivery
                  const joinSuccess = socketService.emit(SOCKET_EVENTS.JOIN_CHAT, {
                    userEmail: userEmail,
                    contactEmail: data.senderEmail,
                  });
                  if (!joinSuccess) {
                    throw new Error('Failed to join chat room');
                  }
                  
                  // Small delay to ensure socket operations are processed
                  await new Promise(resolve => setTimeout(resolve, 300));
                  
                  // If user is viewing this chat, use the sendMessage function for optimistic update
                  const isViewingThisChat = contactEmail === data.senderEmail && chatType === 'private';
                  
                  if (isViewingThisChat) {
                    // Use the sendMessage function which handles optimistic update
                    await sendPrivateMessage(messageText);
                  } else {
                    // Send directly via socket (user not viewing this chat)
                    // Encrypt the reply message
                    const encryptedData = await encryptionService.encryptPrivateMessage(
                      messageText,
                      userEmail,
                      data.senderEmail
                    );
                    
                    // Convert encrypted data to JSON string for storage
                    const encryptedMessage = JSON.stringify(encryptedData);
                    
                    // Verify socket is still connected before sending
                    if (!currentSocket || !currentSocket.connected) {
                      throw new Error('Socket disconnected before sending message');
                    }
                    
                    // Send encrypted message to server
                    const messageSent = socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
                      message: encryptedMessage,
                      contactEmail: data.senderEmail,
                      senderEmail: userEmail,
                    });
                    
                    if (!messageSent) {
                      throw new Error('Failed to emit PRIVATE_MESSAGE event');
                    }
                    
                    // Also send typing stop signal
                    socketService.emit(SOCKET_EVENTS.TYPING, {
                      contactEmail: data.senderEmail,
                      isTyping: false,
                    });
                    
                    console.log('✅ Reply message emitted successfully:', {
                      to: data.senderEmail,
                      from: userEmail,
                      messagePreview: messageText.substring(0, 50),
                      encryptedLength: encryptedMessage.length,
                      socketConnected: currentSocket.connected
                    });
                  }
                  
                  console.log('Reply sent successfully to:', data.senderEmail, 'Message:', messageText);
                  
                  // Refresh contacts to update last message (with delay to ensure server processed)
                  setTimeout(() => {
                    loadContacts();
                  }, 500);
                  
                  // Clear notification after sending
                  clearNotification(data.senderEmail);
                } catch (error) {
                  console.error('Error sending reply:', error);
                  console.error('Error details:', error.message, error.stack);
                  // Show error to user
                  Alert.alert('Error', `Failed to send message: ${error.message || 'Please try again.'}`);
                }
              }
            },
          });
        }
      }
    };

    socket.on('privateMessage', handleAnyPrivateMessage);

    return () => {
      socket.off('privateMessage', handleAnyPrivateMessage);
    };
  }, [socket, userEmail, contactEmail, chatType, contacts, addNotification, clearNotification]);

  // Periodically refresh contacts and groups
  useEffect(() => {
    // Refresh every 10 seconds to update online status and unread count
    const interval = setInterval(() => {
      loadContacts(false); // Don't show loading spinner
      loadGroups();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadGroups = async () => {
    const result = await groupService.getGroups();
    if (result.success) {
      // Always update groups to ensure favorite status is current
      setGroups(result.groups || []);
    }
  };

  // Update contact online status when contactEmail or contacts change
  useEffect(() => {
    if (contactEmail && contacts.length > 0) {
      const contact = contacts.find(c => c.email === contactEmail);
      if (contact) {
        setContactOnlineStatus(contact.isOnline || false);
      } else {
        // Contact not found in list, assume offline
        setContactOnlineStatus(false);
      }
    } else {
      setContactOnlineStatus(false);
    }
  }, [contactEmail, contacts]);

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
      // Find group from current groups state (but don't include groups in deps to avoid loop)
      const group = groups.find(g => g._id === groupId);
      if (group) {
        setGroupName(group.name);
        setCurrentGroup(group);
        // Mark group messages as read when chat is opened
        groupService.markMessagesAsRead(groupId).then(() => {
          // Reload groups to update unread count (but don't trigger this useEffect)
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
              // Reload groups to update unread count (but don't trigger this useEffect)
              loadGroups();
            });
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactEmail, groupId, chatType]); // Removed 'groups' from deps to prevent infinite loop

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
    setShowContactInfoModal(false);
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
        status={item.status || 'sent'}
        messageId={item.messageId || null}
      />
    );
  }, [userEmail, chatType]);

  // Mark messages as read when chat is viewed (only once per contact)
  const hasMarkedAsRead = useRef(false);
  useEffect(() => {
    if (contactEmail && chatType === 'private' && markPrivateMessagesAsRead) {
      // Reset flag when contact changes
      hasMarkedAsRead.current = false;
      // Clear notification when opening chat
      clearNotification(contactEmail);
    }
  }, [contactEmail, chatType, clearNotification]);
  
  useEffect(() => {
    if (contactEmail && chatType === 'private' && markPrivateMessagesAsRead && !hasMarkedAsRead.current) {
      // Small delay to ensure messages are loaded
      const timer = setTimeout(() => {
        if (!hasMarkedAsRead.current) {
          markPrivateMessagesAsRead();
          hasMarkedAsRead.current = true;
        }
      }, 1000); // Increased delay to ensure messages are fully loaded
      return () => clearTimeout(timer);
    }
  }, [contactEmail, chatType, markPrivateMessagesAsRead, messages.length]); // Also depend on messages.length to ensure messages are loaded

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
      <GLoader visible={loadingContacts} message="Loading contacts..." />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ChatHeader 
        username={chatType === 'group' ? groupName : (contactName || contactEmail)} 
        isOnline={chatType === 'group' ? false : contactOnlineStatus} 
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
        onContactInfoPress={() => setShowContactInfoModal(true)}
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

      {chatType === 'private' && contactEmail && (
        <ContactInfoModal
          visible={showContactInfoModal}
          onClose={() => setShowContactInfoModal(false)}
          contactEmail={contactEmail}
          userEmail={userEmail}
          contactName={contactName}
          onSelectGroup={handleSelectGroup}
          messages={privateMessages}
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
