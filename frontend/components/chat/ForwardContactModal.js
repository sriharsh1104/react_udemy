import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import contactsService from '../../services/contactsService';

const ForwardContactModal = ({ visible, onClose, onSelectContact, message }) => {
  const { colors } = useTheme();
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const recentChatsResult = await contactsService.getRecentChats();
      if (recentChatsResult.success) {
        setContacts(recentChatsResult.contacts || []);
        setGroups(recentChatsResult.groups || []);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (item) => {
    if (item.name) return item.name;
    if (item.contactEmail) return item.contactEmail.split('@')[0];
    if (item.email) return item.email.split('@')[0];
    return 'Unknown';
  };

  const getDisplayEmail = (item) => {
    return item.contactEmail || item.email || '';
  };

  const filteredContacts = contacts.filter(contact => {
    const name = getDisplayName(contact).toLowerCase();
    const email = getDisplayEmail(contact).toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const filteredGroups = groups.filter(group => {
    const name = (group.name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query);
  });

  const handleSelect = (item, type) => {
    if (type === 'contact') {
      onSelectContact({
        type: 'private',
        contactEmail: getDisplayEmail(item),
        contactName: getDisplayName(item),
      });
    } else if (type === 'group') {
      onSelectContact({
        type: 'group',
        groupId: item._id,
        groupName: item.name,
      });
    }
    onClose();
  };

  const renderContactItem = ({ item, type }) => {
    const displayName = type === 'contact' ? getDisplayName(item) : item.name;
    const subtitle = type === 'contact' ? getDisplayEmail(item) : `${item.members?.length || 0} members`;

    return (
      <TouchableOpacity
        style={[styles.contactItem, { backgroundColor: colors.background }]}
        onPress={() => handleSelect(item, type)}
      >
        <View style={styles.contactInfo}>
          <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.avatarText}>
              {type === 'contact' ? '👤' : '👥'}
            </Text>
          </View>
          <View style={styles.contactDetails}>
            <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Forward to</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search contacts or groups"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Contacts List */}
          <FlatList
            data={[
              ...filteredContacts.map(item => ({ ...item, itemType: 'contact' })),
              ...filteredGroups.map(item => ({ ...item, itemType: 'group' })),
            ]}
            keyExtractor={(item, index) => `${item.itemType}_${item._id || item.contactEmail || item.email || index}`}
            renderItem={({ item }) => renderContactItem({ item, type: item.itemType })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {loading ? 'Loading...' : 'No contacts found'}
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  placeholder: {
    width: 60,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  searchInput: {
    fontSize: TYPOGRAPHY.fontSize.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  contactItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 24,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs / 2,
  },
  contactSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
});

export default ForwardContactModal;

