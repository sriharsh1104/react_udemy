/**
 * Custom hook to extract chat screen logic
 * This helps break down the large ChatScreen component
 */

import { useState, useRef, useEffect } from 'react';
import logger from '../../../utils/logger';

export const useChatScreenLogic = (userEmail, socket, isConnected) => {
  // Chat state
  const [chatType, setChatType] = useState(null);
  const [contactEmail, setContactEmail] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const [contactName, setContactName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  
  // UI state
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  
  // Message state
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  
  // Pinned message state
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [loadingPinnedMessage, setLoadingPinnedMessage] = useState(false);
  
  // Modal state
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showMessageInfoModal, setShowMessageInfoModal] = useState(false);
  const [messageInfoMessageId, setMessageInfoMessageId] = useState(null);
  
  // Bill split state
  const [showBillSplitModal, setShowBillSplitModal] = useState(false);
  const [showBillSummaryModal, setShowBillSummaryModal] = useState(false);
  
  // Contacts state
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(null);
  const [contactOnlineStatus, setContactOnlineStatus] = useState(false);
  
  const flatListRef = useRef(null);

  // Load offline mode status
  useEffect(() => {
    const loadOfflineMode = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const saved = await AsyncStorage.getItem('offlineMode');
        if (saved === 'true') {
          setOfflineMode(true);
        }
      } catch (error) {
        logger.error('Error loading offline mode:', error);
      }
    };
    loadOfflineMode();
  }, []);

  return {
    // Chat state
    chatType,
    setChatType,
    contactEmail,
    setContactEmail,
    groupId,
    setGroupId,
    contactName,
    setContactName,
    groupName,
    setGroupName,
    inputMessage,
    setInputMessage,
    
    // UI state
    showSidebar,
    setShowSidebar,
    showCreateGroupModal,
    setShowCreateGroupModal,
    showGroupInfoModal,
    setShowGroupInfoModal,
    showContactInfoModal,
    setShowContactInfoModal,
    currentGroup,
    setCurrentGroup,
    offlineMode,
    setOfflineMode,
    showCallHistory,
    setShowCallHistory,
    
    // Message state
    showMessageMenu,
    setShowMessageMenu,
    selectedMessage,
    setSelectedMessage,
    selectedMessages,
    setSelectedMessages,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    
    // Pinned message state
    pinnedMessage,
    setPinnedMessage,
    loadingPinnedMessage,
    setLoadingPinnedMessage,
    
    // Modal state
    showClearChatModal,
    setShowClearChatModal,
    showDeleteMessageModal,
    setShowDeleteMessageModal,
    messageToDelete,
    setMessageToDelete,
    showMessageInfoModal,
    setShowMessageInfoModal,
    messageInfoMessageId,
    setMessageInfoMessageId,
    
    // Bill split state
    showBillSplitModal,
    setShowBillSplitModal,
    showBillSummaryModal,
    setShowBillSummaryModal,
    
    // Contacts state
    contacts,
    setContacts,
    groups,
    setGroups,
    allContacts,
    setAllContacts,
    loadingContacts,
    setLoadingContacts,
    showInviteModal,
    setShowInviteModal,
    inviteEmail,
    setInviteEmail,
    contactOnlineStatus,
    setContactOnlineStatus,
    
    // Refs
    flatListRef,
  };
};

