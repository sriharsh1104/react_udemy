import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import contactsService from '../../services/contactsService';
import groupService from '../../services/groupService';

const RecentChats = ({ contacts, groups = [], onSelectContact, onSelectGroup, onNewChat, onCreateGroup, onSaveContact, onInvite, onContactsUpdate, onGroupsUpdate }) => {
  const { colors } = useTheme();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'favorites'
  const [togglingFavorite, setTogglingFavorite] = useState(null);
  const [togglingGroupFavorite, setTogglingGroupFavorite] = useState(null);

  const getUsernameFromEmail = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  // Filter contacts based on selected filter (groups are always shown in 'all' filter)
  const filteredContacts = useMemo(() => {
    if (filter === 'all') {
      return contacts;
    } else if (filter === 'unread') {
      return contacts.filter(contact => contact.unreadCount > 0);
    } else if (filter === 'favorites') {
      return contacts.filter(contact => contact.isFavorite === true);
    }
    return contacts;
  }, [contacts, filter]);

  // Filter groups based on selected filter
  const filteredGroups = useMemo(() => {
    if (filter === 'all') {
      return groups || [];
    } else if (filter === 'unread') {
      return (groups || []).filter(group => (group.unreadCount || 0) > 0);
    } else if (filter === 'favorites') {
      return (groups || []).filter(group => group.isFavorite === true);
    }
    return groups || [];
  }, [groups, filter]);

  // Combined data for display (groups + filtered contacts)
  const combinedData = useMemo(() => {
    // Always include filtered groups (they handle their own filtering)
    const groupsData = filteredGroups.map(g => ({ ...g, type: 'group' }));
    // Include filtered contacts
    const contactsData = (filteredContacts || []).map(c => ({ ...c, type: 'contact' }));
    return [...groupsData, ...contactsData];
  }, [filteredGroups, filteredContacts]);

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

  const renderContactItem = useCallback(({ item }) => {
    const name = item.name || getUsernameFromEmail(item.email);
    const isOnline = item.isOnline || false;
    const unreadCount = item.unreadCount || 0;
    const isFavorite = item.isFavorite || false;
    const isToggling = togglingFavorite === item.email;
    
    return (
      <TouchableOpacity
        style={[styles.contactItem, { borderBottomColor: colors.divider }]}
        onPress={() => {
          if (item.exists) {
            onSelectContact(item.email);
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
            {isFavorite && <Text style={styles.favoriteIcon}>⭐</Text>}
          </View>
          <Text style={[styles.contactEmail, { color: colors.textSecondary }]} numberOfLines={1}>{item.email}</Text>
        </View>
        {item.exists ? (
          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={(e) => handleToggleFavorite(item.email, e)}
              disabled={isToggling}
            >
              {isToggling ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.favoriteButtonText, { color: isFavorite ? '#FFD700' : colors.textSecondary }]}>
                  ⭐
                </Text>
              )}
            </TouchableOpacity>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.online : colors.offline }]} />
            <Text style={[styles.statusText, { color: isOnline ? colors.online : colors.textSecondary }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.unreadBadgeText, { color: colors.white }]}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
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
  }, [colors, handleToggleFavorite, togglingFavorite, onSelectContact, onSaveContact, onInvite]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            {filter === 'all' ? 'No recent chats' : filter === 'unread' ? 'No unread messages' : 'No favorite contacts or groups'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {filter === 'all' 
              ? 'Start a new chat or create a group to see conversations here'
              : filter === 'unread'
              ? 'All messages are read'
              : 'Mark contacts as favorite to see them here'}
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
            if (item.type === 'group') {
              const isFavorite = item.isFavorite || false;
              const unreadCount = item.unreadCount || 0;
              const isToggling = togglingGroupFavorite === item._id;
              
              return (
                <TouchableOpacity
                  style={[styles.contactItem, { borderBottomColor: colors.divider }]}
                  onPress={() => onSelectGroup && onSelectGroup(item._id)}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.avatarText, { color: colors.white, fontSize: TYPOGRAPHY.fontSize.xl }]}>
                      👥
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <View style={styles.contactNameRow}>
                      <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
                      {isFavorite && <Text style={styles.favoriteIcon}>⭐</Text>}
                    </View>
                    <Text style={[styles.contactEmail, { color: colors.textSecondary }]}>
                      {item.members?.length || 0} members
                    </Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={(e) => handleToggleGroupFavorite(item._id, e)}
                      disabled={isToggling}
                    >
                      {isToggling ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={[styles.favoriteButtonText, { color: isFavorite ? '#FFD700' : colors.textSecondary }]}>
                          ⭐
                        </Text>
                      )}
                    </TouchableOpacity>
                    {unreadCount > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.unreadBadgeText, { color: colors.white }]}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            } else {
              return renderContactItem({ item });
            }
          }}
          keyExtractor={(item) => item.type === 'group' ? `group-${item._id}` : `contact-${item.email}`}
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
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
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
});

export default RecentChats;

