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
  Alert,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import contactsService from '../../services/contactsService';

const InviteModal = ({ visible, onClose, email }) => {
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadInviteLink();
    }
  }, [visible]);

  const loadInviteLink = async () => {
    setLoading(true);
    const result = await contactsService.getInviteLink();
    if (result.success) {
      setInviteLink(result.inviteLink);
    }
    setLoading(false);
  };

  const handleCopyLink = async () => {
    if (inviteLink) {
      try {
        await Share.share({
          message: `Join me on Chat App! ${inviteLink}`,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to share invite link');
      }
    }
  };

  const handleWhatsAppShare = () => {
    const message = `Join me on Chat App! ${inviteLink}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed');
    });
  };

  const handleCopyToClipboard = () => {
    // For React Native, we'll use Share API
    Share.share({
      message: inviteLink,
    });
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Invite User</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <>
              <Text style={styles.subtitle}>
                {email ? `Invite ${email} to join` : 'Share invite link'}
              </Text>
              
              <View style={styles.linkContainer}>
                <Text style={styles.linkText} numberOfLines={2}>
                  {inviteLink}
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.whatsappButton]}
                  onPress={handleWhatsAppShare}
                >
                  <Text style={styles.buttonText}>📱 WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.shareButton]}
                  onPress={handleCopyLink}
                >
                  <Text style={styles.buttonText}>📤 Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.copyButton]}
                  onPress={handleCopyToClipboard}
                >
                  <Text style={styles.buttonText}>📋 Copy Link</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const Sidebar = ({ visible, onClose, onSelectContact }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadContacts = async () => {
    setLoading(true);
    const result = await contactsService.getContacts();
    if (result.success) {
      setContacts(result.contacts);
    }
    setLoading(false);
  };

  const searchUsers = async () => {
    setLoading(true);
    const result = await contactsService.searchUsers(searchQuery);
    if (result.success) {
      setSearchResults(result.results);
    }
    setLoading(false);
  };

  const handleSelectUser = async (user) => {
    if (user.exists) {
      // User exists - start chat
      if (!user.isContact) {
        // Add to contacts first
        await contactsService.addContact(user.email);
        await loadContacts();
      }
      onSelectContact(user.email);
      onClose();
    } else {
      // User doesn't exist - show invite modal
      setSelectedEmail(user.email);
      setShowInviteModal(true);
    }
  };

  const handleAddContact = async (email) => {
    const result = await contactsService.addContact(email);
    if (result.success) {
      await loadContacts();
      Alert.alert('Success', 'Contact added successfully');
    } else {
      Alert.alert('Error', result.message || 'Failed to add contact');
    }
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectUser(item)}
    >
      <View style={styles.resultItemContent}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.resultItemText}>
          <Text style={styles.resultItemName}>{item.name}</Text>
          <Text style={styles.resultItemEmail}>{item.email}</Text>
        </View>
      </View>
      {item.exists ? (
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleSelectUser(item)}
        >
          <Text style={styles.chatButtonText}>💬</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => {
            setSelectedEmail(item.email);
            setShowInviteModal(true);
          }}
        >
          <Text style={styles.inviteButtonText}>📤</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderContact = ({ item }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => {
        onSelectContact(item.email);
        onClose();
      }}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactItemText}>
        <Text style={styles.contactItemName}>{item.name}</Text>
        <Text style={styles.contactItemEmail}>{item.email}</Text>
      </View>
      {item.exists && (
        <Text style={styles.onlineIndicator}>●</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Modal
        transparent={true}
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.sidebar}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Contacts</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by email..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            )}

            {searchQuery.trim().length >= 2 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.email}
                style={styles.list}
                ListEmptyComponent={
                  !loading && (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No users found</Text>
                    </View>
                  )
                }
              />
            ) : (
              <FlatList
                data={contacts}
                renderItem={renderContact}
                keyExtractor={(item) => item.email}
                style={styles.list}
                ListEmptyComponent={
                  !loading && (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No contacts yet</Text>
                      <Text style={styles.emptySubtext}>
                        Search for users to add contacts
                      </Text>
                    </View>
                  )
                }
              />
            )}
          </View>
        </View>
      </Modal>

      <InviteModal
        visible={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setSelectedEmail(null);
        }}
        email={selectedEmail}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  sidebar: {
    width: '85%',
    backgroundColor: COLORS.receivedMessage,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  list: {
    flex: 1,
  },
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.xs,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  resultItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  resultItemText: {
    flex: 1,
  },
  contactItemText: {
    flex: 1,
  },
  resultItemName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  resultItemEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  contactItemName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  contactItemEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 20,
  },
  inviteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: 20,
  },
  onlineIndicator: {
    fontSize: 12,
    color: COLORS.online,
    marginLeft: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  linkContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  linkText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  buttonContainer: {
    gap: SPACING.md,
  },
  button: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  shareButton: {
    backgroundColor: COLORS.primary,
  },
  copyButton: {
    backgroundColor: COLORS.divider,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
});

export default Sidebar;

