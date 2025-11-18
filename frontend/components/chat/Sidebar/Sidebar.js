import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
  Linking,
  Share,
  ScrollView,
  Pressable,
} from 'react-native';
import Toast from 'react-native-toast-message';
import * as Contacts from 'expo-contacts';
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../../../constants';
import contactsService from '../../../services/contactsService';
import AlertModal from '../../common/AlertModal/AlertModal';
import useAlertModal from '../../../hooks/useAlertModal';
import styles from './Sidebar.styles';

export const InviteModal = ({ visible, onClose, email }) => {
  const { showAlert, alertState, hideAlert } = useAlertModal();
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
            showAlert('Error', `${platform.charAt(0).toUpperCase() + platform.slice(1)} app is not installed`, { type: 'error' });
            setShowShareModal(false);
            return;
        }
        Linking.openURL(webUrl).catch(() => {
          showAlert('Error', `Could not open ${platform}`, { type: 'error' });
        });
      } else {
        showAlert('Error', `Could not share via ${platform}`, { type: 'error' });
      }
    });
    setShowShareModal(false);
  };

  const handleWhatsAppShare = () => {
    const linkToShare = referralLink || inviteLink;
    const message = `Join me on Chat App! Use my referral code: ${referralCode || 'N/A'}\n${linkToShare}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      showAlert('Error', 'WhatsApp is not installed', { type: 'error' });
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
      showAlert('Error', 'Failed to copy link', { type: 'error' });
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
      showAlert('Error', 'Failed to copy referral code', { type: 'error' });
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

      {/* Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttonText={alertState.buttonText}
        type={alertState.type}
        onClose={hideAlert}
      />
    </Modal>
  );
};

const Sidebar = ({ visible, onClose, onSelectContact, contacts: parentContacts = [] }) => {
  const { showAlert, alertState, hideAlert } = useAlertModal();
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
        showAlert('Permission Denied', 'Contacts permission is required to sync phone contacts.', { type: 'warning' });
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
      showAlert('Error', 'Failed to load phone contacts', { type: 'error' });
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

  const renderContact = ({ item }) => {
    const isOnline = item.isOnline || false;
    return (
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
          <Text style={[styles.onlineIndicator, { color: isOnline ? '#4CAF50' : '#9E9E9E' }]}>●</Text>
      )}
    </TouchableOpacity>
  );
  };

  return (
    <>
      {/* Loader disabled - removed to prevent stuck loader */}
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

      {/* Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttonText={alertState.buttonText}
        type={alertState.type}
        onClose={hideAlert}
      />
    </>
  );
};

export default Sidebar;

