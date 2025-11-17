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
import { useRoute } from '@react-navigation/native';
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
import CallHistory from '../components/call/CallHistory';
import CallHistoryTab from '../components/call/CallHistoryTab';
import IncomingCallScreen from '../components/call/IncomingCallScreen';
import ActiveCallScreen from '../components/call/ActiveCallScreen';
import PermissionPrompt from '../components/call/PermissionPrompt';
import BillSplitModal from '../components/chat/BillSplitModal';
import BillSummaryModal from '../components/chat/BillSummaryModal';
import contactsService from '../services/contactsService';
import billSplitService from '../services/billSplitService';
import webrtcService from '../services/webrtcService';
import { useCall } from '../hooks/useCall';
import groupService from '../services/groupService';
import fileUploadService from '../services/fileUploadService';
import settingsService from '../services/settingsService';
import { Alert } from 'react-native';
import ConfirmationModal from '../components/common/ConfirmationModal';
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
  const [contacts, setContacts] = useState([]); // All contacts from getRecentChats (including archived)
  const [groups, setGroups] = useState([]); // All groups from getRecentChats (including archived)
  const [allContacts, setAllContacts] = useState([]); // All contacts for Sidebar Contacts section
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
  // Get current route name to highlight active tab
  const route = useRoute();
  const currentRouteName = route?.name || 'Chat';
  const [editingMessage, setEditingMessage] = useState(null); // Track message being edited
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showBillSplitModal, setShowBillSplitModal] = useState(false);
  const [showBillSummaryModal, setShowBillSummaryModal] = useState(false);
  const flatListRef = useRef(null);
  
  const { socket, isConnected } = useSocket(userEmail);
  
  // Call management
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
  
  // Calculate actual online status (online only if connected AND not in offline mode)
  const actualOnlineStatus = isConnected && !offlineMode;
  const { messages: privateMessages, typingUser, loadingMessages: loadingPrivateMessages, sendMessage: sendPrivateMessage, sendTyping: sendPrivateTyping, markMessagesAsRead: markPrivateMessagesAsRead, removePendingMessage: removePrivatePendingMessage } = useChat(userEmail, contactEmail, () => {
    // Backend will send contactsUpdated event, no need to call API
  });
  const { messages: groupMessages, typingUsers, loadingMessages: loadingGroupMessages, sendMessage: sendGroupMessage, sendTyping: sendGroupTyping, removePendingMessage: removeGroupPendingMessage } = useGroupChat(userEmail, groupId);
  
  // Use appropriate messages and functions based on chat type
  const messages = chatType === 'group' ? groupMessages : privateMessages;
  const loadingMessages = chatType === 'group' ? loadingGroupMessages : loadingPrivateMessages;
  const sendMessage = chatType === 'group' ? sendGroupMessage : sendPrivateMessage;
  const sendTyping = chatType === 'group' ? sendGroupTyping : sendPrivateTyping;
  const currentTypingUser = chatType === 'group' ? (typingUsers.length > 0 ? typingUsers[0] : null) : typingUser;

  // Load contacts and groups on mount
  useEffect(() => {
    loadContacts(true); // Show loading only on initial load - this also loads groups via getRecentChats
    loadOfflineMode(); // Load offline mode status
  }, []);
  
  // Load offline mode status
  const loadOfflineMode = async () => {
    try {
      const result = await settingsService.getOfflineMode();
      if (result.success) {
        setOfflineMode(result.offlineMode || false);
      }
    } catch (error) {
      console.error('Error loading offline mode:', error);
    }
  };
  
  // Handle status toggle (online/offline)
  const handleStatusToggle = async () => {
    try {
      const newOfflineMode = !offlineMode;
      const result = await settingsService.toggleOfflineMode(newOfflineMode);
      if (result.success) {
        setOfflineMode(newOfflineMode);
      }
    } catch (error) {
      console.error('Error toggling offline mode:', error);
    }
  };

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
                    
                  }
                  
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
      // Always refresh contacts list when we get an update event
      // This ensures deleted contacts are removed from the list
        loadContacts(false); // Refresh contacts list
    };

    // Listen for groups update event from backend
    const handleGroupsUpdated = (data) => {
      // Always refresh contacts and groups list when we get an update event
      // This ensures archived groups are removed/added from the list
      if (data) {
        loadContacts(false); // Refresh contacts and groups list (getRecentChats returns both)
      }
    };

    // Listen for contact online status changes
    const handleContactOnlineStatus = (data) => {
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
                // Reload contacts and groups to update unread count (but don't trigger this useEffect)
                loadContacts(false);
              });
            }
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactEmail, groupId, chatType]); // Removed 'groups' from deps to prevent infinite loop

  // Load recent chats for Recent Chats section (only getRecentChats API - includes archived data)
  const loadContacts = async (showLoading = false) => {
    if (showLoading) {
      setLoadingContacts(true);
    }
    try {
      // Get recent chats (includes both non-archived and archived contacts/groups)
      // This API returns: contacts, groups, archivedContacts, archivedGroups
      const recentChatsResult = await contactsService.getRecentChats();
      
      if (recentChatsResult.success) {
        // Combine non-archived and archived contacts
        const nonArchivedContacts = recentChatsResult.contacts || [];
        const archivedContacts = recentChatsResult.archivedContacts || [];
        const allContactsCombined = [...nonArchivedContacts, ...archivedContacts];
        setContacts(allContactsCombined);
        
        // Combine non-archived and archived groups
        const nonArchivedGroups = recentChatsResult.groups || [];
        const archivedGroups = recentChatsResult.archivedGroups || [];
        const allGroupsCombined = [...nonArchivedGroups, ...archivedGroups];
        setGroups(allGroupsCombined);
      } else {
        console.error('❌ Failed to load recent chats:', recentChatsResult.message);
        }
    } catch (error) {
      console.error('❌ Error loading recent chats:', error);
    } finally {
    if (showLoading) {
      setLoadingContacts(false);
      }
    }
  };

  // Load all contacts for Sidebar Contacts section (only when Sidebar is opened)
  const loadAllContacts = async () => {
    try {
      const allContactsResult = await contactsService.getContacts();
      if (allContactsResult.success) {
        setAllContacts(allContactsResult.contacts || []);
      }
    } catch (error) {
      console.error('❌ Error loading all contacts:', error);
    }
  };

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      });
    }
  }, [messages.length, messages[messages.length - 1]?.messageId]); // Scroll when new message added or messageId updated

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      // If editing a message, call edit instead of send
      if (editingMessage && editingMessage.messageId) {
        try {
          let result;
          if (chatType === 'group') {
            result = await groupService.editMessage(editingMessage.messageId, inputMessage.trim());
          } else {
            result = await contactsService.editMessage(editingMessage.messageId, inputMessage.trim());
          }
          
          if (result.success) {
            setInputMessage('');
            setEditingMessage(null);
            setReplyingTo(null);
          }
        } catch (error) {
          console.error('Error editing message:', error);
          Alert.alert('Error', 'Failed to edit message');
        }
        return;
      }
      
      // Include reply info if replying
      const replyInfo = replyingTo ? {
        replyTo: replyingTo.messageId,
        replyToMessage: replyingTo.message,
        replyToSender: replyingTo.senderEmail,
      } : null;
      
      sendMessage(inputMessage, replyInfo);
      setInputMessage('');
      setReplyingTo(null); // Clear reply after sending
      setEditingMessage(null); // Clear editing state
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
    // Load all contacts when Sidebar (Contacts section) is opened
    loadAllContacts();
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
        
        // Calculate status for group messages
        let messageStatus = fullMessage?.status || messageData.status || 'sent';
        if (chatType === 'group' && fullMessage && (fullMessage.isSent || fullMessage.senderEmail === userEmail) && currentGroup && fullMessage.readBy) {
          const allMembers = currentGroup.members || [];
          const readBy = fullMessage.readBy || [];
          const totalMembers = allMembers.length;
          const readCount = readBy.length;
          
          // If all members (except sender) have read, status is 'read'
          if (readCount >= totalMembers) {
            messageStatus = 'read';
          } else if (readCount > 1) {
            messageStatus = 'delivered';
          } else {
            messageStatus = 'sent';
          }
        }
        
        return [
          ...prev,
          {
            ...messageData,
            ...fullMessage,
            timestamp: fullMessage?.timestamp || messageData.timestamp,
            status: messageStatus,
            readBy: fullMessage?.readBy || messageData.readBy || [],
          },
        ];
      }
    });
  };

  // Message action menu handlers (for backward compatibility)
  const handleMenuPress = (messageData) => {
    // Find the full message object to get timestamp, status, and readBy
    const fullMessage = messages.find(
      (msg) => (msg.messageId || msg._id) === messageData.messageId
    );
    
    // Calculate status for group messages
    let messageStatus = fullMessage?.status || messageData.status || 'sent';
    if (chatType === 'group' && fullMessage && (fullMessage.isSent || fullMessage.senderEmail === userEmail) && currentGroup && fullMessage.readBy) {
      const allMembers = currentGroup.members || [];
      const readBy = fullMessage.readBy || [];
      const totalMembers = allMembers.length;
      const readCount = readBy.length;
      
      // If all members (except sender) have read, status is 'read'
      if (readCount >= totalMembers) {
        messageStatus = 'read';
      } else if (readCount > 1) {
        messageStatus = 'delivered';
      } else {
        messageStatus = 'sent';
      }
    }
    
    setSelectedMessage({
      ...messageData,
      ...fullMessage,
      timestamp: fullMessage?.timestamp || messageData.timestamp,
      status: messageStatus,
      readBy: fullMessage?.readBy || messageData.readBy || [],
    });
    setShowMessageMenu(true);
  };

  const handleDeleteMessage = () => {
    if (!selectedMessage) return;
    
    // Check if message can be undone
    // Can undo if: message is sent by user AND has no messageId (never saved to server)
    // OR messageId exists but status is still 'sent' (saved but not delivered to receiver)
    const canUndo = selectedMessage.isSent && 
                    (!selectedMessage.messageId || 
                     (selectedMessage.messageId && selectedMessage.status === 'sent'));
    
    // Always show modal, but with different text based on canUndo
    setMessageToDelete(selectedMessage);
    setShowDeleteMessageModal(true);
  };

  const handleDeleteMessageConfirm = async () => {
    setShowDeleteMessageModal(false);
    
    if (!messageToDelete) return;
    
    // Check if message can be undone
    // Can undo if: message has no messageId (never saved to server)
    // If messageId exists, it's already in database, so we need to delete it
    const canUndo = messageToDelete.isSent && !messageToDelete.messageId;
    
    if (canUndo) {
      
      // Remove from messages array using hook function
      if (chatType === 'group') {
        // For group chat, use the removePendingMessage function
        if (removeGroupPendingMessage) {
          removeGroupPendingMessage(messageToDelete);
          showSuccessToast('Message removed');
        }
      } else {
        // For private chat, use the removePendingMessage function
        if (removePrivatePendingMessage) {
          removePrivatePendingMessage(messageToDelete);
          showSuccessToast('Message removed');
        }
      }
      
      setSelectedMessage(null);
      setMessageToDelete(null);
    } else {
      // Delete: Message is already in database, call API to delete it
      // This will show "This message is deleted" to all users
      if (!messageToDelete.messageId) {
        console.error('Cannot delete message without messageId');
        return;
      }
      
            try {
              let result;
              if (chatType === 'group') {
          result = await groupService.deleteMessage(messageToDelete.messageId);
              } else {
          result = await contactsService.deleteMessage(messageToDelete.messageId);
              }
              
              if (result.success) {
                // Clear editing state if deleting the message being edited
          if (editingMessage && editingMessage.messageId === messageToDelete.messageId) {
                  setEditingMessage(null);
                  setInputMessage('');
                }
          // Socket event will handle the UI update (will show "This message is deleted")
        } else {
          console.error('❌ Failed to delete message:', result.message);
              }
            } catch (error) {
        console.error('❌ Error deleting message:', error);
            }
    }
    
    setSelectedMessage(null);
    setMessageToDelete(null);
  };

  const handleDeleteMessageCancel = () => {
    setShowDeleteMessageModal(false);
    setMessageToDelete(null);
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

  const handleActionBarEdit = () => {
    if (selectedMessages.length === 0) return;
    const messageToEdit = selectedMessages[0];
    setSelectedMessage(messageToEdit);
    setEditingMessage(messageToEdit);
    // Set input message to current message for editing
    setInputMessage(messageToEdit.message);
    setSelectedMessages([]);
    // Focus on input (will be handled by MessageInput component)
  };

  const handleEditMessage = () => {
    if (!selectedMessage) return;
    setEditingMessage(selectedMessage);
    setInputMessage(selectedMessage.message);
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  const handleActionBarDelete = () => {
    if (selectedMessages.length === 0) return;
    const messageToDelete = selectedMessages[0];
    setSelectedMessage(messageToDelete);
    setSelectedMessages([]);
    // handleDeleteMessage will show the confirmation modal
    handleDeleteMessage();
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

  const handleClearChat = () => {
    // Determine chat type if not set (fallback logic)
    const actualChatType = chatType || (groupId ? 'group' : contactEmail ? 'private' : null);
    if (!actualChatType) {
      console.error('❌ Cannot determine chat type!');
      // Show error using modal
      setShowClearChatModal(true);
      return;
    }

    // Show confirmation modal
    setShowClearChatModal(true);
  };

  const handleClearChatConfirm = async () => {
    setShowClearChatModal(false);
    
    // Determine chat type if not set (fallback logic)
    const actualChatType = chatType || (groupId ? 'group' : contactEmail ? 'private' : null);
    
    if (!actualChatType) {
      console.error('❌ Cannot determine chat type!');
      return;
    }

    await executeClearChat(actualChatType);
  };

  const handleClearChatCancel = () => {
    setShowClearChatModal(false);
  };

  const executeClearChat = async (actualChatType) => {
            try {
              let result;
      
      if (actualChatType === 'group') {
        if (!groupId) {
          console.error('❌ Group ID is missing!', { groupId, chatType, actualChatType });
          // Could show error modal here if needed
          return;
        }
                result = await groupService.clearChat(groupId);
              } else {
        // Private chat
        if (!contactEmail) {
          console.error('❌ Contact email is missing!', { contactEmail, chatType, actualChatType });
          // Could show error modal here if needed
          return;
        }
                result = await contactsService.clearChat(contactEmail);
              }
              
              if (result.success) {
        // Fallback: If socket event doesn't arrive within 2 seconds, manually clear
        setTimeout(() => {
          if (actualChatType === 'group') {
            // For group chat, we need to reload via socket
            if (groupId) {
              socketService.emit(SOCKET_EVENTS.JOIN_GROUP, {
                groupId,
                userEmail,
              });
            }
          } else {
            // For private chat, clear messages and reload
            if (contactEmail) {
              // Clear messages immediately as fallback
              // The socket event should handle this, but if it doesn't, this will
              socketService.emit(SOCKET_EVENTS.JOIN_CHAT, {
                userEmail,
                contactEmail,
              });
            }
          }
        }, 2000);
      } else {
        console.error('❌ API call failed:', result);
        // Could show error modal here if needed
              }
            } catch (error) {
      console.error('❌ Error clearing chat:', error);
      // Could show error modal here if needed
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
    
    // Ensure message is a string - CRITICAL: Prevent React error "Objects are not valid as a React child"
    let messageText;
    if (typeof item.message === 'string') {
      messageText = item.message;
    } else if (item.message && typeof item.message === 'object') {
      // If message is an object, extract the message text
      messageText = item.message.message || item.message.text || JSON.stringify(item.message);
      console.warn('Message is an object, extracting text:', messageText);
    } else {
      messageText = String(item.message || '');
    }
    
    return (
      <MessageItem
        key={index}
        message={messageText}
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
        isDeleted={item.isDeleted || false}
        editedAt={item.editedAt || null}
        isCallMessage={item.isCallMessage || false}
        callRecord={item.callRecord || null}
        isBillSplit={item.isBillSplit || false}
        billSplitData={item.billSplitData || null}
        onMarkAsPaid={async (billSplitId) => {
          try {
            const result = await billSplitService.markAsPaid(billSplitId);
            if (result.success) {
              // Socket will handle the update
            }
          } catch (error) {
            console.error('Error marking as paid:', error);
          }
        }}
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
            // Call API to mark ALL unread messages as read (including reminder messages)
            // The backend will handle marking all messages where receiverEmail === userEmail
            // This includes both regular messages from contact AND reminder messages from user
            contactsService.markMessagesAsRead(contactEmail);
            // Also send socket read receipts for individual messages
            markPrivateMessagesAsRead();
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

  // Call handlers
  const handleAudioCall = async () => {
    try {
      if (chatType === 'group' && groupId) {
        await initiateCallHook(null, groupId, 'audio');
      } else if (contactEmail) {
        await initiateCallHook(contactEmail, null, 'audio');
      }
    } catch (error) {
      console.error('Error initiating audio call:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  };

  const handleVideoCall = async () => {
    try {
      if (chatType === 'group' && groupId) {
        await initiateCallHook(null, groupId, 'video');
      } else if (contactEmail) {
        await initiateCallHook(contactEmail, null, 'video');
      }
    } catch (error) {
      console.error('Error initiating video call:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  };

  const handleCallHistory = () => {
    setShowCallHistory(true);
  };

  const handleCallFromHistory = async (type, targetEmail, targetGroupId) => {
    try {
      setShowCallHistory(false);
      if (targetGroupId) {
        await initiateCallHook(null, targetGroupId, type);
      } else if (targetEmail) {
        await initiateCallHook(targetEmail, null, type);
      }
    } catch (error) {
      console.error('Error calling from history:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  };

  // Render chat content (only chat tab content, other tabs are separate routes)
  const renderChatContent = () => {
    // Show recent chats if no contact or group selected
    if (!contactEmail && !groupId) {
      return (
        <>
          <RecentChats
            contacts={contacts} // Use contacts from getRecentChats (not archived, with messages)
            groups={groups} // Use groups from getRecentChats (not archived, with messages)
            onSelectContact={handleSelectContact}
            onSelectGroup={handleSelectGroup}
            onNewChat={handleNewChat}
            onCreateGroup={handleCreateGroup}
            onSaveContact={handleSaveContact}
            onInvite={handleInvite}
            onContactsUpdate={loadContacts}
            onGroupsUpdate={loadContacts}
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
          onEdit={handleActionBarEdit}
          canEdit={selectedMessages.length > 0 && (() => {
            const msg = selectedMessages[0];
            // Can edit if: message is sent by user, not deleted, and not read
            if (!msg.isSent) return false;
            if (msg.isDeleted) return false;
            // For private messages: check if status is not 'read'
            if (chatType === 'private') {
              return msg.status !== 'read';
            }
            // For group messages: check if status is not 'read' AND no one else has read it
            if (chatType === 'group' && currentGroup) {
              // If status is 'read', cannot edit
              if (msg.status === 'read') return false;
              // Check if anyone else has read it
              const readByOthers = (msg.readBy || []).filter(email => email !== userEmail);
              return readByOthers.length === 0;
            }
            return false;
          })()}
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
          {loadingMessages && messages.length === 0 ? (
            <View style={styles.messagesLoadingContainer}>
              <Text style={[styles.messagesLoadingText, { color: colors.textSecondary }]}>
                Loading messages...
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => {
                // Use messageId for stable keys - better for React reconciliation
                if (item.messageId || item._id) {
                  return `message-${item.messageId || item._id}`;
                }
                // Fallback for messages without ID - use timestamp and index for uniqueness
                const messageStr = typeof item.message === 'string' 
                  ? item.message 
                  : (item.message?.message || item.message?.text || String(item.message || ''));
                return `message-${index}-${item.timestamp}-${item.senderEmail}-${messageStr.substring(0, 10)}`;
              }}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => {
                // Use requestAnimationFrame for better timing
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  }, 100);
                });
              }}
              showsVerticalScrollIndicator={false}
              inverted={false}
              removeClippedSubviews={false}
              maxToRenderPerBatch={15}
              updateCellsBatchingPeriod={50}
              initialNumToRender={15}
              windowSize={10}
            />
          )}
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
          editingMessage={editingMessage}
          onCancelEdit={() => {
            setEditingMessage(null);
            setInputMessage('');
          }}
          onBillSplitPress={() => {
            if (chatType === 'private' && contactEmail) {
              setShowBillSplitModal(true);
            } else if (chatType === 'group' && groupId) {
              setShowBillSplitModal(true);
            }
          }}
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
          onEdit={handleEditMessage}
          canEdit={selectedMessage && (() => {
            const msg = selectedMessage;
            // Can edit if: message is sent by user, not deleted, and not read
            if (!msg.isSent) return false;
            if (msg.isDeleted) return false;
            // For private messages: check if status is not 'read'
            if (chatType === 'private') {
              return msg.status !== 'read';
            }
            // For group messages: check if status is not 'read' AND no one else has read it
            if (chatType === 'group' && currentGroup) {
              // If status is 'read', cannot edit
              if (msg.status === 'read') return false;
              // Check if anyone else has read it
              const readByOthers = (msg.readBy || []).filter(email => email !== userEmail);
              return readByOthers.length === 0;
            }
            return false;
          })()}
        />

        {currentGroup && (
          <GroupInfoModal
            visible={showGroupInfoModal}
            onClose={() => setShowGroupInfoModal(false)}
            group={currentGroup}
            userEmail={userEmail}
            onGroupUpdated={handleGroupUpdated}
            onExitGroup={handleExitGroup}
            onClearChat={handleClearChat}
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
            onClearChat={handleClearChat}
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
  };

  // Show recent chats if no contact or group selected
  if (!contactEmail && !groupId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <GLoader visible={loadingContacts} message="Loading contacts..." />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ChatHeader 
            username={getUsernameFromEmail(userEmail)} 
            isOnline={actualOnlineStatus}
            hideUsername={true}
            onStatusToggle={handleStatusToggle}
            onProfilePress={onProfilePress}
            onSettingsPress={onSettingsPress}
            onLogoutPress={onLogoutPress}
            onSidebarPress={() => {
              setShowSidebar(true);
              // Load all contacts when Sidebar (Contacts section) is opened
              loadAllContacts();
            }}
            onShowReferralLink={() => {
              setInviteEmail(null);
              setShowInviteModal(true);
            }}
          />
          
          <Sidebar
            visible={showSidebar}
            onClose={() => setShowSidebar(false)}
            onSelectContact={handleSelectContact}
            contacts={allContacts} // All contacts for Sidebar Contacts section
          />
          
          <View style={styles.contentContainer}>
            {renderChatContent()}
          </View>

          {/* Bottom Tab Bar */}
          <View style={[styles.bottomTabBar, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[styles.tabButton, currentRouteName === 'Chat' && styles.activeTabButton]}
              onPress={() => navigation.navigate('Chat')}
            >
              <Text style={[styles.tabIcon, currentRouteName === 'Chat' && styles.activeTabIcon]}>💬</Text>
              <Text style={[styles.tabLabel, currentRouteName === 'Chat' && styles.activeTabLabel]}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, currentRouteName === 'Feed' && styles.activeTabButton]}
              onPress={() => navigation.navigate('Feed', { userEmail })}
            >
              <Text style={[styles.tabIcon, currentRouteName === 'Feed' && styles.activeTabIcon]}>📰</Text>
              <Text style={[styles.tabLabel, currentRouteName === 'Feed' && styles.activeTabLabel]}>Feed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, currentRouteName === 'Status' && styles.activeTabButton]}
              onPress={() => navigation.navigate('Status', { userEmail })}
            >
              <Text style={[styles.tabIcon, currentRouteName === 'Status' && styles.activeTabIcon]}>📱</Text>
              <Text style={[styles.tabLabel, currentRouteName === 'Status' && styles.activeTabLabel]}>Status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, currentRouteName === 'Call' && styles.activeTabButton]}
              onPress={() => navigation.navigate('Call', { userEmail })}
            >
              <Text style={[styles.tabIcon, currentRouteName === 'Call' && styles.activeTabIcon]}>📞</Text>
              <Text style={[styles.tabLabel, currentRouteName === 'Call' && styles.activeTabLabel]}>Call</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Powered by onlygossips247
            </Text>
          </View>
        </KeyboardAvoidingView>
        
        {/* Incoming/Outgoing Call Screen - Rendered outside KeyboardAvoidingView to ensure it's always on top */}
        {(() => {
          const isOutgoing = callData?.direction === 'outgoing';
          // For incoming calls, use callerEmail to get name
          const incomingCallerName = callData?.direction === 'incoming' 
            ? (callData?.callerEmail?.split('@')[0] || 'Unknown')
            : null;
          const outgoingReceiverName = callData?.direction === 'outgoing'
            ? (callData?.receiverEmail?.split('@')[0] || 'Unknown')
            : null;
          
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
                participantName={callData?.direction === 'outgoing' ? (callData?.receiverEmail?.split('@')[0]) : (callData?.callerEmail?.split('@')[0])}
                participantEmail={callData?.direction === 'outgoing' ? callData?.receiverEmail : callData?.callerEmail}
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
        })()}
      </SafeAreaView>
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
        isOnline={chatType === 'group' ? false : contactOnlineStatus} 
        onProfilePress={onProfilePress}
        onSettingsPress={onSettingsPress}
        onLogoutPress={onLogoutPress}
        onSidebarPress={() => {
          setShowSidebar(true);
          // Load all contacts when Sidebar (Contacts section) is opened
          loadAllContacts();
        }}
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
        onClearChat={handleClearChat}
        onAudioCall={handleAudioCall}
        onVideoCall={handleVideoCall}
        onBillSummaryPress={() => setShowBillSummaryModal(true)}
        onShowReferralLink={() => {
          setInviteEmail(null);
          setShowInviteModal(true);
        }}
      />
      
      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSelectContact={handleSelectContact}
      />
      
      <View style={styles.contentContainer}>
        {renderChatContent()}
      </View>

      {/* Bottom Tab Bar */}
      <View style={[styles.bottomTabBar, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.tabButton, currentRouteName === 'Chat' && styles.activeTabButton]}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'Chat' && styles.activeTabIcon]}>💬</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'Chat' && styles.activeTabLabel]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentRouteName === 'Feed' && styles.activeTabButton]}
          onPress={() => navigation.navigate('Feed', { userEmail })}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'Feed' && styles.activeTabIcon]}>📰</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'Feed' && styles.activeTabLabel]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentRouteName === 'Status' && styles.activeTabButton]}
          onPress={() => navigation.navigate('Status', { userEmail })}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'Status' && styles.activeTabIcon]}>📱</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'Status' && styles.activeTabLabel]}>Status</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentRouteName === 'Call' && styles.activeTabButton]}
          onPress={() => navigation.navigate('Call', { userEmail })}
        >
          <Text style={[styles.tabIcon, currentRouteName === 'Call' && styles.activeTabIcon]}>📞</Text>
          <Text style={[styles.tabLabel, currentRouteName === 'Call' && styles.activeTabLabel]}>Call</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Powered by onlygossips247
        </Text>
      </View>

      {/* Clear Chat Confirmation Modal */}
      <ConfirmationModal
        visible={showClearChatModal}
        title="Clear Chat"
        message="Are you sure you want to clear all messages in this chat? This action cannot be undone."
        confirmText="Clear"
        cancelText="Cancel"
        onConfirm={handleClearChatConfirm}
        onCancel={handleClearChatCancel}
        confirmButtonStyle="destructive"
      />

      {/* Delete Message Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteMessageModal}
        title={messageToDelete && messageToDelete.isSent && !messageToDelete.messageId
          ? "Undo Message" 
          : "Delete Message"}
        message={messageToDelete && messageToDelete.isSent && !messageToDelete.messageId
          ? "This message hasn't been sent to the server yet. Remove it?"
          : "Are you sure you want to delete this message? This will show 'This message is deleted' to all users."}
        confirmText={messageToDelete && messageToDelete.isSent && !messageToDelete.messageId
          ? "Undo"
          : "Delete"}
        cancelText="Cancel"
        onConfirm={handleDeleteMessageConfirm}
        onCancel={handleDeleteMessageCancel}
        confirmButtonStyle="destructive"
      />

      {/* Call History Modal */}
      <CallHistory
        visible={showCallHistory}
        onClose={() => setShowCallHistory(false)}
        userEmail={userEmail}
        contactEmail={contactEmail}
        groupId={groupId}
        isGroup={chatType === 'group'}
        onCallPress={handleCallFromHistory}
      />


      {/* Permission Prompt */}
      <PermissionPrompt
        visible={showPermissionPrompt}
        deviceType={permissionDeviceType}
        onRetry={handlePermissionRetry}
        onCancel={handlePermissionCancel}
      />

      {/* Bill Split Modal */}
      {chatType && (
        <BillSplitModal
          visible={showBillSplitModal}
          onClose={() => setShowBillSplitModal(false)}
          onCreateBill={async (billData) => {
            try {
              const result = await billSplitService.createBillSplit({
                ...billData,
                contactEmail: chatType === 'private' ? contactEmail : null,
                groupId: chatType === 'group' ? groupId : null,
              });
              
              if (result.success) {
                // Message will be sent via socket automatically
                // Just close the modal
                setShowBillSplitModal(false);
              }
            } catch (error) {
              console.error('Error creating bill split:', error);
              Alert.alert('Error', 'Failed to create bill split');
            }
          }}
          userEmail={userEmail}
          contactEmail={contactEmail}
          groupId={groupId}
          groupMembers={currentGroup?.members || []}
        />
      )}

      {/* Bill Summary Modal */}
      {chatType && (
        <BillSummaryModal
          visible={showBillSummaryModal}
          onClose={() => setShowBillSummaryModal(false)}
          userEmail={userEmail}
          contactEmail={contactEmail}
          groupId={groupId}
          roomId={chatType === 'group' 
            ? `group_${groupId}` 
            : (() => {
                const sorted = [userEmail, contactEmail].sort();
                return `chat_${sorted[0]}_${sorted[1]}`;
              })()}
          groupMembers={currentGroup?.members || []}
        />
      )}
    </KeyboardAvoidingView>
    
    {/* Incoming/Outgoing Call Screen - Rendered outside KeyboardAvoidingView to ensure it's always on top */}
      {(() => {
        const isOutgoing = callData?.direction === 'outgoing';
        // For incoming calls, use callerEmail to get name if contactName is not available
        const incomingCallerName = callData?.direction === 'incoming' 
          ? (contactName || callData?.callerEmail?.split('@')[0] || 'Unknown')
          : null;
        const outgoingReceiverName = callData?.direction === 'outgoing'
          ? (contactName || callData?.receiverEmail?.split('@')[0] || 'Unknown')
          : null;
        
        return (
          <IncomingCallScreen
            visible={callState === 'ringing'}
            callerName={incomingCallerName}
            callerEmail={callData?.callerEmail}
            callType={callData?.type || 'audio'}
            isOutgoing={isOutgoing}
            receiverName={outgoingReceiverName}
            receiverEmail={callData?.receiverEmail || contactEmail}
            onAccept={acceptCall}
            onDecline={declineCall}
          />
        );
      })()}

    {/* Active Call Screen - Rendered outside KeyboardAvoidingView to ensure it's always on top */}
      <ActiveCallScreen
        visible={callState === 'active' || callState === 'connecting'}
        participantName={contactName}
        participantEmail={callData?.direction === 'outgoing' ? callData?.receiverEmail : callData?.callerEmail || contactEmail}
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
  messagesLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  messagesLoadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
});

export default ChatScreen;
