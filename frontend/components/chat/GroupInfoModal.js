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
  Share,
  Linking,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../common/Button';
import GLoader from '../common/GLoader';
import contactsService from '../../services/contactsService';
import groupService from '../../services/groupService';
import { showToastFromResponse } from '../../utils/toast';
import Toast from 'react-native-toast-message';

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
  const [inviteLink, setInviteLink] = useState('');
  const [loadingInviteLink, setLoadingInviteLink] = useState(false);
  const [resettingLink, setResettingLink] = useState(false);

  useEffect(() => {
    if (visible && group) {
      loadGroupDetails();
      loadInviteLink();
    } else {
      setGroupDetails(null);
      setShowAddMember(false);
      setSearchQuery('');
      setSearchResults([]);
      setInviteLink('');
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

  const loadInviteLink = async () => {
    if (!group || !group._id) return;
    setLoadingInviteLink(true);
    const result = await groupService.generateInviteLink(group._id);
    if (result.success && result.inviteLink) {
      setInviteLink(result.inviteLink);
    }
    setLoadingInviteLink(false);
  };

  const handleResetLink = async () => {
    if (!group || !group._id) return;
    
    Alert.alert(
      'Reset Invite Link',
      'This will expire the current link and generate a new one. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResettingLink(true);
            const result = await groupService.resetInviteLink(group._id);
            setResettingLink(false);
            if (result.success && result.inviteLink) {
              setInviteLink(result.inviteLink);
              Toast.show({
                type: 'success',
                text1: 'Link Reset',
                text2: 'New invite link generated',
                position: 'top',
                topOffset: 60,
                visibilityTime: 2000,
              });
            }
          },
        },
      ]
    );
  };

  const handleCopyLink = async () => {
    if (!inviteLink) {
      Toast.show({
        type: 'error',
        text1: 'No Link',
        text2: 'Invite link not available',
        position: 'top',
        topOffset: 60,
        visibilityTime: 2000,
      });
      return;
    }

    try {
      // Copy to clipboard using expo-clipboard
      await Clipboard.setStringAsync(inviteLink);
      Toast.show({
        type: 'success',
        text1: 'Copied!',
        text2: 'Link copied to clipboard',
        position: 'top',
        topOffset: 60,
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Copy',
        text2: 'Could not copy link to clipboard',
        position: 'top',
        topOffset: 60,
        visibilityTime: 2000,
      });
    }
  };

  const handleShareViaEmail = async () => {
    if (!inviteLink) {
      Toast.show({
        type: 'error',
        text1: 'No Link',
        text2: 'Invite link not available',
        position: 'top',
        topOffset: 60,
        visibilityTime: 2000,
      });
      return;
    }

    const subject = encodeURIComponent(`Join ${groupDetails?.name || 'this group'} on Chat App`);
    const emailBody = `Join me in the group "${groupDetails?.name || 'this group'}" on Chat App!\n\nClick this link to join:\n${inviteLink}`;
    const body = encodeURIComponent(emailBody);

    // Try Gmail app first (Android and iOS)
    const gmailUrlAndroid = `googlegmail://co?to=&subject=${subject}&body=${body}`;
    const gmailUrlIOS = `googlegmail://co?subject=${subject}&body=${body}`;
    const gmailUrl = Platform.OS === 'android' ? gmailUrlAndroid : gmailUrlIOS;
    
    try {
      // First try to open Gmail app
      const canOpenGmail = await Linking.canOpenURL('googlegmail://');
      
      if (canOpenGmail) {
        // Open Gmail app with compose
        await Linking.openURL(gmailUrl);
        return;
      }
    } catch (gmailError) {
      console.log('Gmail app not available, trying default email app');
    }

    // Fallback to default mailto (will open default email app - Gmail if set as default)
    try {
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      console.error('Error opening email app:', error);
      Toast.show({
        type: 'error',
        text1: 'Email Not Available',
        text2: 'Please install Gmail or an email app',
        position: 'top',
        topOffset: 60,
        visibilityTime: 2000,
      });
    }
  };

  const handleShareViaSMS = () => {
    if (!inviteLink) {
      Toast.show({
        type: 'error',
        text1: 'No Link',
        text2: 'Invite link not available',
        position: 'top',
        topOffset: 60,
        visibilityTime: 2000,
      });
      return;
    }

    // SMS message with referral link
    const smsMessage = `Join me in the group "${groupDetails?.name || 'this group'}" on Chat App!\n\nClick this link to join:\n${inviteLink}`;
    const message = encodeURIComponent(smsMessage);
    const smsUrl = `sms:?body=${message}`;
    
    Linking.openURL(smsUrl).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'SMS Not Available',
        text2: 'Could not open SMS app',
        position: 'top',
        topOffset: 60,
        visibilityTime: 2000,
      });
    });
  };

  const handleNativeShare = async () => {
    if (!inviteLink) {
      Toast.show({
        type: 'error',
        text1: 'No Link',
        text2: 'Invite link not available',
        position: 'top',
        topOffset: 60,
        visibilityTime: 2000,
      });
      return;
    }

    try {
      await Share.share({
        message: `Join me in the group "${groupDetails?.name || 'this group'}" on Chat App! ${inviteLink}`,
        title: `Join ${groupDetails?.name || 'this group'}`,
      });
    } catch (error) {
      // User cancelled share
    }
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

  const isLoading = loading || searching || addingMember || exiting || loadingInviteLink;
  const loadingMessage = loading ? "Loading group details..." : 
                        searching ? "Searching..." : 
                        addingMember ? "Adding member..." : 
                        exiting ? "Exiting group..." :
                        loadingInviteLink ? "Loading invite link..." : "Loading...";

  return (
    <>
      <GLoader visible={isLoading} message={loadingMessage} />
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

            {groupDetails ? (
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

              {/* Share Group Section */}
              <View style={[styles.section, { backgroundColor: colors.receivedMessage }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Share Group</Text>
                
                {loadingInviteLink ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                ) : (
                  <>
                    {inviteLink ? (
                      <View style={[styles.linkContainer, { backgroundColor: colors.inputBackground, borderColor: colors.divider }]}>
                        <Text style={[styles.linkText, { color: colors.text }]} numberOfLines={2}>
                          {inviteLink}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.noLinkText, { color: colors.textSecondary }]}>
                        Generate invite link to share
                      </Text>
                    )}

                    <View style={styles.shareButtonsContainer}>
                      <TouchableOpacity
                        style={[styles.shareButton, { backgroundColor: colors.primary }]}
                        onPress={handleCopyLink}
                        disabled={!inviteLink}
                      >
                        <Text style={[styles.shareButtonText, { color: colors.white }]}>📋 Copy Link</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.shareButton, { backgroundColor: '#34C759' }]}
                        onPress={handleShareViaEmail}
                        disabled={!inviteLink}
                      >
                        <Text style={[styles.shareButtonText, { color: colors.white }]}>📧 Email</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.shareButton, { backgroundColor: '#007AFF' }]}
                        onPress={handleShareViaSMS}
                        disabled={!inviteLink}
                      >
                        <Text style={[styles.shareButtonText, { color: colors.white }]}>💬 SMS</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.shareButton, { backgroundColor: colors.primary }]}
                        onPress={handleNativeShare}
                        disabled={!inviteLink}
                      >
                        <Text style={[styles.shareButtonText, { color: colors.white }]}>📤 Share</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.resetLinkButton, { borderColor: colors.divider }]}
                      onPress={handleResetLink}
                      disabled={!inviteLink || resettingLink}
                    >
                      {resettingLink ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={[styles.resetLinkText, { color: colors.primary }]}>
                          🔄 Reset Link
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>

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
    </>
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
  linkContainer: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  linkText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  noLinkText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  shareButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  resetLinkButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetLinkText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

export default GroupInfoModal;

