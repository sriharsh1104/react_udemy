/**
 * Custom hook for contact and group handlers
 * Extracts contact/group-related logic from ChatScreen
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import logger from '../../../utils/logger';
import contactsService from '../../../services/contactsService';

export const useContactHandlers = ({
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
}) => {
  const handleSelectContact = useCallback(async (selectedContactEmail) => {
    const checkResult = await contactsService.checkUserExists(selectedContactEmail);
    
    if (checkResult.success && checkResult.exists) {
      setChatType('private');
      setContactEmail(selectedContactEmail);
      setGroupId(null);
      setShowSidebar(false);
    } else {
      setInviteEmail(selectedContactEmail);
      setShowInviteModal(true);
      setShowSidebar(false);
    }
  }, [setChatType, setContactEmail, setGroupId, setShowSidebar, setShowInviteModal, setInviteEmail]);

  const handleSelectGroup = useCallback((selectedGroupId) => {
    setChatType('group');
    setGroupId(selectedGroupId);
    setContactEmail(null);
    setShowSidebar(false);
  }, [setChatType, setGroupId, setContactEmail, setShowSidebar]);

  const handleCreateGroup = useCallback(() => {
    setShowCreateGroupModal(true);
  }, [setShowCreateGroupModal]);

  const handleGroupCreated = useCallback(async (group) => {
    if (group && group._id) {
      handleSelectGroup(group._id);
    }
  }, [handleSelectGroup]);

  const handleGroupUpdated = useCallback(async (updatedGroup) => {
    if (updatedGroup && updatedGroup._id) {
      setCurrentGroup(updatedGroup);
      setGroupName(updatedGroup.name);
    }
  }, [setCurrentGroup, setGroupName]);

  const handleExitGroup = useCallback(() => {
    setChatType(null);
    setGroupId(null);
    setCurrentGroup(null);
    setGroupName('');
  }, [setChatType, setGroupId, setCurrentGroup, setGroupName]);

  const handleNewChat = useCallback(() => {
    setShowSidebar(true);
    loadAllContacts();
  }, [setShowSidebar, loadAllContacts]);

  const handleSaveContact = useCallback(async (email) => {
    const result = await contactsService.addContact(email);
    if (result.success) {
      Alert.alert('Success', 'Contact saved successfully');
    } else {
      Alert.alert('Error', result.message || 'Failed to save contact');
    }
  }, []);

  const handleInvite = useCallback((email) => {
    setInviteEmail(email);
    setShowInviteModal(true);
  }, [setInviteEmail, setShowInviteModal]);

  return {
    handleSelectContact,
    handleSelectGroup,
    handleCreateGroup,
    handleGroupCreated,
    handleGroupUpdated,
    handleExitGroup,
    handleNewChat,
    handleSaveContact,
    handleInvite,
  };
};

