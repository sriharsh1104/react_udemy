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
import { useChatScreenSocketEvents } from './hooks/useChatScreenSocketEvents';
import { useChatSearch } from './hooks/useChatSearch';
import styles from './styles';
import ChatHeader from '../../components/chat/ChatHeader';
import MessageItem from '../../components/chat/MessageItem';
import Sidebar, { InviteModal } from '../../components/chat/Sidebar';
import RecentChats from '../../components/chat/RecentChats';
import CreateGroupModal from '../../components/chat/CreateGroupModal';
import ChatSearchBar from '../../components/chat/ChatSearchBar';
import IncomingCallScreen from '../../components/call/IncomingCallScreen';
import ActiveCallScreen from '../../components/call/ActiveCallScreen';
import ChatContent from './components/ChatContent';
import BottomTabBar from './components/BottomTabBar';
import ChatScreenModals from './components/ChatScreenModals';
import contactsService from '../../services/contactsService';
import groupService from '../../services/groupService';
import settingsService from '../../services/settingsService';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
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
  const { messages: privateMessages, typingUser, loadingMessages: loadingPrivateMessages, sendMessage: sendPrivateMessage, sendTyping: sendPrivateTyping, markMessagesAsRead: markPrivateMessagesAsRead, removePendingMessage: removePrivatePendingMessage, updateMessage: updatePrivateMessage, retryMessage: retryPrivateMessage } = useChat(userEmail, contactEmail, () => {});
  const { messages: groupMessages, typingUsers, loadingMessages: loadingGroupMessages, sendMessage: sendGroupMessage, sendTyping: sendGroupTyping, removePendingMessage: removeGroupPendingMessage, updateMessage: updateGroupMessage, retryMessage: retryGroupMessage } = useGroupChat(userEmail, groupId);
  
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
  const retryMessage = chatType === 'group' ? retryGroupMessage : retryPrivateMessage;
  const currentTypingUser = chatType === 'group' ? (typingUsers.length > 0 ? typingUsers[0] : null) : typingUser;
  const actualOnlineStatus = isConnected && !offlineMode;

  // Search functionality - extracted to custom hook
  const {
    handleSearchNext,
    handleSearchPrevious,
    handleSearchChange,
    handleSearchClose,
  } = useChatSearch({
    searchQuery,
    messages,
    searchResults,
    setSearchResults,
    setCurrentSearchIndex,
    currentSearchIndex,
    flatListRef,
    setShowSearchBar,
    setSearchQuery,
  });

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

  // Socket event handlers - extracted to custom hook
  useChatScreenSocketEvents({
    socket,
    userEmail,
    contactEmail,
    chatType,
    contacts,
    groupId,
    setContactEmail,
    setChatType,
    setContactName,
    setContacts,
    setPinnedMessage,
    addNotification,
    clearNotification,
    sendPrivateMessage,
    loadContacts,
    loadPinnedMessage,
    showAlert,
  });
    
  // Track if user is at bottom of chat (for WhatsApp-like auto-scroll behavior)
  const isAtBottomRef = useRef(true);
  
  // Handle scroll position changes from ChatContent
  const handleScrollPositionChange = useCallback((isNearBottom) => {
    isAtBottomRef.current = isNearBottom;
  }, []);
  
  // Auto-scroll to bottom when new message arrives, only if user is at bottom
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current && isAtBottomRef.current) {
      // Small delay to ensure message is rendered
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, messages[messages.length - 1]?.messageId]);
  
  // Initial scroll to bottom when chat opens
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current && (contactEmail || groupId)) {
      // Scroll to bottom when chat first loads
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        isAtBottomRef.current = true;
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [contactEmail, groupId]); // Only when chat changes

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
        onRetry={retryMessage ? (failedMessage) => retryMessage(failedMessage) : undefined}
      />
    );
  }, [userEmail, chatType, currentGroup, groupId, selectedMessages, chatHandlers, getUsernameFromEmail, retryMessage]);

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
        onScrollPositionChange={handleScrollPositionChange}
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

      <ChatScreenModals
        showClearChatModal={showClearChatModal}
        showDeleteMessageModal={showDeleteMessageModal}
        showCallHistory={showCallHistory}
        showPermissionPrompt={showPermissionPrompt}
        showBillSplitModal={showBillSplitModal}
        showBillSummaryModal={showBillSummaryModal}
        showGroupInfoModal={showGroupInfoModal}
        showContactInfoModal={showContactInfoModal}
        showMessageMenu={showMessageMenu}
        showMessageInfoModal={showMessageInfoModal}
        showForwardModal={showForwardModal}
        alertModal={alertModal}
        messageToDelete={messageToDelete}
        forwardMessage={forwardMessage}
        messageInfoMessageId={messageInfoMessageId}
        selectedMessage={selectedMessage}
        currentGroup={currentGroup}
        chatType={chatType}
        contactEmail={contactEmail}
        groupId={groupId}
        userEmail={userEmail}
        contactName={contactName}
        privateMessages={privateMessages}
        handleClearChatConfirm={handleClearChatConfirm}
        setShowClearChatModal={setShowClearChatModal}
        chatHandlers={chatHandlers}
        callHandlers={callHandlers}
        contactHandlers={contactHandlers}
        handleClearChat={handleClearChat}
        setShowCallHistory={setShowCallHistory}
        handlePermissionRetry={handlePermissionRetry}
        handlePermissionCancel={handlePermissionCancel}
        permissionDeviceType={permissionDeviceType}
        setShowBillSplitModal={setShowBillSplitModal}
        setShowBillSummaryModal={setShowBillSummaryModal}
        setShowGroupInfoModal={setShowGroupInfoModal}
        setShowContactInfoModal={setShowContactInfoModal}
        setShowMessageMenu={setShowMessageMenu}
        setSelectedMessage={setSelectedMessage}
        setShowMessageInfoModal={setShowMessageInfoModal}
        setMessageInfoMessageId={setMessageInfoMessageId}
        setShowForwardModal={setShowForwardModal}
        setForwardMessage={setForwardMessage}
        loadMessageInfo={loadMessageInfo}
        showAlert={showAlert}
        hideAlert={hideAlert}
      />
      </KeyboardAvoidingView>
      
      {renderCallScreens()}
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

