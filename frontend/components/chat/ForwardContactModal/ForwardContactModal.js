import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../../constants';
import { useTheme } from '../../../contexts/ThemeContext';
import contactsService from '../../../services/contactsService';
import styles from './ForwardContactModal.styles';

const ForwardContactModal = ({ visible, onClose, onSelectContacts, message }) => {
  const { colors } = useTheme();
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]); // Array of {type: 'contact'|'group', id: string}
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) {
      loadContacts();
      setSelectedItems([]); // Reset selections when modal opens
    } else {
      // Reset when modal closes
      setSelectedItems([]);
      setSearchQuery('');
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

  const getItemId = (item, type) => {
    if (type === 'contact') {
      return `contact_${getDisplayEmail(item)}`;
    } else {
      return `group_${item._id}`;
    }
  };

  const toggleSelection = (item, type) => {
    const itemId = getItemId(item, type);
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const isSelected = (item, type) => {
    const itemId = getItemId(item, type);
    return selectedItems.includes(itemId);
  };

  const handleSelectAll = () => {
    const allItems = [
      ...filteredContacts.map(item => getItemId(item, 'contact')),
      ...filteredGroups.map(item => getItemId(item, 'group')),
    ];
    
    // If all are selected, deselect all. Otherwise, select all.
    const allSelected = allItems.every(id => selectedItems.includes(id));
    if (allSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allItems);
    }
  };

  const handleSend = async () => {
    if (selectedItems.length === 0) return;
    
    setSending(true);
    try {
      const selectedTargets = [];
      
      // Process selected contacts
      filteredContacts.forEach(contact => {
        const itemId = getItemId(contact, 'contact');
        if (selectedItems.includes(itemId)) {
          selectedTargets.push({
            type: 'private',
            contactEmail: getDisplayEmail(contact),
            contactName: getDisplayName(contact),
          });
        }
      });
      
      // Process selected groups
      filteredGroups.forEach(group => {
        const itemId = getItemId(group, 'group');
        if (selectedItems.includes(itemId)) {
          selectedTargets.push({
            type: 'group',
            groupId: group._id,
            groupName: group.name,
          });
        }
      });
      
      if (onSelectContacts && selectedTargets.length > 0) {
        await onSelectContacts(selectedTargets);
      }
      
      setSelectedItems([]);
      onClose();
    } catch (error) {
      console.error('Error sending forward:', error);
    } finally {
      setSending(false);
    }
  };

  const allFilteredItemsSelected = () => {
    const allItems = [
      ...filteredContacts.map(item => getItemId(item, 'contact')),
      ...filteredGroups.map(item => getItemId(item, 'group')),
    ];
    return allItems.length > 0 && allItems.every(id => selectedItems.includes(id));
  };

  const renderContactItem = ({ item, type }) => {
    const displayName = type === 'contact' ? getDisplayName(item) : item.name;
    const subtitle = type === 'contact' ? getDisplayEmail(item) : `${item.members?.length || 0} members`;
    const selected = isSelected(item, type);

    return (
      <TouchableOpacity
        style={[
          styles.contactItem, 
          { backgroundColor: colors.background },
          selected && { backgroundColor: colors.primary + '20' }
        ]}
        onPress={() => toggleSelection(item, type)}
        activeOpacity={0.7}
      >
        <View style={styles.contactInfo}>
          <View style={[styles.checkbox, { borderColor: selected ? COLORS.primary : colors.divider }]}>
            {selected && (
              <View style={[styles.checkboxInner, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </View>
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
            <TouchableOpacity 
              onPress={handleSelectAll} 
              style={styles.selectAllButton}
              disabled={filteredContacts.length === 0 && filteredGroups.length === 0}
            >
              <Text style={[
                styles.selectAllText, 
                { color: allFilteredItemsSelected() ? COLORS.primary : colors.textSecondary }
              ]}>
                {allFilteredItemsSelected() ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
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
                {loading ? (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No contacts found
                  </Text>
                )}
              </View>
            }
            contentContainerStyle={selectedItems.length > 0 ? styles.listWithSelection : null}
          />

          {/* Send Button */}
          {selectedItems.length > 0 && (
            <View style={[styles.sendButtonContainer, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: COLORS.primary },
                  sending && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={sending || selectedItems.length === 0}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.sendButtonText}>
                    Send ({selectedItems.length})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ForwardContactModal;

