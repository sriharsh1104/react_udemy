import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import contactsService from '../../services/contactsService';
import groupService from '../../services/groupService';
import ChatActionBar from './ChatActionBar';

const RecentChats = ({ contacts, groups = [], onSelectContact, onSelectGroup, onNewChat, onCreateGroup, onSaveContact, onInvite, onContactsUpdate, onGroupsUpdate, userEmail }) => {
  const { colors } = useTheme();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'favorites', 'archived'
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false); // Track if archived section is expanded
  const [togglingFavorite, setTogglingFavorite] = useState(null);
  const [togglingGroupFavorite, setTogglingGroupFavorite] = useState(null);
  const [selectedChats, setSelectedChats] = useState([]); // Array of { type: 'contact' | 'group', id: string }
  const [searchQuery, setSearchQuery] = useState(''); // Search query for filtering chats

  const getUsernameFromEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  // Filter contacts based on selected filter and search query
  const filteredContacts = useMemo(() => {
    // Exclude archived chats from all, unread, and favorites filters
    const nonArchivedContacts = contacts.filter(contact => !contact.isArchived);
    
    let filtered = [];
    if (filter === 'all') {
      filtered = nonArchivedContacts;
    } else if (filter === 'unread') {
      filtered = nonArchivedContacts.filter(contact => contact.unreadCount > 0);
    } else if (filter === 'favorites') {
      filtered = nonArchivedContacts.filter(contact => contact.isFavorite === true);
    } else if (filter === 'archived') {
      filtered = contacts.filter(contact => contact.isArchived === true);
    } else {
      filtered = nonArchivedContacts;
    }
    
    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(contact => {
        const name = (contact.name || getUsernameFromEmail(contact.email)).toLowerCase();
        const email = (contact.email || '').toLowerCase();
        return name.includes(query) || email.includes(query);
      });
    }
    
    return filtered;
  }, [contacts, filter, searchQuery]);

  // Filter groups based on selected filter and search query
  const filteredGroups = useMemo(() => {
    const groupsList = groups || [];
    
    // Helper to check if group is archived for current user
    const isGroupArchived = (group) => {
      if (!group.archivedBy || !Array.isArray(group.archivedBy)) return false;
      // Check if current user's email is in the archivedBy array
      return userEmail && group.archivedBy.includes(userEmail);
    };
    
    // Exclude archived groups from all, unread, and favorites filters
    const nonArchivedGroups = groupsList.filter(group => !isGroupArchived(group));
    
    let filtered = [];
    if (filter === 'all') {
      filtered = nonArchivedGroups;
    } else if (filter === 'unread') {
      filtered = nonArchivedGroups.filter(group => (group.unreadCount || 0) > 0);
    } else if (filter === 'favorites') {
      filtered = nonArchivedGroups.filter(group => group.isFavorite === true);
    } else if (filter === 'archived') {
      filtered = groupsList.filter(group => isGroupArchived(group));
    } else {
      filtered = nonArchivedGroups;
    }
    
    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(group => {
        const name = (group.name || '').toLowerCase();
        return name.includes(query);
      });
    }
    
    return filtered;
  }, [groups, filter, userEmail, searchQuery]);

  // Get archived chats separately for "All" filter
  const archivedContacts = useMemo(() => {
    let archived = contacts.filter(contact => contact.isArchived === true);
    
    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      archived = archived.filter(contact => {
        const name = (contact.name || getUsernameFromEmail(contact.email)).toLowerCase();
        const email = (contact.email || '').toLowerCase();
        return name.includes(query) || email.includes(query);
      });
    }
    
    return archived;
  }, [contacts, searchQuery]);

  const archivedGroups = useMemo(() => {
    const groupsList = groups || [];
    const isGroupArchived = (group) => {
      if (!group.archivedBy || !Array.isArray(group.archivedBy)) return false;
      return userEmail && group.archivedBy.includes(userEmail);
    };
    
    let archived = groupsList.filter(group => isGroupArchived(group));
    
    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      archived = archived.filter(group => {
        const name = (group.name || '').toLowerCase();
        return name.includes(query);
      });
    }
    
    return archived;
  }, [groups, userEmail, searchQuery]);

  // Combined data for display (groups + filtered contacts)
  const combinedData = useMemo(() => {
    // If archived section is expanded, show only archived chats
    if (isArchivedExpanded && filter === 'all' && (archivedContacts.length > 0 || archivedGroups.length > 0)) {
      const archivedGroupsData = archivedGroups.map(g => ({ ...g, type: 'group', isArchived: true }));
      const archivedContactsData = archivedContacts.map(c => ({ ...c, type: 'contact', isArchived: true }));
      return [
        { type: 'section-header', id: 'archived-header' }, // Section header at top
        ...archivedGroupsData,
        ...archivedContactsData,
      ];
    }
    
    // Always include filtered groups (they handle their own filtering)
    const groupsData = filteredGroups.map(g => ({ ...g, type: 'group' }));
    // Include filtered contacts
    const contactsData = (filteredContacts || []).map(c => ({ ...c, type: 'contact' }));
    
    // If filter is 'all' and there are archived chats, add header at top (but don't show archived chats)
    if (filter === 'all' && (archivedContacts.length > 0 || archivedGroups.length > 0)) {
      return [
        { type: 'section-header', id: 'archived-header' }, // Section header at top
        ...groupsData,
        ...contactsData,
      ];
    }
    
    return [...groupsData, ...contactsData];
  }, [filteredGroups, filteredContacts, filter, archivedContacts, archivedGroups, isArchivedExpanded]);

  const handleToggleFavorite = useCallback(async (contactEmail, e) => {
    e?.stopPropagation(); // Prevent triggering onSelectContact
    setTogglingFavorite(contactEmail);
    const result = await contactsService.toggleFavorite(contactEmail);
    if (result.success && onContactsUpdate) {
      await onContactsUpdate();
    }
    setTogglingFavorite(null);
  }, [onContactsUpdate]);

  const handleToggleGroupFavorite = useCallback(async (groupId, e) => {
    e?.stopPropagation(); // Prevent triggering onSelectGroup
    setTogglingGroupFavorite(groupId);
    const result = await groupService.toggleFavorite(groupId);
    if (result.success && onGroupsUpdate) {
      await onGroupsUpdate();
    }
    setTogglingGroupFavorite(null);
  }, [onGroupsUpdate]);

  // Handle chat selection (long press)
  const handleChatLongPress = useCallback((type, id) => {
    const chatKey = `${type}-${id}`;
    setSelectedChats(prev => {
      const exists = prev.some(c => `${c.type}-${c.id}` === chatKey);
      if (exists) {
        return prev.filter(c => `${c.type}-${c.id}` !== chatKey);
      } else {
        return [...prev, { type, id }];
      }
    });
  }, []);

  // Handle chat press (normal press)
  const handleChatPress = useCallback((type, id, email) => {
    if (selectedChats.length > 0) {
      // If in selection mode, toggle selection
      handleChatLongPress(type, id);
    } else {
      // Normal press - open chat
      if (type === 'contact' && email && onSelectContact) {
        onSelectContact(email);
      } else if (type === 'group' && id && onSelectGroup) {
        onSelectGroup(id);
      }
    }
  }, [selectedChats, handleChatLongPress, onSelectContact, onSelectGroup]);

  // Check if chat is selected
  const isChatSelected = useCallback((type, id) => {
    return selectedChats.some(c => c.type === type && c.id === id);
  }, [selectedChats]);

  // Action handlers
  const handleDelete = useCallback(async () => {
    if (selectedChats.length === 0) return;
    
    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete ${selectedChats.length} chat(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            for (const chat of selectedChats) {
              if (chat.type === 'contact') {
                await contactsService.deleteContact(chat.id);
              } else if (chat.type === 'group') {
                // Groups are deleted by creator only, so we'll just exit
                // This can be enhanced later
              }
            }
            setSelectedChats([]);
            if (onContactsUpdate) await onContactsUpdate();
            if (onGroupsUpdate) await onGroupsUpdate();
          },
        },
      ]
    );
  }, [selectedChats, onContactsUpdate, onGroupsUpdate]);

  const handlePin = useCallback(async () => {
    if (selectedChats.length === 0) return;
    
    for (const chat of selectedChats) {
      if (chat.type === 'contact') {
        await contactsService.togglePin(chat.id);
      } else if (chat.type === 'group') {
        await groupService.togglePin(chat.id);
      }
    }
    setSelectedChats([]);
    if (onContactsUpdate) await onContactsUpdate();
    if (onGroupsUpdate) await onGroupsUpdate();
  }, [selectedChats, onContactsUpdate, onGroupsUpdate]);

  const handleArchive = useCallback(async () => {
    if (selectedChats.length === 0) return;
    
    for (const chat of selectedChats) {
      if (chat.type === 'contact') {
        await contactsService.toggleArchive(chat.id);
      } else if (chat.type === 'group') {
        await groupService.toggleArchive(chat.id);
      }
    }
    setSelectedChats([]);
    if (onContactsUpdate) await onContactsUpdate();
    if (onGroupsUpdate) await onGroupsUpdate();
  }, [selectedChats, onContactsUpdate, onGroupsUpdate]);

  const handleMute = useCallback(async () => {
    if (selectedChats.length === 0) return;
    
    for (const chat of selectedChats) {
      if (chat.type === 'contact') {
        await contactsService.toggleMute(chat.id);
      } else if (chat.type === 'group') {
        await groupService.toggleMute(chat.id);
      }
    }
    setSelectedChats([]);
    if (onContactsUpdate) await onContactsUpdate();
    if (onGroupsUpdate) await onGroupsUpdate();
  }, [selectedChats, onContactsUpdate, onGroupsUpdate]);

  const handleToggleFavoriteFromSelection = useCallback(async () => {
    if (selectedChats.length === 0) return;
    
    for (const chat of selectedChats) {
      if (chat.type === 'contact') {
        await contactsService.toggleFavorite(chat.id);
      } else if (chat.type === 'group') {
        await groupService.toggleFavorite(chat.id);
      }
    }
    setSelectedChats([]);
    if (onContactsUpdate) await onContactsUpdate();
    if (onGroupsUpdate) await onGroupsUpdate();
  }, [selectedChats, onContactsUpdate, onGroupsUpdate]);

  const handleCloseSelection = useCallback(() => {
    setSelectedChats([]);
  }, []);

  const renderContactItem = useCallback(({ item }) => {
    const name = item.name || getUsernameFromEmail(item.email);
    const isOnline = item.isOnline || false;
    const unreadCount = item.unreadCount || 0;
    const isFavorite = item.isFavorite || false;
    const isMuted = item.isMuted === true; // Explicitly check for true
    const isToggling = togglingFavorite === item.email;
    const isSelected = isChatSelected('contact', item.email);
    
    return (
      <TouchableOpacity
        style={[
          styles.contactItem,
          { borderBottomColor: colors.divider },
          isSelected && { backgroundColor: colors.primaryLight + '40' }
        ]}
        onPress={() => {
          if (item.exists) {
            handleChatPress('contact', item.email, item.email);
          }
        }}
        onLongPress={() => {
          if (item.exists) {
            handleChatLongPress('contact', item.email);
          }
        }}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.white }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <View style={styles.contactNameRow}>
            <Text style={[styles.contactName, { color: colors.text }]}>{name}</Text>
            {isMuted && <Text style={styles.muteIcon}>🔇</Text>}
          </View>
          <Text style={[styles.contactEmail, { color: colors.textSecondary }]} numberOfLines={1}>{item.email}</Text>
        </View>
        {item.exists ? (
          <View style={styles.statusContainer}>
            {!isSelected && (
              <>
            {isFavorite && (
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={(e) => handleToggleFavorite(item.email, e)}
                disabled={isToggling}
              >
                {isToggling ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.favoriteButtonText, { color: '#FFD700' }]}>
                    ⭐
                  </Text>
                )}
              </TouchableOpacity>
            )}
            <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.online : colors.offline }]} />
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.unreadBadgeText, { color: colors.white }]}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
                  </View>
                )}
              </>
            )}
            {isSelected && (
              <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                <Text style={styles.selectedCheckmark}>✓</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={() => onSaveContact(item.email)}
            >
              <Text style={styles.saveButtonText}>💾</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inviteButton, { backgroundColor: colors.primaryLight }]}
              onPress={() => onInvite(item.email)}
            >
              <Text style={styles.inviteButtonText}>📤</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [colors, handleToggleFavorite, togglingFavorite, onSelectContact, onSaveContact, onInvite, isChatSelected, handleChatPress, handleChatLongPress]);

  // Get status for action bar
  const getActionBarStatus = useCallback(() => {
    if (selectedChats.length === 0) return { isPinned: false, isArchived: false, isMuted: false, isFavorite: false };
    
    // Check if all selected chats are favorited
    const allFavorited = selectedChats.every(chat => {
      if (chat.type === 'contact') {
        const contact = contacts.find(c => c.email === chat.id);
        return contact?.isFavorite === true;
      } else if (chat.type === 'group') {
        const group = groups.find(g => g._id === chat.id);
        return group?.isFavorite === true;
      }
      return false;
    });
    
    // Check if all selected chats are archived
    const allArchived = selectedChats.every(chat => {
      if (chat.type === 'contact') {
        const contact = contacts.find(c => c.email === chat.id);
        return contact?.isArchived === true;
      } else if (chat.type === 'group') {
        const group = groups.find(g => g._id === chat.id);
        return userEmail && group?.archivedBy && group.archivedBy.includes(userEmail);
      }
      return false;
    });
    
    return { isPinned: false, isArchived: allArchived, isMuted: false, isFavorite: allFavorited };
  }, [selectedChats, contacts, groups, userEmail]);

  const actionBarStatus = getActionBarStatus();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChatActionBar
        visible={selectedChats.length > 0}
        selectedCount={selectedChats.length}
        onDelete={handleDelete}
        onPin={handlePin}
        onArchive={handleArchive}
        onMute={handleMute}
        onFavorite={handleToggleFavoriteFromSelection}
        onClose={handleCloseSelection}
        isPinned={actionBarStatus.isPinned}
        isArchived={actionBarStatus.isArchived}
        isMuted={actionBarStatus.isMuted}
        isFavorite={actionBarStatus.isFavorite}
      />
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.title, { color: colors.text }]}>Recent Chats</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.newChatButton, { backgroundColor: colors.primary }]}
            onPress={onCreateGroup}
          >
            <Text style={[styles.newChatButtonText, { color: colors.white }]}>+ Group</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.newChatButton, { backgroundColor: colors.primary, marginLeft: SPACING.sm }]}
            onPress={onNewChat}
          >
            <Text style={[styles.newChatButtonText, { color: colors.white }]}>+ Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { borderBottomColor: colors.divider }]}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: colors.inputBackground || colors.background,
            color: colors.text,
            borderColor: colors.divider
          }]}
          placeholder="Search by name or email..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { borderColor: filter === 'all' ? colors.primary : colors.divider },
            filter === 'all' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterTabText,
            { color: filter === 'all' ? colors.white : colors.textSecondary }
          ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { borderColor: filter === 'unread' ? colors.primary : colors.divider },
            filter === 'unread' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[
            styles.filterTabText,
            { color: filter === 'unread' ? colors.white : colors.textSecondary }
          ]}>
            Unread
          </Text>
          {(contacts.filter(c => c.unreadCount > 0).length + (groups || []).filter(g => (g.unreadCount || 0) > 0).length) > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: filter === 'unread' ? colors.white : colors.primary }]}>
              <Text style={[styles.filterBadgeText, { color: filter === 'unread' ? colors.primary : colors.white }]}>
                {contacts.filter(c => c.unreadCount > 0).length + (groups || []).filter(g => (g.unreadCount || 0) > 0).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { borderColor: filter === 'favorites' ? colors.primary : colors.divider },
            filter === 'favorites' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setFilter('favorites')}
        >
          <Text style={[
            styles.filterTabText,
            { color: filter === 'favorites' ? colors.white : colors.textSecondary }
          ]}>
            Favorites
          </Text>
          {(contacts.filter(c => c.isFavorite === true).length + (groups || []).filter(g => g.isFavorite === true).length) > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: filter === 'favorites' ? colors.white : colors.primary }]}>
              <Text style={[styles.filterBadgeText, { color: filter === 'favorites' ? colors.primary : colors.white }]}>
                {contacts.filter(c => c.isFavorite === true).length + (groups || []).filter(g => g.isFavorite === true).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {combinedData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {filter === 'all' ? 'No recent chats' 
              : filter === 'unread' ? 'No unread messages' 
              : filter === 'favorites' ? 'No favorite contacts or groups'
              : 'No archived chats'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {filter === 'all' 
              ? 'Start a new chat or create a group to see conversations here'
              : filter === 'unread'
              ? 'All messages are read'
              : filter === 'favorites'
              ? 'Mark contacts as favorite to see them here'
              : 'Archive chats to see them here'}
          </Text>
          {filter === 'all' && (
            <View style={styles.emptyButtons}>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={onNewChat}
              >
                <Text style={[styles.emptyButtonText, { color: colors.white }]}>New Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary, marginLeft: SPACING.md }]}
                onPress={onCreateGroup}
              >
                <Text style={[styles.emptyButtonText, { color: colors.white }]}>Create Group</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={combinedData}
          renderItem={({ item }) => {
            // Render section header for Archived
            if (item.type === 'section-header' && item.id === 'archived-header') {
              return (
                <TouchableOpacity
                  style={[styles.sectionHeader, { borderTopColor: colors.divider, borderBottomColor: colors.divider }]}
                  onPress={() => setIsArchivedExpanded(!isArchivedExpanded)}
                >
                  <View style={[styles.sectionHeaderIconContainer, { borderColor: colors.textSecondary }]}>
                    <Text style={[styles.sectionHeaderIcon, { color: colors.textSecondary }]}>
                      {isArchivedExpanded ? '⬇' : '▶'}
                    </Text>
                  </View>
                  <Text style={[styles.sectionHeaderText, { color: colors.text }]}>Archived</Text>
                </TouchableOpacity>
              );
            }
            
            if (item.type === 'group') {
              const isFavorite = item.isFavorite || false;
              const unreadCount = item.unreadCount || 0;
              const isMuted = item.isMuted === true; // Explicitly check for true
              const isToggling = togglingGroupFavorite === item._id;
              const isSelected = isChatSelected('group', item._id);
              
              return (
                <TouchableOpacity
                  style={[
                    styles.contactItem,
                    { borderBottomColor: colors.divider },
                    isSelected && { backgroundColor: colors.primaryLight + '40' }
                  ]}
                  onPress={() => handleChatPress('group', item._id)}
                  onLongPress={() => handleChatLongPress('group', item._id)}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.avatarText, { color: colors.white, fontSize: TYPOGRAPHY.fontSize.xl }]}>
                      👥
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <View style={styles.contactNameRow}>
                      <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
                      {isMuted && <Text style={styles.muteIcon}>🔇</Text>}
                    </View>
                    <Text style={[styles.contactEmail, { color: colors.textSecondary }]}>
                      {item.members?.length || 0} members
                    </Text>
                  </View>
                  <View style={styles.statusContainer}>
                    {!isSelected && (
                      <>
                    {isFavorite && (
                      <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={(e) => handleToggleGroupFavorite(item._id, e)}
                        disabled={isToggling}
                      >
                        {isToggling ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Text style={[styles.favoriteButtonText, { color: '#FFD700' }]}>
                            ⭐
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {unreadCount > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.unreadBadgeText, { color: colors.white }]}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                          </View>
                        )}
                      </>
                    )}
                    {isSelected && (
                      <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                        <Text style={styles.selectedCheckmark}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            } else {
              return renderContactItem({ item });
            }
          }}
          keyExtractor={(item) => {
            if (item.type === 'section-header') return item.id;
            return item.type === 'group' ? `group-${item._id}` : `contact-${item.email}`;
          }}
          style={styles.list}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  newChatButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  newChatButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  filterTabText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterBadge: {
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  list: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
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
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  contactInfo: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  contactName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  favoriteIcon: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  contactEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: SPACING.xs,
  },
  unreadBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  favoriteButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 20,
  },
  inviteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  emptyButtons: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  searchContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    borderWidth: 1,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  selectedCheckmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  muteIcon: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginLeft: SPACING.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  sectionHeaderIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderIcon: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  sectionHeaderText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default RecentChats;

