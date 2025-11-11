import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useChat } from '../hooks/useChat';
import { useGroupChat } from '../hooks/useGroupChat';
import socketService from '../services/socketService';
import { SOCKET_EVENTS, COLORS, SPACING, TYPOGRAPHY } from '../constants';
import ChatHeader from '../components/chat/ChatHeader';
import MessageItem from '../components/chat/MessageItem';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import Sidebar, { InviteModal } from '../components/chat/Sidebar';
import RecentChats from '../components/chat/RecentChats';
import CreateGroupModal from '../components/chat/CreateGroupModal';
import GroupInfoModal from '../components/chat/GroupInfoModal';
import ContactInfoModal from '../components/chat/ContactInfoModal';
import MessageActionMenu from '../components/chat/MessageActionMenu';
import MessageActionBar from '../components/chat/MessageActionBar';
import MessageInfoModal from '../components/chat/MessageInfoModal';
import PinnedMessageBanner from '../components/chat/PinnedMessageBanner';
import GLoader from '../components/common/GLoader';
import StatusFeed from '../components/chat/StatusFeed';
import Status from '../components/chat/Status';
import contactsService from '../services/contactsService';
import groupService from '../services/groupService';
import fileUploadService from '../services/fileUploadService';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import encryptionService from '../services/encryptionService';
import { showSuccessToast } from '../utils/toast';

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
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]); // Array of selected messages
  const [replyingTo, setReplyingTo] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [loadingPinnedMessage, setLoadingPinnedMessage] = useState(false);
  const [showMessageInfoModal, setShowMessageInfoModal] = useState(false);
  const [messageInfoMessageId, setMessageInfoMessageId] = useState(null);
  const [activeBottomTab, setActiveBottomTab] = useState('chat'); // 'chat', 'feed', 'status', 'call'
  const flatListRef = useRef(null);
  
  const { socket, isConnected } = useSocket();
  const { messages: privateMessages, typingUser, sendMessage: sendPrivateMessage, sendTyping: sendPrivateTyping, markMessagesAsRead: markPrivateMessagesAsRead } = useChat(userEmail, contactEmail, () => {
    // Backend will send contactsUpdated event, no need to call API
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
        // Update contact's last message and unread count without full API call
        // Backend will send contactsUpdated event if needed

        // Show notification only if not viewing this chat and chat is not archived
        const isViewingThisChat = contactEmail === data.senderEmail && chatType === 'private';
        const senderContact = contacts.find(c => c.email === data.senderEmail);
        const isArchived = senderContact?.isArchived === true;
        
        if (!isViewingThisChat && !isArchived) {
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
          let senderName = senderContact?.name;
          
          // If not found in contacts, try to get from profile or use email
          if (!senderName) {
            senderName = data.senderEmail?.split('@')[0] || 'Unknown';
          }

          // Capture senderEmail in a variable to avoid closure issues
          const notificationSenderEmail = data.senderEmail;
          
          // Add notification
          addNotification({
            senderEmail: notificationSenderEmail,
            senderName: senderName,
            message: messageText,
            timestamp: data.timestamp || new Date(),
            type: 'private',
            onPress: () => {
              // Navigate to chat
              setContactEmail(notificationSenderEmail);
              setChatType('private');
              setContactName(senderName);
              clearNotification(notificationSenderEmail);
            },
            onMarkAsRead: async () => {
              // Mark messages as read - backend will send contactsUpdated event
              await contactsService.markMessagesAsRead(notificationSenderEmail);
            },
            onReply: async (replyMessage) => {
              console.log('📨 ChatScreen: onReply callback called', {
                replyMessage: replyMessage,
                senderEmail: notificationSenderEmail,
                userEmail: userEmail
              });
              
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
                  
                  console.log('📤 ChatScreen: Starting reply send process...', {
                    to: notificationSenderEmail,
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
                    contactEmail: notificationSenderEmail,
                  });
                  if (!joinSuccess) {
                    throw new Error('Failed to join chat room');
                  }
                  
                  // Small delay to ensure socket operations are processed
                  await new Promise(resolve => setTimeout(resolve, 300));
                  
                  // If user is viewing this chat, use the sendMessage function for optimistic update
                  const isViewingThisChat = contactEmail === notificationSenderEmail && chatType === 'private';
                  
                  if (isViewingThisChat) {
                    // Use the sendMessage function which handles optimistic update
                    await sendPrivateMessage(messageText);
                  } else {
                    // Send directly via socket (user not viewing this chat)
                    // Encrypt the reply message
                    const encryptedData = await encryptionService.encryptPrivateMessage(
                      messageText,
                      userEmail,
                      notificationSenderEmail
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
                      contactEmail: notificationSenderEmail,
                      senderEmail: userEmail,
                    });
                    
                    if (!messageSent) {
                      throw new Error('Failed to emit PRIVATE_MESSAGE event');
                    }
                    
                    // Also send typing stop signal
                    socketService.emit(SOCKET_EVENTS.TYPING, {
                      contactEmail: notificationSenderEmail,
                      isTyping: false,
                    });
                    
                    console.log('✅ ChatScreen: Reply message emitted successfully:', {
                      to: notificationSenderEmail,
                      from: userEmail,
                      messagePreview: messageText.substring(0, 50),
                      encryptedLength: encryptedMessage.length,
                      socketConnected: currentSocket.connected
                    });
                  }
                  
                  console.log('✅ ChatScreen: Reply sent successfully to:', notificationSenderEmail, 'Message:', messageText);
                  
                  // Backend will send contactsUpdated event, no need to call API
                  
                  // Clear notification after sending
                  clearNotification(notificationSenderEmail);
                } catch (error) {
                  console.error('❌ ChatScreen: Error sending reply:', error);
                  console.error('Error details:', error.message, error.stack);
                  // Show error to user
                  Alert.alert('Error', `Failed to send message: ${error.message || 'Please try again.'}`);
                }
              } else {
                console.warn('⚠️ ChatScreen: Empty reply message received');
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

  // Listen for socket events to update contacts and groups in real-time
  useEffect(() => {
    if (!socket || !userEmail) return;

    // Listen for contacts update event from backend
    const handleContactsUpdated = (data) => {
      console.log('📬 Contacts updated via socket:', data);
      // Only update if we have new data
      if (data && (data.contacts || data.contactEmail)) {
        loadContacts(false); // Refresh contacts list
      }
    };

    // Listen for groups update event from backend
    const handleGroupsUpdated = (data) => {
      console.log('📬 Groups updated via socket:', data);
      // Only update if we have new data
      if (data && (data.groups || data.groupId)) {
        loadGroups(); // Refresh groups list
      }
    };

    // Listen for contact online status changes
    const handleContactOnlineStatus = (data) => {
      console.log('🟢 Contact online status changed:', data);
      if (data && data.contactEmail) {
        // Update specific contact's online status without full refresh
        setContacts((prev) =>
          prev.map((contact) =>
            contact.email === data.contactEmail
              ? { ...contact, isOnline: data.isOnline }
              : contact
          )
        );
      }
    };

    socket.on(SOCKET_EVENTS.CONTACTS_UPDATED, handleContactsUpdated);
    socket.on(SOCKET_EVENTS.GROUPS_UPDATED, handleGroupsUpdated);
    socket.on(SOCKET_EVENTS.CONTACT_ONLINE_STATUS, handleContactOnlineStatus);
    
    return () => {
      socket.off(SOCKET_EVENTS.CONTACTS_UPDATED, handleContactsUpdated);
      socket.off(SOCKET_EVENTS.GROUPS_UPDATED, handleGroupsUpdated);
      socket.off(SOCKET_EVENTS.CONTACT_ONLINE_STATUS, handleContactOnlineStatus);
    };
  }, [socket, userEmail]);

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
      // Don't mark as read here - will be handled by useChat hook when messages are loaded
      // Only mark if there are actually unread messages
    } else if (chatType === 'group' && groupId) {
      // Find group from current groups state (but don't include groups in deps to avoid loop)
      const group = groups.find(g => g._id === groupId);
      if (group) {
        setGroupName(group.name);
        setCurrentGroup(group);
        // Only mark as read if there are unread messages
        if (group.unreadCount > 0) {
          groupService.markMessagesAsRead(groupId);
        }
      } else {
        // Load group details if not in list
        groupService.getGroup(groupId).then(result => {
          if (result.success && result.group) {
            setGroupName(result.group.name);
            setCurrentGroup(result.group);
            // Only mark as read if there are unread messages
            if (result.group.unreadCount > 0) {
              groupService.markMessagesAsRead(groupId).then(() => {
                // Reload groups to update unread count (but don't trigger this useEffect)
                loadGroups();
              });
            }
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
      // Include reply info if replying
      const replyInfo = replyingTo ? {
        replyTo: replyingTo.messageId,
        replyToMessage: replyingTo.message,
        replyToSender: replyingTo.senderEmail,
      } : null;
      
      sendMessage(inputMessage, replyInfo);
      setInputMessage('');
      setReplyingTo(null); // Clear reply after sending
    }
  };
  
  const handleFileSelect = async (file) => {
    try {
      // Capture current chat context to ensure file is sent to the correct chat
      const currentChatType = chatType;
      const currentContactEmail = contactEmail;
      const currentGroupId = groupId;
      
      // Verify that we have a valid chat context
      if (!currentChatType || (currentChatType === 'private' && !currentContactEmail) || (currentChatType === 'group' && !currentGroupId)) {
        Alert.alert('Error', 'Please select a chat to send the file');
        return;
      }
      
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
        // Verify chat context hasn't changed during upload
        const chatContextChanged = 
          (currentChatType !== chatType) ||
          (currentChatType === 'private' && currentContactEmail !== contactEmail) ||
          (currentChatType === 'group' && currentGroupId !== groupId);
        
        if (chatContextChanged) {
          Alert.alert(
            'Chat Changed',
            'The chat was changed while uploading. File will not be sent to prevent sending to wrong chat.'
          );
          return;
        }
        
        // Send file message to the correct chat
        const fileMessage = JSON.stringify({
          type: 'file',
          fileId: uploadResult.fileId,
          fileName: uploadResult.fileName || file.name,
          fileType: uploadResult.fileType || file.type,
          fileSize: uploadResult.fileSize || file.size || 0,
        });
        
        // Use the appropriate sendMessage function based on chat type
        if (currentChatType === 'private' && currentContactEmail) {
          sendPrivateMessage(fileMessage);
        } else if (currentChatType === 'group' && currentGroupId) {
          sendGroupMessage(fileMessage);
        }
        
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
      // User exists - start chat directly without adding to contacts
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
    // Backend will send groupsUpdated event, no need to call API
    if (group && group._id) {
      handleSelectGroup(group._id);
    }
  };

  const handleGroupUpdated = async (updatedGroup) => {
    // Backend will send groupsUpdated event, no need to call API
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
      // Backend will send contactsUpdated event, no need to call API
    } else {
      Alert.alert('Error', result.message || 'Failed to save contact');
    }
  };

  const handleInvite = (email) => {
    setInviteEmail(email);
    setShowInviteModal(true);
  };

  const handlePinMessage = async (messageId) => {
    if (!groupId || !messageId) return;
    const result = await groupService.pinMessage(messageId, groupId);
    if (result.success) {
      // Reload pinned message banner
      await loadPinnedMessage();
      // The socket will handle the message update
    }
  };

  const handleUnpinMessage = async (messageId) => {
    if (!groupId || !messageId) return;
    const result = await groupService.unpinMessage(messageId, groupId);
    if (result.success) {
      // Clear pinned message banner
      setPinnedMessage(null);
      // The socket will handle the update
    }
  };

  // Load pinned message for group
  const loadPinnedMessage = async () => {
    if (chatType !== 'group' || !groupId) {
      setPinnedMessage(null);
      return;
    }

    setLoadingPinnedMessage(true);
    try {
      const result = await groupService.getPinnedMessages(groupId);
      if (result.success && result.pinnedMessages && result.pinnedMessages.length > 0) {
        // Get the most recently pinned message (first in array)
        const latestPinned = result.pinnedMessages[0];
        // Decrypt if needed
        let decryptedMessage = latestPinned.message;
        try {
          const parsed = JSON.parse(latestPinned.message);
          if (parsed && parsed.encrypted && parsed.iv) {
            decryptedMessage = await encryptionService.decryptGroupMessage(parsed, groupId);
          }
        } catch {
          // Not encrypted, use as-is
        }
        setPinnedMessage({
          ...latestPinned,
          message: decryptedMessage,
        });
      } else {
        setPinnedMessage(null);
      }
    } catch (error) {
      console.error('Error loading pinned message:', error);
      setPinnedMessage(null);
    } finally {
      setLoadingPinnedMessage(false);
    }
  };

  // Load pinned message when group changes
  useEffect(() => {
    if (chatType === 'group' && groupId) {
      loadPinnedMessage();
    } else {
      setPinnedMessage(null);
    }
  }, [groupId, chatType]);

  // Listen for pinned/unpinned socket events to update banner
  useEffect(() => {
    if (!socket || chatType !== 'group' || !groupId) return;

    const handleMessagePinned = async (data) => {
      if (data.groupId === groupId) {
        // Reload pinned message
        await loadPinnedMessage();
      }
    };

    const handleMessageUnpinned = (data) => {
      if (data.groupId === groupId) {
        // Clear pinned message banner
        setPinnedMessage(null);
      }
    };

    socket.on('messagePinned', handleMessagePinned);
    socket.on('messageUnpinned', handleMessageUnpinned);

    return () => {
      socket.off('messagePinned', handleMessagePinned);
      socket.off('messageUnpinned', handleMessageUnpinned);
    };
  }, [socket, chatType, groupId]);

  // Handle pinned message click - scroll to message
  const handlePinnedMessagePress = () => {
    if (!pinnedMessage || !pinnedMessage._id) return;
    
    // Find message index in messages array
    const messageIndex = messages.findIndex(
      (msg) => (msg.messageId === pinnedMessage._id || msg._id === pinnedMessage._id)
    );
    
    if (messageIndex >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: messageIndex,
        animated: true,
        viewPosition: 0.5, // Center the message
      });
    }
  };

  // Handle unpin from banner
  const handleUnpinFromBanner = async () => {
    if (!pinnedMessage || !pinnedMessage._id || !groupId) return;
    await handleUnpinMessage(pinnedMessage._id);
  };

  // Handle message selection (for action bar)
  const handleMessageSelect = (messageData) => {
    if (!messageData) {
      // Deselect all
      setSelectedMessages([]);
      return;
    }

    setSelectedMessages((prev) => {
      const exists = prev.some(
        (msg) => (msg.messageId || msg._id) === (messageData.messageId || messageData._id)
      );
      
      if (exists) {
        // Deselect if already selected
        return prev.filter(
          (msg) => (msg.messageId || msg._id) !== (messageData.messageId || messageData._id)
        );
      } else {
        // Add to selection
        const fullMessage = messages.find(
          (msg) => (msg.messageId || msg._id) === (messageData.messageId || messageData._id)
        );
        return [
          ...prev,
          {
            ...messageData,
            timestamp: fullMessage?.timestamp || messageData.timestamp,
          },
        ];
      }
    });
  };

  // Message action menu handlers (for backward compatibility)
  const handleMenuPress = (messageData) => {
    // Find the full message object to get timestamp
    const fullMessage = messages.find(
      (msg) => (msg.messageId || msg._id) === messageData.messageId
    );
    setSelectedMessage({
      ...messageData,
      timestamp: fullMessage?.timestamp || messageData.timestamp,
    });
    setShowMessageMenu(true);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage || !selectedMessage.messageId) return;
    
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              let result;
              if (chatType === 'group') {
                result = await groupService.deleteMessage(selectedMessage.messageId);
              } else {
                result = await contactsService.deleteMessage(selectedMessage.messageId);
              }
              
              if (result.success) {
                // For group messages, socket event will handle the update
                // For private messages, the message will be removed from backend
                // UI will update on next message load or refresh
              }
            } catch (error) {
              console.error('Error deleting message:', error);
            }
          },
        },
      ]
    );
  };

  const handleForwardMessage = () => {
    // TODO: Implement forward functionality
    Alert.alert('Forward', 'Forward functionality coming soon');
  };

  const handleReplyMessage = () => {
    if (!selectedMessage) return;
    setReplyingTo({
      messageId: selectedMessage.messageId,
      message: selectedMessage.message,
      senderEmail: selectedMessage.isSent ? userEmail : (chatType === 'group' ? null : contactEmail),
    });
    setShowMessageMenu(false);
  };

  const handleCopyMessage = async () => {
    if (selectedMessages.length === 0) return;
    try {
      // Copy first selected message
      const messageToCopy = selectedMessages[0];
      await Clipboard.setStringAsync(messageToCopy.message);
      showSuccessToast('Copied!', 'Message copied to clipboard');
      setSelectedMessages([]);
    } catch (error) {
      console.error('Error copying message:', error);
    }
  };

  const handleInfoMessage = () => {
    if (selectedMessages.length === 0) return;
    // Show info for first selected message
    const messageToShow = selectedMessages[0];
    Alert.alert(
      'Message Info',
      `Sent: ${new Date(messageToShow.timestamp || Date.now()).toLocaleString()}\n${messageToShow.isPinned ? '📌 Pinned' : ''}`
    );
  };

  // Action bar handlers
  const handleActionBarCopy = () => {
    handleCopyMessage();
  };

  const handleActionBarReply = () => {
    if (selectedMessages.length === 0) return;
    const messageToReply = selectedMessages[0];
    setReplyingTo({
      messageId: messageToReply.messageId,
      message: messageToReply.message,
      senderEmail: messageToReply.isSent ? userEmail : (chatType === 'group' ? null : contactEmail),
    });
    setSelectedMessages([]);
  };

  const handleActionBarForward = () => {
    if (selectedMessages.length === 0) return;
    Alert.alert('Forward', 'Forward functionality coming soon');
    setSelectedMessages([]);
  };

  const handleActionBarPin = () => {
    if (selectedMessages.length === 0 || !groupId) return;
    const messageToPin = selectedMessages[0];
    if (messageToPin.messageId) {
      handlePinMessage(messageToPin.messageId);
      setSelectedMessages([]);
    }
  };

  const handleActionBarUnpin = () => {
    if (selectedMessages.length === 0 || !groupId) return;
    const messageToUnpin = selectedMessages[0];
    if (messageToUnpin.messageId) {
      handleUnpinMessage(messageToUnpin.messageId);
      setSelectedMessages([]);
    }
  };

  const handleActionBarDelete = () => {
    if (selectedMessages.length === 0) return;
    const messageToDelete = selectedMessages[0];
    setSelectedMessage(messageToDelete);
    handleDeleteMessage();
    setSelectedMessages([]);
  };

  const handleActionBarInfo = () => {
    if (selectedMessages.length === 0) return;
    const messageToShow = selectedMessages[0];
    if (messageToShow.messageId) {
      setMessageInfoMessageId(messageToShow.messageId);
      setShowMessageInfoModal(true);
      setSelectedMessages([]);
    }
  };

  // Load message info
  const loadMessageInfo = async (messageId) => {
    if (chatType === 'group') {
      return await groupService.getMessageInfo(messageId);
    } else {
      return await contactsService.getMessageInfo(messageId);
    }
  };

  const handleActionBarClose = () => {
    setSelectedMessages([]);
  };

  const renderMessage = React.useCallback(({ item, index }) => {
    // Determine if message is sent by current user
    const isSent = item.isSent || item.senderEmail === userEmail;
    const senderName = item.senderEmail ? getUsernameFromEmail(item.senderEmail) : 'Unknown';
    const showSenderName = chatType === 'group' && !isSent;
    
    // Check if current user is creator (only for group chats)
    const isCreator = chatType === 'group' && currentGroup && currentGroup.createdBy === userEmail;
    const isPinned = item.isPinned || false;
    
    // Check if message is selected
    const isSelected = selectedMessages.some(
      (msg) => (msg.messageId || msg._id) === (item.messageId || item._id)
    );
    
    // Calculate status for group messages based on readBy array
    let messageStatus = item.status || 'sent';
    if (chatType === 'group' && isSent && currentGroup && item.readBy) {
      const allMembers = currentGroup.members || [];
      const readBy = item.readBy || [];
      const totalMembers = allMembers.length;
      // Exclude sender from total count (sender doesn't need to read their own message)
      const expectedReadCount = totalMembers - 1;
      const readCount = readBy.length;
      
      // If all members (except sender) have read, status is 'read'
      if (readCount >= totalMembers) {
        messageStatus = 'read';
      } else if (readCount > 1) { // More than just sender has read
        messageStatus = 'delivered';
      } else {
        messageStatus = 'sent';
      }
    }
    
    return (
      <MessageItem
        key={index}
        message={item.message}
        username={showSenderName ? senderName : undefined}
        timestamp={item.timestamp}
        isSystemMessage={false}
        isSent={isSent}
        status={messageStatus}
        messageId={item.messageId || item._id || null}
        isPinned={isPinned}
        isCreator={isCreator}
        onPin={handlePinMessage}
        onUnpin={handleUnpinMessage}
        groupId={chatType === 'group' ? groupId : null}
        onSelect={handleMessageSelect}
        isSelected={isSelected}
        onMenuPress={handleMenuPress}
        isGroup={chatType === 'group'}
        replyTo={item.replyTo || null}
        replyToMessage={item.replyToMessage || null}
        replyToSender={item.replyToSender || null}
        userEmail={userEmail}
      />
    );
  }, [userEmail, chatType, currentGroup, groupId, selectedMessages, handleMessageSelect, handleMenuPress, handlePinMessage, handleUnpinMessage]);

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
      // Check if there are unread messages before marking as read
      const contact = contacts.find(c => c.email === contactEmail);
      const hasUnreadMessages = contact && contact.unreadCount > 0;
      
      // Only mark as read if there are unread messages
      if (hasUnreadMessages) {
        // Small delay to ensure messages are loaded
        const timer = setTimeout(() => {
          if (!hasMarkedAsRead.current) {
            // Check again if there are unread messages in the loaded messages
            const unreadMessages = messages.filter(msg => !msg.isSent && msg.senderEmail === contactEmail);
            if (unreadMessages.length > 0) {
              // Call API to mark messages as read
              contactsService.markMessagesAsRead(contactEmail);
              // Also send socket read receipts
              markPrivateMessagesAsRead();
            }
            hasMarkedAsRead.current = true;
          }
        }, 1000); // Increased delay to ensure messages are fully loaded
        return () => clearTimeout(timer);
      } else {
        // No unread messages, just mark as done
        hasMarkedAsRead.current = true;
      }
    }
  }, [contactEmail, chatType, markPrivateMessagesAsRead, messages.length, contacts]); // Added contacts to check unread count

  // Render content based on active bottom tab
  const renderTabContent = () => {
    if (activeBottomTab === 'chat') {
      // Show recent chats if no contact or group selected
      if (!contactEmail && !groupId) {
        return (
          <>
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
              userEmail={userEmail}
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
              contacts={contacts}
            />
          </>
        );
      }

      // Show chat interface when contact or group is selected
      return (
        <>
          {/* Message Action Bar - WhatsApp style */}
          <MessageActionBar
            visible={selectedMessages.length > 0}
            selectedCount={selectedMessages.length}
            isCreator={chatType === 'group' && currentGroup && currentGroup.createdBy === userEmail}
            isGroup={chatType === 'group'}
            isPinned={selectedMessages.length > 0 && selectedMessages[0].isPinned}
            onCopy={handleActionBarCopy}
            onReply={handleActionBarReply}
            onForward={handleActionBarForward}
            onPin={handleActionBarPin}
            onUnpin={handleActionBarUnpin}
            onDelete={handleActionBarDelete}
            onInfo={handleActionBarInfo}
            onClose={handleActionBarClose}
          />

          {/* Pinned Message Banner - Only for groups */}
          {chatType === 'group' && pinnedMessage && (
            <PinnedMessageBanner
              pinnedMessage={pinnedMessage}
              onPress={handlePinnedMessagePress}
              onClose={handleUnpinFromBanner}
              isCreator={currentGroup && currentGroup.createdBy === userEmail}
            />
          )}
          
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
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />

          <MessageActionMenu
            visible={showMessageMenu}
            onClose={() => {
              setShowMessageMenu(false);
              setSelectedMessage(null);
            }}
            message={selectedMessage?.message || ''}
            messageId={selectedMessage?.messageId || null}
            isSent={selectedMessage?.isSent || false}
            isPinned={selectedMessage?.isPinned || false}
            isCreator={selectedMessage?.isCreator || false}
            isGroup={selectedMessage?.isGroup || false}
            onDelete={handleDeleteMessage}
            onForward={handleForwardMessage}
            onReply={handleReplyMessage}
            onPin={() => selectedMessage?.messageId && handlePinMessage(selectedMessage.messageId)}
            onUnpin={() => selectedMessage?.messageId && handleUnpinMessage(selectedMessage.messageId)}
            onCopy={handleCopyMessage}
            onInfo={handleInfoMessage}
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

          <MessageInfoModal
            visible={showMessageInfoModal}
            onClose={() => {
              setShowMessageInfoModal(false);
              setMessageInfoMessageId(null);
            }}
            messageId={messageInfoMessageId}
            chatType={chatType}
            userEmail={userEmail}
            onLoadMessageInfo={loadMessageInfo}
          />
        </>
      );
    } else if (activeBottomTab === 'feed') {
      return (
        <StatusFeed userEmail={userEmail} contacts={contacts} />
      );
    } else if (activeBottomTab === 'status') {
      return (
        <Status userEmail={userEmail} contacts={contacts} />
      );
    } else if (activeBottomTab === 'call') {
      return (
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
          <Text style={styles.comingSoonSubtext}>Call feature is under development</Text>
        </View>
      );
    }
    return null;
  };

  // Show recent chats if no contact or group selected
  if (!contactEmail && !groupId) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
            contacts={contacts}
          />
          
          <View style={styles.contentContainer}>
            {renderTabContent()}
          </View>

          {/* Bottom Tab Bar */}
          <View style={[styles.bottomTabBar, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[styles.tabButton, activeBottomTab === 'chat' && styles.activeTabButton]}
              onPress={() => setActiveBottomTab('chat')}
            >
              <Text style={[styles.tabIcon, activeBottomTab === 'chat' && styles.activeTabIcon]}>💬</Text>
              <Text style={[styles.tabLabel, activeBottomTab === 'chat' && styles.activeTabLabel]}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeBottomTab === 'feed' && styles.activeTabButton]}
              onPress={() => setActiveBottomTab('feed')}
            >
              <Text style={[styles.tabIcon, activeBottomTab === 'feed' && styles.activeTabIcon]}>📰</Text>
              <Text style={[styles.tabLabel, activeBottomTab === 'feed' && styles.activeTabLabel]}>Feed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeBottomTab === 'status' && styles.activeTabButton]}
              onPress={() => setActiveBottomTab('status')}
            >
              <Text style={[styles.tabIcon, activeBottomTab === 'status' && styles.activeTabIcon]}>📱</Text>
              <Text style={[styles.tabLabel, activeBottomTab === 'status' && styles.activeTabLabel]}>Status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeBottomTab === 'call' && styles.activeTabButton]}
              onPress={() => setActiveBottomTab('call')}
            >
              <Text style={[styles.tabIcon, activeBottomTab === 'call' && styles.activeTabIcon]}>📞</Text>
              <Text style={[styles.tabLabel, activeBottomTab === 'call' && styles.activeTabLabel]}>Call</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Powered by onlygossips247
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
      
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>

      {/* Bottom Tab Bar */}
      <View style={[styles.bottomTabBar, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeBottomTab === 'chat' && styles.activeTabButton]}
          onPress={() => setActiveBottomTab('chat')}
        >
          <Text style={[styles.tabIcon, activeBottomTab === 'chat' && styles.activeTabIcon]}>💬</Text>
          <Text style={[styles.tabLabel, activeBottomTab === 'chat' && styles.activeTabLabel]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeBottomTab === 'feed' && styles.activeTabButton]}
          onPress={() => setActiveBottomTab('feed')}
        >
          <Text style={[styles.tabIcon, activeBottomTab === 'feed' && styles.activeTabIcon]}>📰</Text>
          <Text style={[styles.tabLabel, activeBottomTab === 'feed' && styles.activeTabLabel]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeBottomTab === 'status' && styles.activeTabButton]}
          onPress={() => setActiveBottomTab('status')}
        >
          <Text style={[styles.tabIcon, activeBottomTab === 'status' && styles.activeTabIcon]}>📱</Text>
          <Text style={[styles.tabLabel, activeBottomTab === 'status' && styles.activeTabLabel]}>Status</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeBottomTab === 'call' && styles.activeTabButton]}
          onPress={() => setActiveBottomTab('call')}
        >
          <Text style={[styles.tabIcon, activeBottomTab === 'call' && styles.activeTabIcon]}>📞</Text>
          <Text style={[styles.tabLabel, activeBottomTab === 'call' && styles.activeTabLabel]}>Call</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Powered by onlygossips247
        </Text>
      </View>
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
  contentContainer: {
    flex: 1,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  comingSoonText: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  comingSoonSubtext: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bottomTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
    backgroundColor: COLORS.background,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  activeTabButton: {
    // Active state styling handled by icon and label colors
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs / 2,
  },
  activeTabIcon: {
    // Icon color stays the same, but you can add transform or other effects
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  footer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});

export default ChatScreen;
