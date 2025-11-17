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
  ScrollView,
  Pressable,
} from 'react-native';
import Toast from 'react-native-toast-message';
import * as Contacts from 'expo-contacts';
import * as Clipboard from 'expo-clipboard';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import GLoader from '../common/GLoader';
import contactsService from '../../services/contactsService';

export const InviteModal = ({ visible, onClose, email }) => {
  const [inviteLink, setInviteLink] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (visible) {
      loadInviteLink();
    }
  }, [visible]);

  const loadInviteLink = async () => {
    setLoading(true);
    const result = await contactsService.getInviteLink();
    if (result.success) {
      // Use referralLink if available, otherwise fallback to inviteLink for backward compatibility
      const link = result.referralLink || result.inviteLink || '';
      const code = result.referralCode || result.inviteCode || '';
      setReferralLink(link);
      setReferralCode(code);
      setInviteLink(link); // Keep for backward compatibility
    }
    setLoading(false);
  };

  const handleShare = () => {
    if (!referralLink && !inviteLink) return;
    setShowShareModal(true);
  };

  const shareMessage = `Join me on Chat App! Use my referral code: ${referralCode || 'N/A'}\n${referralLink || inviteLink}`;

  const handlePlatformShare = (platform) => {
    if (!referralLink && !inviteLink) return;
    
    const message = shareMessage;
    const linkToShare = referralLink || inviteLink;
    let url = '';

    switch (platform) {
      case 'whatsapp':
        // Try mobile app first, then web
        if (Platform.OS !== 'web') {
          url = `whatsapp://send?text=${encodeURIComponent(message)}`;
        } else {
          url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        }
        break;
      case 'facebook':
        if (Platform.OS !== 'web') {
          // Try Facebook app, fallback to web
          url = `fb://share?text=${encodeURIComponent(message)}`;
        } else {
          url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkToShare)}&quote=${encodeURIComponent(message)}`;
        }
        break;
      case 'twitter':
        if (Platform.OS !== 'web') {
          // Try Twitter app
          url = `twitter://post?message=${encodeURIComponent(message)}`;
        } else {
          url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(linkToShare)}`;
        }
        break;
      case 'telegram':
        if (Platform.OS !== 'web') {
          // Try Telegram app
          url = `tg://msg?text=${encodeURIComponent(message)}`;
        } else {
          url = `https://t.me/share/url?url=${encodeURIComponent(linkToShare)}&text=${encodeURIComponent(message)}`;
        }
        break;
      case 'sms':
        url = `sms:?body=${encodeURIComponent(message)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent('Join me on Chat App!')}&body=${encodeURIComponent(message)}`;
        break;
      case 'native':
        Share.share({
          message,
        }).catch(() => {});
        setShowShareModal(false);
        return;
      default:
        return;
    }

    Linking.openURL(url).catch(() => {
      // If mobile app fails, try web URL for some platforms
      if (Platform.OS !== 'web') {
        let webUrl = '';
        switch (platform) {
          case 'facebook':
            webUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkToShare)}`;
            break;
          case 'twitter':
            webUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(linkToShare)}`;
            break;
          case 'telegram':
            webUrl = `https://t.me/share/url?url=${encodeURIComponent(linkToShare)}&text=${encodeURIComponent(message)}`;
            break;
          default:
            Alert.alert('Error', `${platform.charAt(0).toUpperCase() + platform.slice(1)} app is not installed`);
            setShowShareModal(false);
            return;
        }
        Linking.openURL(webUrl).catch(() => {
          Alert.alert('Error', `Could not open ${platform}`);
        });
      } else {
        Alert.alert('Error', `Could not share via ${platform}`);
      }
    });
    setShowShareModal(false);
  };

  const handleWhatsAppShare = () => {
    const linkToShare = referralLink || inviteLink;
    const message = `Join me on Chat App! Use my referral code: ${referralCode || 'N/A'}\n${linkToShare}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed');
    });
  };

  const handleCopyToClipboard = async () => {
    const linkToShare = referralLink || inviteLink;
    if (!linkToShare) return;
    
    try {
      await Clipboard.setStringAsync(linkToShare);
      Toast.show({
        type: 'success',
        text1: 'Copied!',
        text2: 'Referral link copied to clipboard',
        position: 'top',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleCopyReferralCode = async () => {
    if (!referralCode) return;
    
    try {
      await Clipboard.setStringAsync(referralCode);
      Toast.show({
        type: 'success',
        text1: 'Copied!',
        text2: 'Referral code copied to clipboard',
        position: 'top',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to copy referral code');
    }
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
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Referral Link</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <>
                <Text style={styles.subtitle}>
                  {email ? `Invite ${email} to join` : 'Share your referral link and code with friends'}
                </Text>
                
                {referralCode && (
                  <View style={styles.referralCodeContainer}>
                    <Text style={styles.referralCodeLabel}>Your Referral Code:</Text>
                    <View style={styles.referralCodeBox}>
                      <Text style={styles.referralCodeText} numberOfLines={1} ellipsizeMode="middle">
                        {referralCode}
                      </Text>
                      <TouchableOpacity
                        style={styles.copyCodeButton}
                        onPress={handleCopyReferralCode}
                      >
                        <Text style={styles.copyCodeButtonText}>📋</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                <View style={styles.linkContainer}>
                  <Text style={styles.linkLabel}>Referral Link:</Text>
                  <Text style={styles.linkText} numberOfLines={3} ellipsizeMode="middle">
                    {referralLink || inviteLink}
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
                  onPress={handleShare}
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
          </ScrollView>
        </View>
      </View>

      {/* Share Platform Selection Modal */}
      <Modal
        transparent={true}
        visible={showShareModal}
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.shareModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.shareModalTitle}>Share via</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowShareModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sharePlatformsContainer}>
              <TouchableOpacity
                style={styles.sharePlatformButton}
                onPress={() => handlePlatformShare('whatsapp')}
              >
                <Text style={styles.sharePlatformIcon}>📱</Text>
                <Text style={styles.sharePlatformText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sharePlatformButton}
                onPress={() => handlePlatformShare('facebook')}
              >
                <Text style={styles.sharePlatformIcon}>👤</Text>
                <Text style={styles.sharePlatformText}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sharePlatformButton}
                onPress={() => handlePlatformShare('twitter')}
              >
                <Text style={styles.sharePlatformIcon}>🐦</Text>
                <Text style={styles.sharePlatformText}>Twitter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sharePlatformButton}
                onPress={() => handlePlatformShare('telegram')}
              >
                <Text style={styles.sharePlatformIcon}>✈️</Text>
                <Text style={styles.sharePlatformText}>Telegram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sharePlatformButton}
                onPress={() => handlePlatformShare('sms')}
              >
                <Text style={styles.sharePlatformIcon}>💬</Text>
                <Text style={styles.sharePlatformText}>SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sharePlatformButton}
                onPress={() => handlePlatformShare('email')}
              >
                <Text style={styles.sharePlatformIcon}>📧</Text>
                <Text style={styles.sharePlatformText}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sharePlatformButton}
                onPress={() => handlePlatformShare('native')}
              >
                <Text style={styles.sharePlatformIcon}>📤</Text>
                <Text style={styles.sharePlatformText}>More Options</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const Sidebar = ({ visible, onClose, onSelectContact, contacts: parentContacts = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [phoneContacts, setPhoneContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPhoneContacts, setLoadingPhoneContacts] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [activeTab, setActiveTab] = useState('app'); // 'app' or 'phone'
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [addContactEmail, setAddContactEmail] = useState('');
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');

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
      if (activeTab === 'phone') {
        loadPhoneContacts();
      }
    }
  }, [visible, activeTab]);

  useEffect(() => {
    // Only search when complete email is entered (privacy: no partial search)
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
    setLoading(true);
    const result = await contactsService.searchUsers(searchQuery);
    if (result.success) {
      setSearchResults(result.results);
    }
    setLoading(false);
  };

  const loadPhoneContacts = async () => {
    try {
      setLoadingPhoneContacts(true);
      
      // Request permission
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Contacts permission is required to sync phone contacts.');
        setLoadingPhoneContacts(false);
        return;
      }

      // Get contacts
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      // Filter contacts with phone numbers
      const contactsWithPhones = data
        .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map(contact => ({
          id: contact.id,
          name: contact.name || 'Unknown',
          phones: contact.phoneNumbers.map(p => p.number),
        }));

      // Get all unique phone numbers
      const allPhones = [];
      contactsWithPhones.forEach(contact => {
        contact.phones.forEach(phone => {
          const normalized = phone.replace(/[\s\+\-\(\)]/g, '');
          if (normalized && !allPhones.includes(normalized)) {
            allPhones.push(normalized);
          }
        });
      });

      // Batch check which phones are registered
      if (allPhones.length > 0) {
        const checkResult = await contactsService.checkPhonesBatch(allPhones);
        
        if (checkResult.success) {
          // Map results back to contacts
          const phoneContactsWithStatus = contactsWithPhones.map(contact => {
            const firstPhone = contact.phones[0]?.replace(/[\s\+\-\(\)]/g, '');
            const registeredInfo = checkResult.results.find(r => 
              r.phone.replace(/[\s\+\-\(\)]/g, '') === firstPhone
            );
            
            return {
              ...contact,
              phone: contact.phones[0],
              registered: registeredInfo?.registered || false,
              email: registeredInfo?.email || null,
              registeredName: registeredInfo?.name || null,
            };
          });

          setPhoneContacts(phoneContactsWithStatus);
        }
      } else {
        setPhoneContacts([]);
      }
    } catch (error) {
      console.error('Error loading phone contacts:', error);
      Alert.alert('Error', 'Failed to load phone contacts');
    } finally {
      setLoadingPhoneContacts(false);
    }
  };

  const handlePhoneContactSelect = async (contact) => {
    if (contact.registered && contact.email) {
      // User is registered - start chat directly without adding to contacts
      onSelectContact(contact.email);
      onClose();
    } else {
      // User not registered - show invite
      setSelectedPhone(contact.phone);
      setShowInviteModal(true);
    }
  };

  const handleAddContact = async (email) => {
    if (!email || !email.includes('@')) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
        position: 'top',
      });
      return;
    }

    // Check if user exists
    const checkResult = await contactsService.checkUserExists(email);
    
    if (checkResult.success && checkResult.exists) {
      // Add to contacts - toast will be shown by contactsService
      const addResult = await contactsService.addContact(email);
      if (addResult.success) {
        // Backend will send contactsUpdated socket event, no need to call API
        // Parent (ChatScreen) will handle the update via socket event
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'User Not Found',
        text2: checkResult.message || 'This user does not exist on the platform',
        position: 'top',
      });
    }
  };

  const handleSelectUser = async (user) => {
    if (user.exists) {
      // User exists - start chat directly without adding to contacts
      onSelectContact(user.email);
      onClose();
    } else {
      // User doesn't exist - show invite modal
      setSelectedEmail(user.email);
      setShowInviteModal(true);
    }
  };

  const handleAddContactFromSearch = async (user) => {
    if (user.exists) {
      // Toast will be shown by contactsService
      const addResult = await contactsService.addContact(user.email);
      if (addResult.success) {
        // Backend will send contactsUpdated socket event, no need to call API
        // Parent (ChatScreen) will handle the update via socket event
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'User Not Found',
        text2: 'This user does not exist on the platform',
        position: 'top',
      });
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
        <View style={styles.actionButtonsRow}>
          {!item.isContact && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddContactFromSearch(item)}
            >
              <Text style={styles.addButtonText}>➕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleSelectUser(item)}
          >
            <Text style={styles.chatButtonText}>💬</Text>
          </TouchableOpacity>
        </View>
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
      <GLoader visible={loading || loadingPhoneContacts} message={loadingPhoneContacts ? "Loading phone contacts..." : "Loading..."} />
      <Modal
        transparent={true}
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable style={styles.container} onPress={onClose}>
          <View 
            style={styles.sidebar}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Contacts</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.addContactButton}
                  onPress={() => setShowAddContactModal(true)}
                >
                  <Text style={styles.addContactButtonText}>➕ Add</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'app' && styles.activeTab]}
                onPress={() => setActiveTab('app')}
              >
                <Text style={[styles.tabText, activeTab === 'app' && styles.activeTabText]}>
                  App Contacts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'phone' && styles.activeTab]}
                onPress={() => {
                  setActiveTab('phone');
                  if (phoneContacts.length === 0) {
                    loadPhoneContacts();
                  }
                }}
              >
                <Text style={[styles.tabText, activeTab === 'phone' && styles.activeTabText]}>
                  Phone Contacts
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'app' && (
              <>
                        <View style={styles.searchContainer}>
                          <TextInput
                            style={styles.searchInput}
                            placeholder="Enter complete email address..."
                            placeholderTextColor={COLORS.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            keyboardType="email-address"
                          />
                        </View>

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
              </>
            )}

            {activeTab === 'phone' && (
              <>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or phone number..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={phoneSearchQuery}
                    onChangeText={setPhoneSearchQuery}
                    autoCapitalize="words"
                    keyboardType="default"
                  />
                </View>
                {!loadingPhoneContacts && (
                  <FlatList
                    data={phoneContacts.filter(contact => {
                      if (!phoneSearchQuery.trim()) return true;
                      const query = phoneSearchQuery.toLowerCase().trim();
                      const name = (contact.name || '').toLowerCase();
                      const phone = (contact.phone || '').toLowerCase();
                      return name.includes(query) || phone.includes(query);
                    })}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.resultItem}
                        onPress={() => handlePhoneContactSelect(item)}
                      >
                        <View style={styles.resultItemContent}>
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                              {item.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.resultItemText}>
                            <Text style={styles.resultItemName}>{item.name}</Text>
                            <Text style={styles.resultItemEmail}>{item.phone}</Text>
                            {item.registered && (
                              <Text style={styles.registeredText}>
                                ✓ Registered as {item.registeredName || item.email?.split('@')[0]}
                              </Text>
                            )}
                          </View>
                        </View>
                        {item.registered ? (
                          <View style={styles.actionButtonsRow}>
                            {!contacts.some(c => c.email === item.email) && (
                              <TouchableOpacity
                                style={styles.addButton}
                                onPress={async () => {
                                  await handleAddContactFromSearch({ exists: true, email: item.email });
                                }}
                              >
                                <Text style={styles.addButtonText}>➕</Text>
                              </TouchableOpacity>
                            )}
                          <TouchableOpacity
                            style={styles.chatButton}
                            onPress={() => handlePhoneContactSelect(item)}
                          >
                            <Text style={styles.chatButtonText}>💬</Text>
                          </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.inviteButton}
                            onPress={() => handlePhoneContactSelect(item)}
                          >
                            <Text style={styles.inviteButtonText}>📤</Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    ListEmptyComponent={
                      !loadingPhoneContacts && (
                        <View style={styles.emptyContainer}>
                          <Text style={styles.emptyText}>
                            {phoneSearchQuery.trim() 
                              ? 'No contacts found matching your search' 
                              : 'No phone contacts found'}
                          </Text>
                          <Text style={styles.emptySubtext}>
                            {phoneSearchQuery.trim() 
                              ? 'Try searching with a different name or phone number' 
                              : 'Make sure contacts have phone numbers'}
                          </Text>
                        </View>
                      )
                    }
                  />
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      <InviteModal
        visible={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setSelectedEmail(null);
        }}
        email={selectedEmail}
      />

      {/* Add Contact Modal */}
      <Modal
        transparent={true}
        visible={showAddContactModal}
        animationType="slide"
        onRequestClose={() => setShowAddContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addContactModal}>
            <Text style={styles.modalTitle}>Add Contact</Text>
            <Text style={styles.modalSubtitle}>
              Enter email address to add contact
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter email address"
              placeholderTextColor={COLORS.textSecondary}
              value={addContactEmail}
              onChangeText={setAddContactEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddContactModal(false);
                  setAddContactEmail('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={async () => {
                  await handleAddContact(addContactEmail);
                  setShowAddContactModal(false);
                  setAddContactEmail('');
                }}
              >
                <Text style={styles.addButtonTextModal}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addContactButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  addContactButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
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
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  registeredText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.online,
    marginTop: 2,
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
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
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
    maxHeight: '90%',
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
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalCloseButtonText: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  referralCodeContainer: {
    marginBottom: SPACING.lg,
  },
  referralCodeLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    minHeight: 48,
  },
  referralCodeText: {
    flex: 1,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1,
    marginRight: SPACING.xs,
  },
  copyCodeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  copyCodeButtonText: {
    fontSize: 20,
  },
  linkContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    maxWidth: '100%',
  },
  linkLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  linkText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.sm,
    flexWrap: 'wrap',
    wordBreak: 'break-word',
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
  addContactModal: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.divider,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  addButtonModal: {
    backgroundColor: COLORS.primary,
  },
  addButtonTextModal: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  shareModalContainer: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '90%',
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
  shareModalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  sharePlatformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  sharePlatformButton: {
    width: '30%',
    minWidth: 90,
    aspectRatio: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  sharePlatformIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  sharePlatformText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
  },
});

export default Sidebar;
