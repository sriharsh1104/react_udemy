import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SOCKET_EVENTS } from '../../constants';
import callService from '../../services/callService';
import socketService from '../../services/socketService';
import contactsService from '../../services/contactsService';
import { Alert } from 'react-native';

const CallHistoryTab = ({ userEmail, onCallPress }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'missed', 'outgoing', 'incoming'
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [searchingContacts, setSearchingContacts] = useState(false);
  const [filteredContactsFromAPI, setFilteredContactsFromAPI] = useState([]);

  const loadCallHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await callService.getCallHistory({});
      // Handle both response formats: { calls: [...] } or just the array
      if (response && Array.isArray(response.calls)) {
        setCalls(response.calls);
      } else if (Array.isArray(response)) {
        setCalls(response);
      } else {
        setCalls([]);
      }
    } catch (error) {
      console.error('Error loading call history:', error);
      setCalls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const result = await contactsService.getContacts();
      if (result.success && result.contacts) {
        setContacts(result.contacts || []);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }, []);

  // Prevent multiple simultaneous API calls
  const isInitialized = useRef(false);
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    loadCallHistory();
    loadContacts();
  }, [loadCallHistory, loadContacts]);

  // Listen to socket events to refresh call history
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleCallEnded = () => {
      loadCallHistory();
    };

    const handleCallInitiated = () => {
      loadCallHistory();
    };

    const handleCallMissed = () => {
      loadCallHistory();
    };

    const handleCallFailed = () => {
      loadCallHistory();
    };

    socket.on(SOCKET_EVENTS.CALL_ENDED, handleCallEnded);
    socket.on(SOCKET_EVENTS.CALL_INITIATED, handleCallInitiated);
    socket.on(SOCKET_EVENTS.CALL_MISSED, handleCallMissed);
    socket.on(SOCKET_EVENTS.CALL_FAILED, handleCallFailed);

    return () => {
      socket.off(SOCKET_EVENTS.CALL_ENDED, handleCallEnded);
      socket.off(SOCKET_EVENTS.CALL_INITIATED, handleCallInitiated);
      socket.off(SOCKET_EVENTS.CALL_MISSED, handleCallMissed);
      socket.off(SOCKET_EVENTS.CALL_FAILED, handleCallFailed);
    };
  }, [loadCallHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCallHistory();
  };

  const getCallTypeIcon = (type) => {
    return type === 'video' ? '📹' : '📞';
  };

  const getCallStatusIcon = (status, direction) => {
    if (status === 'missed') return '❌';
    if (status === 'declined') return '🚫';
    if (status === 'busy') return '⏸️';
    if (status === 'failed') return '⚠️';
    if (status === 'completed') return direction === 'outgoing' ? '📤' : '📥';
    return '🔄';
  };

  const getCallStatusText = (status, direction) => {
    if (status === 'missed') return 'Missed';
    if (status === 'declined') return 'Declined';
    if (status === 'busy') return 'Busy';
    if (status === 'failed') return 'Failed';
    if (status === 'completed') return direction === 'outgoing' ? 'Outgoing' : 'Incoming';
    if (status === 'ringing') return 'Ringing';
    if (status === 'connecting') return 'Connecting';
    return status;
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getDisplayName = (call) => {
    const isOutgoing = call.direction === 'outgoing';
    if (call.groupId) {
      return call.groupName || 'Group Call';
    }
    if (isOutgoing) {
      return call.receiverName || call.receiverEmail?.split('@')[0] || 'Unknown';
    } else {
      return call.callerName || call.callerEmail?.split('@')[0] || 'Unknown';
    }
  };

  // Extract unique contacts from call history
  const uniqueContacts = useMemo(() => {
    const contactMap = new Map();
    
    calls.forEach(call => {
      if (call.groupId) {
        // Group calls
        const key = `group_${call.groupId}`;
        if (!contactMap.has(key)) {
          contactMap.set(key, {
            id: key,
            type: 'group',
            groupId: call.groupId,
            name: call.groupName || 'Group Call',
            email: null,
            lastCallTime: call.createdAt,
          });
        } else {
          const existing = contactMap.get(key);
          if (new Date(call.createdAt) > new Date(existing.lastCallTime)) {
            existing.lastCallTime = call.createdAt;
          }
        }
      } else {
        // Private calls
        const isOutgoing = call.direction === 'outgoing';
        const contactEmail = isOutgoing ? call.receiverEmail : call.callerEmail;
        const contactName = isOutgoing 
          ? (call.receiverName || call.receiverEmail?.split('@')[0] || 'Unknown')
          : (call.callerName || call.callerEmail?.split('@')[0] || 'Unknown');
        
        if (contactEmail && contactEmail !== userEmail) {
          if (!contactMap.has(contactEmail)) {
            contactMap.set(contactEmail, {
              id: contactEmail,
              type: 'contact',
              email: contactEmail,
              name: contactName,
              groupId: null,
              lastCallTime: call.createdAt,
            });
          } else {
            const existing = contactMap.get(contactEmail);
            if (new Date(call.createdAt) > new Date(existing.lastCallTime)) {
              existing.lastCallTime = call.createdAt;
            }
            // Update name if we have a better one
            if (contactName && contactName !== 'Unknown' && existing.name === 'Unknown') {
              existing.name = contactName;
            }
          }
        }
      }
    });
    
    return Array.from(contactMap.values()).sort((a, b) => 
      new Date(b.lastCallTime) - new Date(a.lastCallTime)
    );
  }, [calls, userEmail]);

  // Search contacts from API when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContactsFromAPI([]);
      return;
    }

    const searchContacts = async () => {
      setSearchingContacts(true);
      try {
        const query = searchQuery.trim().toLowerCase();
        
        // Filter contacts from API
        const apiContacts = contacts
          .filter(contact => {
            const name = (contact.name || contact.contactName || '').toLowerCase();
            const email = (contact.email || contact.contactEmail || '').toLowerCase();
            return name.includes(query) || email.includes(query);
          })
          .map(contact => ({
            id: contact.email || contact.contactEmail,
            type: 'contact',
            email: contact.email || contact.contactEmail,
            name: contact.name || contact.contactName || contact.email?.split('@')[0] || 'Unknown',
            groupId: null,
          }));

        // Also filter call history contacts
        const callHistoryContacts = uniqueContacts.filter(contact => {
          const name = contact.name?.toLowerCase() || '';
          const email = contact.email?.toLowerCase() || '';
          return name.includes(query) || email.includes(query);
        });

        // Combine and deduplicate by email
        const combined = [...apiContacts, ...callHistoryContacts];
        const contactMap = new Map();
        combined.forEach(contact => {
          if (contact.email && !contactMap.has(contact.email)) {
            contactMap.set(contact.email, contact);
          } else if (contact.groupId && !contactMap.has(contact.id)) {
            contactMap.set(contact.id, contact);
          }
        });

        setFilteredContactsFromAPI(Array.from(contactMap.values()));
      } catch (error) {
        console.error('Error searching contacts:', error);
      } finally {
        setSearchingContacts(false);
      }
    };

    const timeoutId = setTimeout(searchContacts, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery, contacts, uniqueContacts]);

  // Filter contacts based on search query (fallback to call history only)
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    // Use API search results if available
    if (filteredContactsFromAPI.length > 0) {
      return filteredContactsFromAPI;
    }
    
    // Fallback to call history contacts
    const query = searchQuery.toLowerCase().trim();
    return uniqueContacts.filter(contact => {
      const name = contact.name?.toLowerCase() || '';
      const email = contact.email?.toLowerCase() || '';
      return name.includes(query) || email.includes(query);
    });
  }, [searchQuery, filteredContactsFromAPI, uniqueContacts]);

  const filteredCalls = calls.filter(call => {
    if (filter === 'all') return true;
    if (filter === 'missed') return call.status === 'missed';
    if (filter === 'outgoing') return call.direction === 'outgoing';
    if (filter === 'incoming') return call.direction === 'incoming';
    return true;
  });

  const handleCallItemPress = async (call) => {
    try {
      const targetEmail = call.groupId ? null : (call.direction === 'outgoing' ? call.receiverEmail : call.callerEmail);
      const targetGroupId = call.groupId || null;
      
      if (onCallPress) {
        await onCallPress(call.type, targetEmail, targetGroupId);
      } else {
        Alert.alert('Error', 'Call functionality not available');
      }
    } catch (error) {
      console.error('Error calling from history:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  };

  const handleCallFromSearch = async (type, contact) => {
    try {
      if (onCallPress) {
        await onCallPress(type, contact.email, contact.groupId);
        setSearchQuery(''); // Clear search after calling
      } else {
        Alert.alert('Error', 'Call functionality not available');
      }
    } catch (error) {
      console.error('Error calling from search:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  };

  const renderSearchResult = ({ item }) => {
    return (
      <View style={styles.searchResultItem}>
        <View style={styles.searchResultLeft}>
          <View style={styles.searchResultIconContainer}>
            <Text style={styles.searchResultIcon}>
              {item.type === 'group' ? '👥' : '👤'}
            </Text>
          </View>
          <View style={styles.searchResultInfo}>
            <Text style={styles.searchResultName} numberOfLines={1}>{item.name}</Text>
            {item.email && (
              <Text style={styles.searchResultEmail} numberOfLines={1}>{item.email}</Text>
            )}
          </View>
        </View>
        <View style={styles.searchResultActions}>
          <TouchableOpacity
            style={[styles.callActionButton, styles.audioCallButton]}
            onPress={() => handleCallFromSearch('audio', item)}
            activeOpacity={0.7}
          >
            <Text style={styles.callActionIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.callActionButton, styles.videoCallButton, { marginLeft: SPACING.sm }]}
            onPress={() => handleCallFromSearch('video', item)}
            activeOpacity={0.7}
          >
            <Text style={styles.callActionIcon}>📹</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCallItem = ({ item }) => {
    const displayName = getDisplayName(item);
    const isOutgoing = item.direction === 'outgoing';

    return (
      <TouchableOpacity
        style={styles.callItem}
        onPress={() => handleCallItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.callItemLeft}>
          <View style={styles.callIconContainer}>
            <Text style={styles.callTypeIcon}>{getCallTypeIcon(item.type)}</Text>
          </View>
          <View style={styles.callInfo}>
            <Text style={styles.callName} numberOfLines={1}>{displayName}</Text>
            <View style={styles.callStatusRow}>
              <Text style={styles.callStatusIcon}>{getCallStatusIcon(item.status, item.direction)}</Text>
              <Text style={styles.callStatusText}>{getCallStatusText(item.status, item.direction)}</Text>
              {item.duration > 0 && (
                <>
                  <Text style={styles.callDurationSeparator}> • </Text>
                  <Text style={styles.callDuration}>{formatDuration(item.duration)}</Text>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={styles.callItemRight}>
          <Text style={styles.callTime}>{formatDate(item.createdAt)}</Text>
          <TouchableOpacity
            style={styles.callAgainButton}
            onPress={() => handleCallItemPress(item)}
          >
            <Text style={styles.callAgainIcon}>{getCallTypeIcon(item.type)}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results */}
      {searchQuery.trim().length > 0 && (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.searchResultsTitle}>
            {searchingContacts 
              ? 'Searching...'
              : filteredContacts.length > 0 
                ? `Found ${filteredContacts.length} contact${filteredContacts.length > 1 ? 's' : ''}`
                : 'No contacts found'}
          </Text>
          {searchingContacts ? (
            <View style={styles.searchLoadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              style={styles.searchResultsList}
              contentContainerStyle={styles.searchResultsContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'missed' && styles.filterButtonActive]}
          onPress={() => setFilter('missed')}
        >
          <Text style={[styles.filterText, filter === 'missed' && styles.filterTextActive]}>Missed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'outgoing' && styles.filterButtonActive]}
          onPress={() => setFilter('outgoing')}
        >
          <Text style={[styles.filterText, filter === 'outgoing' && styles.filterTextActive]}>Outgoing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'incoming' && styles.filterButtonActive]}
          onPress={() => setFilter('incoming')}
        >
          <Text style={[styles.filterText, filter === 'incoming' && styles.filterTextActive]}>Incoming</Text>
        </TouchableOpacity>
      </View>

      {!searchQuery.trim() && (
        <>
          {loading && calls.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading call history...</Text>
            </View>
          ) : filteredCalls.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📞</Text>
              <Text style={styles.emptyText}>No call history</Text>
              <Text style={styles.emptySubtext}>Your call history will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCalls}
              renderItem={renderCallItem}
              keyExtractor={(item, index) => `call-${item._id || index}-${item.createdAt}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />
              }
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
    color: COLORS.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  clearIcon: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchResultsTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultsContent: {
    padding: SPACING.md,
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchResultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  searchResultIcon: {
    fontSize: 20,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  searchResultEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  searchResultActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioCallButton: {
    backgroundColor: COLORS.primary,
  },
  videoCallButton: {
    backgroundColor: '#10B981', // Green color for video calls
  },
  callActionIcon: {
    fontSize: 18,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.receivedMessage,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  listContent: {
    padding: SPACING.md,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  callItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  callIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  callTypeIcon: {
    fontSize: 20,
  },
  callInfo: {
    flex: 1,
  },
  callName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  callStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callStatusIcon: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginRight: SPACING.xs,
  },
  callStatusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  callDurationSeparator: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  callDuration: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  callItemRight: {
    alignItems: 'flex-end',
  },
  callTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  callAgainButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callAgainIcon: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});

export default CallHistoryTab;

