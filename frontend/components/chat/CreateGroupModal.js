import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../common/Button';
import contactsService from '../../services/contactsService';
import groupService from '../../services/groupService';
import { showToastFromResponse } from '../../utils/toast';

const CreateGroupModal = ({ visible, onClose, onGroupCreated, contacts: parentContacts = [] }) => {
  const { colors } = useTheme();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  // Use contacts from parent (ChatScreen) instead of loading again
  useEffect(() => {
    if (parentContacts && parentContacts.length > 0) {
      setContacts(parentContacts);
    }
  }, [parentContacts]);

  useEffect(() => {
    if (visible) {
      // No need to load contacts - use from parent
      // loadContacts(); // Removed - using contacts from ChatScreen
    } else {
      // Reset state when modal closes
      setGroupName('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedMembers([]);
    }
  }, [visible]);

  useEffect(() => {
    // Only search when complete email is entered
    if (searchQuery.trim().includes('@') && searchQuery.trim().length >= 5) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Removed loadContacts - using contacts from parent (ChatScreen)
  // This reduces unnecessary API calls

  const searchUsers = async () => {
    setSearching(true);
    const result = await contactsService.searchUsers(searchQuery.trim());
    if (result.success && result.results) {
      setSearchResults(result.results);
    }
    setSearching(false);
  };

  const toggleMember = (email) => {
    setSelectedMembers((prev) => {
      if (prev.includes(email)) {
        return prev.filter(e => e !== email);
      } else {
        return [...prev, email];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showToastFromResponse({
        success: false,
        message: 'Please enter a group name',
      }, { errorTitle: 'Validation Error' });
      return;
    }

    if (selectedMembers.length === 0) {
      showToastFromResponse({
        success: false,
        message: 'Please select at least one member',
      }, { errorTitle: 'Validation Error' });
      return;
    }

    setCreating(true);
    const result = await groupService.createGroup(groupName.trim(), selectedMembers);
    setCreating(false);

    if (result.success) {
      if (onGroupCreated) {
        onGroupCreated(result.group);
      }
      onClose();
    }
  };

  const renderContactItem = ({ item }) => {
    const isSelected = selectedMembers.includes(item.email);
    const name = item.name || item.email.split('@')[0];

    return (
      <TouchableOpacity
        style={[
          styles.contactItem,
          { backgroundColor: colors.receivedMessage, borderColor: colors.divider },
          isSelected && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
        ]}
        onPress={() => toggleMember(item.email)}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.white }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.contactEmail, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        {isSelected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }) => {
    const isSelected = selectedMembers.includes(item.email);
    const name = item.name || item.email.split('@')[0];

    return (
      <TouchableOpacity
        style={[
          styles.contactItem,
          { backgroundColor: colors.receivedMessage, borderColor: colors.divider },
          isSelected && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
        ]}
        onPress={() => toggleMember(item.email)}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.white }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.contactEmail, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        {isSelected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Create Group</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Group Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.divider }]}
                placeholder="Enter group name"
                placeholderTextColor={colors.inputPlaceholder}
                value={groupName}
                onChangeText={setGroupName}
                maxLength={50}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Search & Add Members</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.divider }]}
                placeholder="Enter complete email address..."
                placeholderTextColor={colors.inputPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {searching && (
                <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
              )}
            </View>

            {searchResults.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Search Results</Text>
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item.email}
                  style={styles.list}
                  scrollEnabled={false}
                />
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Contacts ({selectedMembers.length} selected)
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <FlatList
                  data={contacts}
                  renderItem={renderContactItem}
                  keyExtractor={(item) => item.email}
                  style={styles.list}
                  scrollEnabled={false}
                />
              )}
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              disabled={creating}
              style={styles.footerButton}
            />
            <Button
              title="Create Group"
              onPress={handleCreateGroup}
              variant="primary"
              loading={creating}
              disabled={creating || !groupName.trim() || selectedMembers.length === 0}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.md,
  },
  input: {
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    borderWidth: 1,
  },
  loader: {
    marginTop: SPACING.sm,
  },
  list: {
    maxHeight: 200,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  checkmark: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: '#10B981',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    gap: SPACING.md,
  },
  footerButton: {
    flex: 1,
  },
});

export default CreateGroupModal;

