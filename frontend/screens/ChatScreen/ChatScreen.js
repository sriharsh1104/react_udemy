/**
 * ChatScreen - Refactored and Optimized
 * Main chat interface component
 * Uses custom hooks to separate concerns and reduce file size
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSocket } from '../../hooks/useSocket';
import { useChat } from '../../hooks/useChat';
import { useGroupChat } from '../../hooks/useGroupChat';
import { useCall } from '../../hooks/useCall';
import { useChatScreenLogic } from './hooks/useChatScreenLogic';
import { useChatHandlers } from './hooks/useChatHandlers';
import { useContactHandlers } from './hooks/useContactHandlers';
import { useCallHandlers } from './hooks/useCallHandlers';
import { useClearChat } from './hooks/useClearChat';
import { useFileUpload } from './hooks/useFileUpload';
import { useActionBarHandlers } from './hooks/useActionBarHandlers';
import { usePinnedMessage } from './hooks/usePinnedMessage';
import socketService from '../../services/socketService';
import { SOCKET_EVENTS } from '../../constants';
import styles from './styles';
import ChatHeader from '../../components/chat/ChatHeader';
import MessageItem from '../../components/chat/MessageItem';
import Sidebar, { InviteModal } from '../../components/chat/Sidebar';
import RecentChats from '../../components/chat/RecentChats';
import CreateGroupModal from '../../components/chat/CreateGroupModal';
import GroupInfoModal from '../../components/chat/GroupInfoModal';
import ContactInfoModal from '../../components/chat/ContactInfoModal';
import MessageActionMenu from '../../components/chat/MessageActionMenu';
import MessageInfoModal from '../../components/chat/MessageInfoModal';
import ForwardContactModal from '../../components/chat/ForwardContactModal';
import ChatSearchBar from '../../components/chat/ChatSearchBar';
// GLoader removed - loader disabled
import CallHistory from '../../components/call/CallHistory';
import IncomingCallScreen from '../../components/call/IncomingCallScreen';
import ActiveCallScreen from '../../components/call/ActiveCallScreen';
import PermissionPrompt from '../../components/call/PermissionPrompt';
import BillSplitModal from '../../components/chat/BillSplitModal';
import BillSummaryModal from '../../components/chat/BillSummaryModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import AlertModal from '../../components/common/AlertModal';
import ChatContent from './components/ChatContent';
import BottomTabBar from './components/BottomTabBar';
import contactsService from '../../services/contactsService';
import groupService from '../../services/groupService';
import settingsService from '../../services/settingsService';
import billSplitService from '../../services/billSplitService';
import fileUploadService from '../../services/fileUploadService';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import encryptionService from '../../services/encryptionService';
import logger from '../../utils/logger';

const ChatScreen = ({ userEmail, onLogout, onProfilePress, onSettingsPress, onLogoutPress, navigation }) => {
  const { colors } = useTheme();
  const { addNotification, clearNotification } = useNotifications();
  const route = useRoute();
  const currentRouteName = route?.name || 'Chat';
  
  // Alert modal state
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'default', // 'default' | 'success' | 'error' | 'warning' | 'info'
  });
  
  const showAlert = useCallback((title, message, type = 'default') => {
    setAlertModal({ visible: true, title, message, type });
  }, []);
  
  const hideAlert = useCallback(() => {
    setAlertModal(prev => ({ ...prev, visible: false }));
  }, []);
  
  // Extract username from email
  const getUsernameFromEmail = useCallback((email) => {
    if (!email) return '';
    return email.split('@')[0];
  }, []);

  // Socket hook
  const { socket, isConnected } = useSocket(userEmail);

  // State management hook - MUST be before useChat/useGroupChat
  const state = useChatScreenLogic(userEmail, socket, isConnected);
  const {
    chatType, setChatType,
    contactEmail, setContactEmail,
    groupId, setGroupId,
    contactName, setContactName,
    groupName, setGroupName,
    inputMessage, setInputMessage,
    showSidebar, setShowSidebar,
    showCreateGroupModal, setShowCreateGroupModal,
    showGroupInfoModal, setShowGroupInfoModal,
    showContactInfoModal, setShowContactInfoModal,
    showSearchBar, setShowSearchBar,
    searchQuery, setSearchQuery,
    searchResults, setSearchResults,
    currentSearchIndex, setCurrentSearchIndex,
    currentGroup, setCurrentGroup,
    contacts, setContacts,
    groups, setGroups,
    allContacts, setAllContacts,
    loadingContacts, setLoadingContacts,
    showInviteModal, setShowInviteModal,
    inviteEmail, setInviteEmail,
    contactOnlineStatus, setContactOnlineStatus,
    showMessageMenu, setShowMessageMenu,
    selectedMessage, setSelectedMessage,
    selectedMessages, setSelectedMessages,
    replyingTo, setReplyingTo,
    editingMessage, setEditingMessage,
    pinnedMessage, setPinnedMessage,
    loadingPinnedMessage, setLoadingPinnedMessage,
    showMessageInfoModal, setShowMessageInfoModal,
    messageInfoMessageId, setMessageInfoMessageId,
    showClearChatModal, setShowClearChatModal,
    showDeleteMessageModal, setShowDeleteMessageModal,
    messageToDelete, setMessageToDelete,
    offlineMode, setOfflineMode,
    showCallHistory, setShowCallHistory,
    showBillSplitModal, setShowBillSplitModal,
    showBillSummaryModal, setShowBillSummaryModal,
    showForwardModal, setShowForwardModal,
    forwardMessage, setForwardMessage,
    flatListRef,
  } = state;

  // Chat hooks - Now contactEmail and groupId are available
  const { messages: privateMessages, typingUser, loadingMessages: loadingPrivateMessages, sendMessage: sendPrivateMessage, sendTyping: sendPrivateTyping, markMessagesAsRead: markPrivateMessagesAsRead, removePendingMessage: removePrivatePendingMessage, updateMessage: updatePrivateMessage } = useChat(userEmail, contactEmail, () => {});
  const { messages: groupMessages, typingUsers, loadingMessages: loadingGroupMessages, sendMessage: sendGroupMessage, sendTyping: sendGroupTyping, removePendingMessage: removeGroupPendingMessage, updateMessage: updateGroupMessage } = useGroupChat(userEmail, groupId);
  
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
  
  // Use appropriate messages based on chat type
  const messages = chatType === 'group' ? groupMessages : privateMessages;
  const loadingMessages = chatType === 'group' ? loadingGroupMessages : loadingPrivateMessages;
  const sendMessage = chatType === 'group' ? sendGroupMessage : sendPrivateMessage;
  const sendTyping = chatType === 'group' ? sendGroupTyping : sendPrivateTyping;
  const updateMessage = chatType === 'group' ? updateGroupMessage : updatePrivateMessage;
  const currentTypingUser = chatType === 'group' ? (typingUsers.length > 0 ? typingUsers[0] : null) : typingUser;
  const actualOnlineStatus = isConnected && !offlineMode;

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results = messages
      .map((msg, index) => ({ msg, index }))
      .filter(({ msg }) => {
        if (msg.isDeleted) return false;
        
        let messageText = '';
        if (typeof msg.message === 'string') {
          try {
            const parsed = JSON.parse(msg.message);
            if (parsed && parsed.type === 'file') {
              messageText = parsed.fileName || parsed.name || '';
            } else {
              messageText = msg.message;
            }
          } catch {
            messageText = msg.message;
          }
        } else {
          messageText = msg.message?.message || msg.message?.text || String(msg.message || '');
        }
        
        return messageText.toLowerCase().includes(query);
      });

    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [searchQuery, messages]);

  // Navigate to search result
  const scrollToSearchResult = useCallback((index) => {
    if (searchResults.length === 0 || index < 0 || index >= searchResults.length) return;
    
    const { index: messageIndex } = searchResults[index];
    setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({
          index: messageIndex,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (error) {
        // Fallback to scrollToOffset if scrollToIndex fails
        flatListRef.current?.scrollToOffset({
          offset: messageIndex * 100, // Approximate height per message
          animated: true,
        });
      }
    }, 100);
  }, [searchResults]);

  const handleSearchNext = useCallback(() => {
    if (currentSearchIndex < searchResults.length - 1) {
      const nextIndex = currentSearchIndex + 1;
      setCurrentSearchIndex(nextIndex);
      scrollToSearchResult(nextIndex);
    }
  }, [currentSearchIndex, searchResults, scrollToSearchResult]);

  const handleSearchPrevious = useCallback(() => {
    if (currentSearchIndex > 0) {
      const prevIndex = currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      scrollToSearchResult(prevIndex);
    }
  }, [currentSearchIndex, scrollToSearchResult]);

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    if (text.trim()) {
      setShowSearchBar(true);
    }
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchQuery('');
    setShowSearchBar(false);
    setSearchResults([]);
    setCurrentSearchIndex(0);
  }, []);

  // Load contacts and groups
  const loadContacts = useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingContacts(true);
    try {
      const recentChatsResult = await contactsService.getRecentChats();
      if (recentChatsResult.success) {
        const allContactsCombined = [...(recentChatsResult.contacts || []), ...(recentChatsResult.archivedContacts || [])];
        setContacts(allContactsCombined);
        const allGroupsCombined = [...(recentChatsResult.groups || []), ...(recentChatsResult.archivedGroups || [])];
        setGroups(allGroupsCombined);
      }
    } catch (error) {
      logger.error('Error loading recent chats:', error);
    } finally {
      if (showLoading) setLoadingContacts(false);
    }
  }, [setContacts, setGroups, setLoadingContacts]);

  const loadAllContacts = useCallback(async () => {
    try {
      const allContactsResult = await contactsService.getContacts();
      if (allContactsResult.success) {
        setAllContacts(allContactsResult.contacts || []);
      }
    } catch (error) {
      logger.error('Error loading all contacts:', error);
    }
  }, [setAllContacts]);
  
  // Load offline mode - use ref to prevent double calls in React 18 dev mode
  const hasLoadedOfflineMode = useRef(false);
  useEffect(() => {
    if (!hasLoadedOfflineMode.current) {
      hasLoadedOfflineMode.current = true;
  const loadOfflineMode = async () => {
    try {
      const result = await settingsService.getOfflineMode();
      if (result.success) {
        setOfflineMode(result.offlineMode || false);
      }
    } catch (error) {
          logger.error('Error loading offline mode:', error);
    }
  };
      loadOfflineMode();
    }
  }, [setOfflineMode]);
  
  const handleStatusToggle = useCallback(async () => {
    try {
      const newOfflineMode = !offlineMode;
      const result = await settingsService.toggleOfflineMode(newOfflineMode);
      if (result.success) {
        setOfflineMode(newOfflineMode);
      }
    } catch (error) {
      logger.error('Error toggling offline mode:', error);
    }
  }, [offlineMode, setOfflineMode]);

  // Initialize on mount - use ref to prevent double calls in React 18 dev mode
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadContacts(true);
    }
  }, [loadContacts]);

  // Chat handlers
  const chatHandlers = useChatHandlers({
    chatType,
    contactEmail,
    groupId,
    inputMessage,
    setInputMessage,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    selectedMessage,
    setSelectedMessage,
    selectedMessages,
    setSelectedMessages,
    sendMessage,
    sendPrivateMessage,
    sendGroupMessage,
    removePrivatePendingMessage,
    removeGroupPendingMessage,
    updateMessage,
    userEmail,
    currentGroup,
    messages,
    setShowMessageMenu,
    setShowDeleteMessageModal,
    messageToDelete,
    setMessageToDelete,
    setShowMessageInfoModal,
    setMessageInfoMessageId,
    setPinnedMessage,
    loadPinnedMessage: () => {}, // Will be set by usePinnedMessage
    showAlert,
  });

  // Contact handlers
  const contactHandlers = useContactHandlers({
    setChatType,
    setContactEmail,
    setGroupId,
    setShowSidebar,
    setShowInviteModal,
    setInviteEmail,
    setShowCreateGroupModal,
    setCurrentGroup,
    setGroupName,
    loadContacts,
    loadAllContacts,
  });

  // Call handlers
  const callHandlers = useCallHandlers({
    chatType,
    contactEmail,
    groupId,
    initiateCallHook,
    setShowCallHistory,
  });

  // Clear chat
  const { handleClearChat, executeClearChat } = useClearChat({
    chatType,
    contactEmail,
    groupId,
    userEmail,
    setShowClearChatModal,
  });

  const handleClearChatConfirm = useCallback(async () => {
    setShowClearChatModal(false);
    const actualChatType = chatType || (groupId ? 'group' : contactEmail ? 'private' : null);
    if (actualChatType) {
      await executeClearChat(actualChatType);
    }
  }, [chatType, groupId, contactEmail, executeClearChat, setShowClearChatModal]);

  // File upload
  const { handleFileSelect } = useFileUpload({
    chatType,
    contactEmail,
    groupId,
    userEmail,
    sendPrivateMessage,
    sendGroupMessage,
  });

  // Pinned message
  const { loadPinnedMessage, handlePinnedMessagePress } = usePinnedMessage({
    chatType,
    groupId,
    pinnedMessage,
    setPinnedMessage,
    loadingPinnedMessage,
    setLoadingPinnedMessage,
    messages,
    flatListRef,
  });

  // Update chatHandlers with loadPinnedMessage
  chatHandlers.loadPinnedMessage = loadPinnedMessage;

  const handleUnpinFromBanner = useCallback(async () => {
    if (!pinnedMessage || !pinnedMessage._id || !groupId) return;
    await chatHandlers.handleUnpinMessage(pinnedMessage._id);
  }, [pinnedMessage, groupId, chatHandlers]);

  // Action bar handlers
  const actionBarHandlers = useActionBarHandlers({
    selectedMessages,
    setSelectedMessages,
    setReplyingTo,
    setEditingMessage,
    setInputMessage,
    setSelectedMessage,
    handleDeleteMessage: chatHandlers.handleDeleteMessage,
    handlePinMessage: chatHandlers.handlePinMessage,
    handleUnpinMessage: chatHandlers.handleUnpinMessage,
    setMessageInfoMessageId,
    setShowMessageInfoModal,
    setShowForwardModal,
    setForwardMessage,
    chatType,
    contactEmail,
    userEmail,
    groupId,
  });

  // Load contact/group info when chat changes
  useEffect(() => {
    if (chatType === 'private' && contactEmail) {
      setContactName(getUsernameFromEmail(contactEmail));
    } else if (chatType === 'group' && groupId) {
      const group = groups.find(g => g._id === groupId);
      if (group) {
        setGroupName(group.name);
        setCurrentGroup(group);
        if (group.unreadCount > 0) {
          groupService.markMessagesAsRead(groupId);
        }
      } else {
        groupService.getGroup(groupId).then(result => {
          if (result.success && result.group) {
            setGroupName(result.group.name);
            setCurrentGroup(result.group);
            if (result.group.unreadCount > 0) {
              groupService.markMessagesAsRead(groupId).then(() => {
                loadContacts(false);
              });
            }
          }
        });
      }
    }
  }, [contactEmail, groupId, chatType, groups, getUsernameFromEmail, setContactName, setGroupName, setCurrentGroup, loadContacts]);

  // Update contact online status
  useEffect(() => {
    if (contactEmail && contacts.length > 0) {
      const contact = contacts.find(c => c.email === contactEmail);
      setContactOnlineStatus(contact?.isOnline || false);
    } else {
      setContactOnlineStatus(false);
    }
  }, [contactEmail, contacts, setContactOnlineStatus]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !userEmail) return;

    const handleAnyPrivateMessage = async (data) => {
      if (data.senderEmail && data.senderEmail !== userEmail) {
        const isViewingThisChat = contactEmail === data.senderEmail && chatType === 'private';
        const senderContact = contacts.find(c => c.email === data.senderEmail);
        const isArchived = senderContact?.isArchived === true;
        
        if (!isViewingThisChat && !isArchived) {
          let messageText = data.message;
          try {
            const parsed = JSON.parse(data.message);
            if (parsed && parsed.encrypted && parsed.iv) {
              messageText = await encryptionService.decryptPrivateMessage(parsed, userEmail, data.senderEmail);
            }
          } catch (error) {
            logger.log('Message not encrypted or parse error:', error);
          }

          let senderName = senderContact?.name || data.senderEmail?.split('@')[0] || 'Unknown';
          const notificationSenderEmail = data.senderEmail;
          
          addNotification({
            senderEmail: notificationSenderEmail,
            senderName: senderName,
            message: messageText,
            timestamp: data.timestamp || new Date(),
            type: 'private',
            onPress: () => {
              setContactEmail(notificationSenderEmail);
              setChatType('private');
              setContactName(senderName);
              clearNotification(notificationSenderEmail);
            },
            onMarkAsRead: async () => {
              await contactsService.markMessagesAsRead(notificationSenderEmail);
              // Immediately reload contacts to update unread count
              loadContacts(false);
            },
            onReply: async (replyMessage) => {
              if (replyMessage && replyMessage.trim()) {
                try {
                  const messageText = replyMessage.trim();
                  const currentSocket = socketService.getSocket();
                  if (!currentSocket || !currentSocket.connected) {
                    showAlert('Connection Error', 'Not connected to server. Please check your connection.', 'error');
                    return;
                  }
                  
                  socketService.emit(SOCKET_EVENTS.LOGIN, { email: userEmail });
                  socketService.emit(SOCKET_EVENTS.JOIN_CHAT, {
                    userEmail: userEmail,
                    contactEmail: notificationSenderEmail,
                  });
                  
                  await new Promise(resolve => setTimeout(resolve, 300));
                  
                  const isViewingThisChat = contactEmail === notificationSenderEmail && chatType === 'private';
                  
                  if (isViewingThisChat) {
                    await sendPrivateMessage(messageText);
                  } else {
                    const encryptedData = await encryptionService.encryptPrivateMessage(
                      messageText,
                      userEmail,
                      notificationSenderEmail
                    );
                    const encryptedMessage = JSON.stringify(encryptedData);
                    
                    if (!currentSocket || !currentSocket.connected) {
                      throw new Error('Socket disconnected before sending message');
                    }
                    
                    socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
                      message: encryptedMessage,
                      contactEmail: notificationSenderEmail,
                      senderEmail: userEmail,
                    });
                    
                    socketService.emit(SOCKET_EVENTS.TYPING, {
                      contactEmail: notificationSenderEmail,
                      isTyping: false,
                    });
                  }
                  
                  clearNotification(notificationSenderEmail);
                } catch (error) {
                  logger.error('Error sending reply:', error);
                  showAlert('Error', `Failed to send message: ${error.message || 'Please try again.'}`, 'error');
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
  }, [socket, userEmail, contactEmail, chatType, contacts, addNotification, clearNotification, sendPrivateMessage, setContactEmail, setChatType, setContactName, loadContacts]);

  // Socket events for contacts/groups updates
  useEffect(() => {
    if (!socket || !userEmail) return;

    const handleContactsUpdated = () => {
      loadContacts(false);
    };

    const handleGroupsUpdated = () => {
      loadContacts(false);
    };

    const handleContactOnlineStatus = (data) => {
      if (data && data.contactEmail) {
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
  }, [socket, userEmail, loadContacts, setContacts]);

  // Pinned message socket events
  useEffect(() => {
    if (!socket || chatType !== 'group' || !groupId) return;

    const handleMessagePinned = async (data) => {
      if (data.groupId === groupId) {
        await loadPinnedMessage();
      }
    };

    const handleMessageUnpinned = (data) => {
      if (data.groupId === groupId) {
        setPinnedMessage(null);
      }
    };

    socket.on('messagePinned', handleMessagePinned);
    socket.on('messageUnpinned', handleMessageUnpinned);

    return () => {
      socket.off('messagePinned', handleMessagePinned);
      socket.off('messageUnpinned', handleMessageUnpinned);
    };
  }, [socket, chatType, groupId, loadPinnedMessage, setPinnedMessage]);
    
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      });
    }
  }, [messages.length, messages[messages.length - 1]?.messageId]);

  // Mark messages as read
  const hasMarkedAsRead = useRef(false);
  useEffect(() => {
    if (contactEmail && chatType === 'private' && markPrivateMessagesAsRead) {
      hasMarkedAsRead.current = false;
      clearNotification(contactEmail);
    }
  }, [contactEmail, chatType, clearNotification]);
  
  useEffect(() => {
    if (contactEmail && chatType === 'private' && markPrivateMessagesAsRead && !hasMarkedAsRead.current) {
      const contact = contacts.find(c => c.email === contactEmail);
      const hasUnreadMessages = contact && contact.unreadCount > 0;
      
      if (hasUnreadMessages) {
        const timer = setTimeout(() => {
          if (!hasMarkedAsRead.current) {
            contactsService.markMessagesAsRead(contactEmail);
            markPrivateMessagesAsRead();
            hasMarkedAsRead.current = true;
          }
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        hasMarkedAsRead.current = true;
        }
    }
  }, [contactEmail, chatType, markPrivateMessagesAsRead, messages.length, contacts]);

  // Render message item
  const renderMessage = useCallback(({ item, index }) => {
    const isSent = item.isSent || item.senderEmail === userEmail;
    const senderName = item.senderEmail ? getUsernameFromEmail(item.senderEmail) : 'Unknown';
    const showSenderName = chatType === 'group' && !isSent;
    const isCreator = chatType === 'group' && currentGroup && currentGroup.createdBy === userEmail;
    const isPinned = item.isPinned || false;
    const isSelected = selectedMessages.some(
      (msg) => (msg.messageId || msg._id) === (item.messageId || item._id)
    );
    
    let messageStatus = item.status || 'sent';
    if (chatType === 'group' && isSent && currentGroup && item.readBy) {
      const allMembers = currentGroup.members || [];
      const readBy = item.readBy || [];
      const totalMembers = allMembers.length;
      const readCount = readBy.length;
      
      if (readCount >= totalMembers) {
        messageStatus = 'read';
      } else if (readCount > 1) {
        messageStatus = 'delivered';
      } else {
        messageStatus = 'sent';
      }
    }
    
    let messageText;
    if (typeof item.message === 'string') {
      messageText = item.message;
    } else if (item.message && typeof item.message === 'object') {
      messageText = item.message.message || item.message.text || JSON.stringify(item.message);
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
        onPin={chatHandlers.handlePinMessage}
        onUnpin={chatHandlers.handleUnpinMessage}
        groupId={chatType === 'group' ? groupId : null}
        onSelect={chatHandlers.handleMessageSelect}
        isSelected={isSelected}
        onMenuPress={chatHandlers.handleMenuPress}
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
            logger.error('Error marking as paid:', error);
          }
        }}
      />
    );
  }, [userEmail, chatType, currentGroup, groupId, selectedMessages, chatHandlers, getUsernameFromEmail]);

  // Load message info
  const loadMessageInfo = useCallback(async (messageId) => {
    if (chatType === 'group') {
      return await groupService.getMessageInfo(messageId);
      } else {
      return await contactsService.getMessageInfo(messageId);
    }
  }, [chatType]);

  // Handle typing
  const handleTyping = useCallback((text) => {
    setInputMessage(text);
    sendTyping(text.length > 0);
  }, [setInputMessage, sendTyping]);

  // Render chat content
  const renderChatContent = useCallback(() => {
    if (!contactEmail && !groupId) {
      return (
        <>
          <RecentChats
            contacts={contacts}
            groups={groups}
            onSelectContact={contactHandlers.handleSelectContact}
            onSelectGroup={contactHandlers.handleSelectGroup}
            onNewChat={contactHandlers.handleNewChat}
            onCreateGroup={contactHandlers.handleCreateGroup}
            onSaveContact={contactHandlers.handleSaveContact}
            onInvite={contactHandlers.handleInvite}
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
            onGroupCreated={contactHandlers.handleGroupCreated}
            contacts={contacts}
          />
        </>
      );
    }

    return (
      <ChatContent
        messages={messages}
        loadingMessages={loadingMessages}
        flatListRef={flatListRef}
        renderMessage={renderMessage}
        currentTypingUser={currentTypingUser}
        inputMessage={inputMessage}
        handleTyping={handleTyping}
        handleSendMessage={chatHandlers.handleSendMessage}
        handleFileSelect={handleFileSelect}
          userEmail={userEmail}
          replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
          editingMessage={editingMessage}
        setEditingMessage={setEditingMessage}
        setInputMessage={setInputMessage}
        chatType={chatType}
        contactEmail={contactEmail}
        groupId={groupId}
        setShowBillSplitModal={setShowBillSplitModal}
        selectedMessages={selectedMessages}
        handleMessageSelect={chatHandlers.handleMessageSelect}
        handleMenuPress={chatHandlers.handleMenuPress}
        handlePinMessage={chatHandlers.handlePinMessage}
        handleUnpinMessage={chatHandlers.handleUnpinMessage}
        handleActionBarCopy={actionBarHandlers.handleActionBarCopy}
        handleActionBarReply={actionBarHandlers.handleActionBarReply}
        handleActionBarForward={actionBarHandlers.handleActionBarForward}
        handleActionBarPin={actionBarHandlers.handleActionBarPin}
        handleActionBarUnpin={actionBarHandlers.handleActionBarUnpin}
        handleActionBarDelete={actionBarHandlers.handleActionBarDelete}
        handleActionBarInfo={actionBarHandlers.handleActionBarInfo}
        handleActionBarClose={actionBarHandlers.handleActionBarClose}
        handleActionBarEdit={actionBarHandlers.handleActionBarEdit}
        canEditMessage={actionBarHandlers.canEditMessage}
        pinnedMessage={pinnedMessage}
        handlePinnedMessagePress={handlePinnedMessagePress}
        handleUnpinFromBanner={handleUnpinFromBanner}
        currentGroup={currentGroup}
        colors={colors}
      />
    );
  }, [
    contactEmail, groupId, contacts, groups, showInviteModal, inviteEmail, showCreateGroupModal,
    messages, loadingMessages, flatListRef, renderMessage, currentTypingUser, inputMessage,
    handleTyping, chatHandlers, handleFileSelect, userEmail, replyingTo, editingMessage,
    selectedMessages, actionBarHandlers, pinnedMessage, handlePinnedMessagePress,
    handleUnpinFromBanner, currentGroup, colors, contactHandlers, loadContacts,
    setShowInviteModal, setInviteEmail, setShowCreateGroupModal, setShowBillSplitModal,
  ]);

  // Render call screens
  const renderCallScreens = useCallback(() => {
    const isOutgoing = callData?.direction === 'outgoing';
    const incomingCallerName = callData?.direction === 'incoming' 
      ? (contactName || callData?.callerEmail?.split('@')[0] || 'Unknown')
      : null;
    const outgoingReceiverName = callData?.direction === 'outgoing'
      ? (contactName || callData?.receiverEmail?.split('@')[0] || 'Unknown')
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
          receiverEmail={callData?.receiverEmail || contactEmail}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
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
      </>
    );
  }, [callState, callData, contactName, contactEmail, callDuration, localStream, remoteStream, acceptCall, declineCall, endCall, toggleMute, toggleSpeaker, toggleVideo, isMuted, isSpeakerOn, isVideoOn]);

  // Main render - no contact/group selected
  if (!contactEmail && !groupId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Loader disabled - removed to prevent stuck loader */}
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
            onSelectContact={contactHandlers.handleSelectContact}
            contacts={allContacts}
          />
          
          <View style={styles.contentContainer}>
            {renderChatContent()}
          </View>

          <BottomTabBar
            currentRouteName={currentRouteName}
            navigation={navigation}
            colors={colors}
          />

          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Powered by onlygossips247
            </Text>
          </View>
        </KeyboardAvoidingView>
        
        {renderCallScreens()}
      </SafeAreaView>
    );
  }

  // Main render - chat selected
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
        onSearchPress={() => setShowSearchBar(true)}
          onAudioCall={callHandlers.handleAudioCall}
          onVideoCall={callHandlers.handleVideoCall}
        onBillSummaryPress={() => setShowBillSummaryModal(true)}
        onShowReferralLink={() => {
          setInviteEmail(null);
          setShowInviteModal(true);
        }}
      />

      {/* Search Bar */}
      <ChatSearchBar
        visible={showSearchBar && (chatType === 'private' || chatType === 'group')}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClose={handleSearchClose}
        currentIndex={currentSearchIndex}
        totalResults={searchResults.length}
        onPrevious={handleSearchPrevious}
        onNext={handleSearchNext}
        colors={colors}
      />
      
      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
          onSelectContact={contactHandlers.handleSelectContact}
      />
      
      <View style={styles.contentContainer}>
        {renderChatContent()}
      </View>

        <BottomTabBar
          currentRouteName={currentRouteName}
          navigation={navigation}
          colors={colors}
        />

      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Powered by onlygossips247
        </Text>
      </View>

      <ConfirmationModal
        visible={showClearChatModal}
        title="Clear Chat"
        message="Are you sure you want to clear all messages in this chat? This action cannot be undone."
        confirmText="Clear"
        cancelText="Cancel"
        onConfirm={handleClearChatConfirm}
          onCancel={() => setShowClearChatModal(false)}
        confirmButtonStyle="destructive"
      />

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
          onConfirm={chatHandlers.handleDeleteMessageConfirm}
          onCancel={chatHandlers.handleDeleteMessageCancel}
        confirmButtonStyle="destructive"
      />

      <CallHistory
        visible={showCallHistory}
        onClose={() => setShowCallHistory(false)}
        userEmail={userEmail}
        contactEmail={contactEmail}
        groupId={groupId}
        isGroup={chatType === 'group'}
          onCallPress={callHandlers.handleCallFromHistory}
      />

      <PermissionPrompt
        visible={showPermissionPrompt}
        deviceType={permissionDeviceType}
        onRetry={handlePermissionRetry}
        onCancel={handlePermissionCancel}
      />

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
                setShowBillSplitModal(false);
              }
            } catch (error) {
                logger.error('Error creating bill split:', error);
              showAlert('Error', 'Failed to create bill split', 'error');
            }
          }}
          userEmail={userEmail}
          contactEmail={contactEmail}
          groupId={groupId}
          groupMembers={currentGroup?.members || []}
        />
      )}

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

        {currentGroup && (
          <GroupInfoModal
            visible={showGroupInfoModal}
            onClose={() => setShowGroupInfoModal(false)}
            group={currentGroup}
            userEmail={userEmail}
            onGroupUpdated={contactHandlers.handleGroupUpdated}
            onExitGroup={contactHandlers.handleExitGroup}
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
            onSelectGroup={contactHandlers.handleSelectGroup}
            messages={privateMessages}
            onClearChat={handleClearChat}
          />
        )}

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
          onDelete={chatHandlers.handleDeleteMessage}
          onForward={() => {
            setForwardMessage(selectedMessage);
            setShowForwardModal(true);
            setShowMessageMenu(false);
          }}
          onReply={chatHandlers.handleReplyMessage}
          onPin={() => selectedMessage?.messageId && chatHandlers.handlePinMessage(selectedMessage.messageId)}
          onUnpin={() => selectedMessage?.messageId && chatHandlers.handleUnpinMessage(selectedMessage.messageId)}
          onCopy={chatHandlers.handleCopyMessage}
          onInfo={chatHandlers.handleInfoMessage}
          onEdit={chatHandlers.handleEditMessage}
          canEdit={selectedMessage && (() => {
            const msg = selectedMessage;
            if (!msg.isSent) return false;
            if (msg.isDeleted) return false;
            
            // Check if message is a file message - file messages cannot be edited
            try {
              const messageStr = typeof msg.message === 'string' 
                ? msg.message 
                : (msg.message?.message || msg.message?.text || String(msg.message || ''));
              const parsed = JSON.parse(messageStr);
              if (parsed && parsed.type === 'file') {
                return false; // File messages cannot be edited
              }
            } catch {
              // Not a JSON message, proceed with normal check
            }
            
            if (chatType === 'private') {
              return msg.status !== 'read';
            }
            if (chatType === 'group' && currentGroup) {
              if (msg.status === 'read') return false;
              const readByOthers = (msg.readBy || []).filter(email => email !== userEmail);
              return readByOthers.length === 0;
            }
            return false;
          })()}
        />

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

        <ForwardContactModal
          visible={showForwardModal}
          onClose={() => {
            setShowForwardModal(false);
            setForwardMessage(null);
          }}
          onSelectContacts={async (targets) => {
            if (!forwardMessage || !targets || targets.length === 0) return;
            
            try {
              const messageToForward = forwardMessage.message;
              let successCount = 0;
              let errorCount = 0;
              
              // Helper function to forward message to a single target
              const forwardToTarget = async (target) => {
                try {
                  // Check if it's a file message
                  try {
                    const parsed = JSON.parse(messageToForward);
                    if (parsed && parsed.type === 'file') {
                      // Check if file exists locally
                      const localUri = await fileUploadService.getLocalFileUri(parsed.fileId, parsed.fileName);
                      
                      if (localUri) {
                        // File exists locally, re-upload from cache
                        const uploadResult = await fileUploadService.uploadFileFromLocal(
                          localUri,
                          parsed.fileName,
                          parsed.fileType,
                          userEmail
                        );
                        
                        if (uploadResult.success && uploadResult.fileId) {
                          const fileMessage = JSON.stringify({
                            type: 'file',
                            fileId: uploadResult.fileId,
                            fileName: uploadResult.fileName || parsed.fileName,
                            fileType: uploadResult.fileType || parsed.fileType,
                            fileSize: uploadResult.fileSize || parsed.fileSize || 0,
                            localUri: uploadResult.localUri || null,
                          });
                          
                          // Send to selected contact/group
                          if (target.type === 'private' && target.contactEmail) {
                            const encryptedData = await encryptionService.encryptPrivateMessage(
                              fileMessage,
                              userEmail,
                              target.contactEmail
                            );
                            socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
                              message: JSON.stringify(encryptedData),
                              contactEmail: target.contactEmail,
                              senderEmail: userEmail,
                            });
                            successCount++;
                          } else if (target.type === 'group' && target.groupId) {
                            socketService.emit(SOCKET_EVENTS.GROUP_MESSAGE, {
                              message: fileMessage,
                              groupId: target.groupId,
                              senderEmail: userEmail,
                            });
                            successCount++;
                          }
                        } else {
                          errorCount++;
                        }
                      } else {
                        // File doesn't exist locally, forward the fileId (receiver will download)
                        if (target.type === 'private' && target.contactEmail) {
                          const encryptedData = await encryptionService.encryptPrivateMessage(
                            messageToForward,
                            userEmail,
                            target.contactEmail
                          );
                          socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
                            message: JSON.stringify(encryptedData),
                            contactEmail: target.contactEmail,
                            senderEmail: userEmail,
                          });
                          successCount++;
                        } else if (target.type === 'group' && target.groupId) {
                          socketService.emit(SOCKET_EVENTS.GROUP_MESSAGE, {
                            message: messageToForward,
                            groupId: target.groupId,
                            senderEmail: userEmail,
                          });
                          successCount++;
                        }
                      }
                    } else {
                      // Regular text message
                      if (target.type === 'private' && target.contactEmail) {
                        const encryptedData = await encryptionService.encryptPrivateMessage(
                          messageToForward,
                          userEmail,
                          target.contactEmail
                        );
                        socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
                          message: JSON.stringify(encryptedData),
                          contactEmail: target.contactEmail,
                          senderEmail: userEmail,
                        });
                        successCount++;
                      } else if (target.type === 'group' && target.groupId) {
                        socketService.emit(SOCKET_EVENTS.GROUP_MESSAGE, {
                          message: messageToForward,
                          groupId: target.groupId,
                          senderEmail: userEmail,
                        });
                        successCount++;
                      }
                    }
                  } catch {
                    // Not JSON, treat as regular text
                    if (target.type === 'private' && target.contactEmail) {
                      const encryptedData = await encryptionService.encryptPrivateMessage(
                        messageToForward,
                        userEmail,
                        target.contactEmail
                      );
                      socketService.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, {
                        message: JSON.stringify(encryptedData),
                        contactEmail: target.contactEmail,
                        senderEmail: userEmail,
                      });
                      successCount++;
                    } else if (target.type === 'group' && target.groupId) {
                      socketService.emit(SOCKET_EVENTS.GROUP_MESSAGE, {
                        message: messageToForward,
                        groupId: target.groupId,
                        senderEmail: userEmail,
                      });
                      successCount++;
                    }
                  }
                } catch (error) {
                  logger.error(`Error forwarding to ${target.type === 'private' ? target.contactEmail : target.groupName}:`, error);
                  errorCount++;
                }
              };
              
              // Forward to all selected targets
              await Promise.all(targets.map(target => forwardToTarget(target)));
              
              setShowForwardModal(false);
              setForwardMessage(null);
              
              if (errorCount === 0) {
                showAlert('Success', `Message forwarded to ${successCount} ${successCount === 1 ? 'contact' : 'contacts'} successfully`, 'success');
              } else {
                showAlert(
                  'Partial Success', 
                  `Message forwarded to ${successCount} ${successCount === 1 ? 'contact' : 'contacts'}, ${errorCount} ${errorCount === 1 ? 'failed' : 'failed'}`,
                  'warning'
                );
              }
            } catch (error) {
              logger.error('Error forwarding message:', error);
              showAlert('Error', 'Failed to forward message', 'error');
            }
          }}
          message={forwardMessage?.message || ''}
        />
      </KeyboardAvoidingView>
      
      {renderCallScreens()}
      
      {/* Alert Modal */}
      <AlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={hideAlert}
      />
      </SafeAreaView>
  );
};

ChatScreen.propTypes = {
  userEmail: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired,
  onProfilePress: PropTypes.func.isRequired,
  onSettingsPress: PropTypes.func.isRequired,
  onLogoutPress: PropTypes.func.isRequired,
  navigation: PropTypes.object.isRequired,
};

export default ChatScreen;

