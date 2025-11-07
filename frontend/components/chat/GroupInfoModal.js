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
  Alert,
} from 'react-native';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../common/Button';
import contactsService from '../../services/contactsService';
import groupService from '../../services/groupService';
import { showToastFromResponse } from '../../utils/toast';

const GroupInfoModal = ({ visible, onClose, group, userEmail, onGroupUpdated, onExitGroup }) => {
  const { colors } = useTheme();
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (visible && group) {
      loadGroupDetails();
    } else {
      setGroupDetails(null);
      setShowAddMember(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [visible, group]);

  useEffect(() => {
    // Only search when complete email is entered
    if (showAddMember && searchQuery.trim().includes('@') && searchQuery.trim().length >= 5) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, showAddMember]);

  const loadGroupDetails = async () => {
    if (!group || !group._id) return;
    
    setLoading(true);
    const result = await groupService.getGroup(group._id);
    if (result.success && result.group) {
      setGroupDetails(result.group);
    }
    setLoading(false);
  };

  const searchUsers = async () => {
    setSearching(true);
    const result = await contactsService.searchUsers(searchQuery.trim());
    if (result.success && result.results) {
      // Filter out users who are already members
      const memberEmails = groupDetails?.members?.map(m => m.email) || [];
      const filtered = result.results.filter(r => !memberEmails.includes(r.email));
      setSearchResults(filtered);
    }
    setSearching(false);
  };

  const handleAddMember = async (email) => {
    if (!groupDetails || !groupDetails._id) return;

    setAddingMember(true);
    const result = await groupService.addMembers(groupDetails._id, [email]);
    setAddingMember(false);

    if (result.success) {
      showToastFromResponse(result, { successTitle: 'Member Added' });
      await loadGroupDetails();
      if (onGroupUpdated) {
        onGroupUpdated(result.group);
      }
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleExitGroup = async () => {
    if (!groupDetails || !groupDetails._id) return;

    Alert.alert(
      'Exit Group',
      'Are you sure you want to exit this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: async () => {
            setExiting(true);
            const result = await groupService.removeMember(groupDetails._id, userEmail);
            setExiting(false);

            if (result.success) {
              showToastFromResponse(result, { successTitle: 'Exited Group' });
              if (onExitGroup) {
                onExitGroup();
              }
              onClose();
            }
          },
        },
      ]
    );
  };

  const getUsernameFromEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  const isCreator = groupDetails?.createdBy === userEmail;

  const renderMemberItem = ({ item }) => {
    const name = item.name || getUsernameFromEmail(item.email);
    const isCurrentUser = item.email === userEmail;
    const isCreatorMember = item.email === groupDetails?.createdBy;

    return (
      <View style={[styles.memberItem, { backgroundColor: colors.receivedMessage, borderColor: colors.divider }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.white }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={[styles.memberName, { color: colors.text }]}>{name}</Text>
            {isCreatorMember && (
              <Text style={[styles.creatorBadge, { color: colors.primary }]}>👑 Creator</Text>
            )}
            {isCurrentUser && (
              <Text style={[styles.youBadge, { color: colors.textSecondary }]}>(You)</Text>
            )}
          </View>
          <Text style={[styles.memberEmail, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
      </View>
    );
  };

  const renderSearchResult = ({ item }) => {
    const name = item.name || getUsernameFromEmail(item.email);
    const isAlreadyMember = groupDetails?.members?.some(m => m.email === item.email);

    return (
      <TouchableOpacity
        style={[
          styles.searchResultItem,
          { backgroundColor: colors.receivedMessage, borderColor: colors.divider },
          isAlreadyMember && { opacity: 0.5 }
        ]}
        onPress={() => !isAlreadyMember && handleAddMember(item.email)}
        disabled={isAlreadyMember || addingMember}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.white }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.memberEmail, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        {isAlreadyMember ? (
          <Text style={[styles.alreadyMemberText, { color: colors.textSecondary }]}>Already member</Text>
        ) : (
          <Button
            title="Add"
            onPress={() => handleAddMember(item.email)}
            variant="primary"
            size="small"
            loading={addingMember}
            disabled={addingMember}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (!visible || !group) return null;

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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Group Info</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading group details...</Text>
            </View>
          ) : groupDetails ? (
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {/* Group Name */}
              <View style={[styles.section, { backgroundColor: colors.receivedMessage }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Group Name</Text>
                <Text style={[styles.groupName, { color: colors.text }]}>{groupDetails.name}</Text>
              </View>

              {/* Members Count */}
              <View style={[styles.section, { backgroundColor: colors.receivedMessage }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Members ({groupDetails.members?.length || 0})
                </Text>
              </View>

              {/* Members List */}
              <View style={styles.membersList}>
                <FlatList
                  data={groupDetails.members || []}
                  renderItem={renderMemberItem}
                  keyExtractor={(item) => item.email}
                  scrollEnabled={false}
                />
              </View>

              {/* Add Member Section */}
              {!showAddMember ? (
                <View style={styles.section}>
                  <Button
                    title="➕ Add Member"
                    onPress={() => setShowAddMember(true)}
                    variant="primary"
                    fullWidth
                  />
                </View>
              ) : (
                <View style={[styles.section, { backgroundColor: colors.receivedMessage }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Add New Member</Text>
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
                  
                  {searchResults.length > 0 && (
                    <View style={styles.searchResults}>
                      <Text style={[styles.searchResultsTitle, { color: colors.text }]}>Search Results</Text>
                      <FlatList
                        data={searchResults}
                        renderItem={renderSearchResult}
                        keyExtractor={(item) => item.email}
                        scrollEnabled={false}
                      />
                    </View>
                  )}

                  <View style={styles.buttonRow}>
                    <Button
                      title="Cancel"
                      onPress={() => {
                        setShowAddMember(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      variant="secondary"
                      style={styles.button}
                    />
                  </View>
                </View>
              )}

              {/* Exit Group Button */}
              <View style={styles.section}>
                <Button
                  title="🚪 Exit Group"
                  onPress={handleExitGroup}
                  variant="outline"
                  loading={exiting}
                  disabled={exiting || isCreator}
                  fullWidth
                  textStyle={isCreator ? { color: colors.textSecondary } : { color: '#EF4444' }}
                />
                {isCreator && (
                  <Text style={[styles.creatorNote, { color: colors.textSecondary }]}>
                    Group creator cannot exit the group
                  </Text>
                )}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>Failed to load group details</Text>
            </View>
          )}
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
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.sm,
  },
  groupName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  membersList: {
    marginBottom: SPACING.md,
  },
  memberItem: {
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
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  memberName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  creatorBadge: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  youBadge: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontStyle: 'italic',
  },
  memberEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  input: {
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  loader: {
    marginTop: SPACING.sm,
  },
  searchResults: {
    marginTop: SPACING.md,
  },
  searchResultsTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.sm,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  alreadyMemberText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  button: {
    flex: 1,
  },
  creatorNote: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default GroupInfoModal;

