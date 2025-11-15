import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SOCKET_EVENTS } from '../../constants';
import callService from '../../services/callService';
import socketService from '../../services/socketService';

const CallHistory = ({ visible, onClose, userEmail, contactEmail, groupId, isGroup = false, onCallPress }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'missed', 'outgoing', 'incoming'

  const loadCallHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = isGroup ? { groupId } : { contactEmail };
      const response = await callService.getCallHistory(params);
      setCalls(response.calls || []);
    } catch (error) {
      console.error('Error loading call history:', error);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, [contactEmail, groupId, isGroup]);

  useEffect(() => {
    if (visible) {
      loadCallHistory();
    }
  }, [visible, loadCallHistory]);

  // Listen to socket events to refresh call history
  useEffect(() => {
    if (!visible) return; // Only listen when modal is visible
    
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleCallEnded = () => {
      console.log('📞 CallHistory: Call ended, refreshing history...');
      loadCallHistory();
    };

    const handleCallInitiated = () => {
      console.log('📞 CallHistory: Call initiated, refreshing history...');
      loadCallHistory();
    };

    const handleCallMissed = () => {
      console.log('📞 CallHistory: Call missed, refreshing history...');
      loadCallHistory();
    };

    const handleCallFailed = () => {
      console.log('📞 CallHistory: Call failed, refreshing history...');
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
  }, [visible, loadCallHistory]);

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

  const filteredCalls = calls.filter(call => {
    if (filter === 'all') return true;
    if (filter === 'missed') return call.status === 'missed';
    if (filter === 'outgoing') return call.direction === 'outgoing';
    if (filter === 'incoming') return call.direction === 'incoming';
    return true;
  });

  const handleCallItemPress = async (call) => {
    if (onCallPress) {
      const targetEmail = isGroup ? null : (call.direction === 'outgoing' ? call.receiverEmail : call.callerEmail);
      const targetGroupId = isGroup ? call.groupId : null;
      await onCallPress(call.type, targetEmail, targetGroupId);
    }
  };

  const renderCallItem = ({ item }) => {
    const isOutgoing = item.direction === 'outgoing';
    const displayName = isGroup 
      ? (item.groupName || 'Group') 
      : (isOutgoing 
        ? (item.receiverName || item.receiverEmail?.split('@')[0] || 'Unknown')
        : (item.callerName || item.callerEmail?.split('@')[0] || 'Unknown'));

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
          {onCallPress && (
            <TouchableOpacity
              style={styles.callAgainButton}
              onPress={() => handleCallItemPress(item)}
            >
              <Text style={styles.callAgainIcon}>{getCallTypeIcon(item.type)}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBackground} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Call History</Text>
          <View style={styles.placeholder} />
        </View>

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

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : filteredCalls.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📞</Text>
            <Text style={styles.emptyText}>No call history</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCalls}
            renderItem={renderCallItem}
            keyExtractor={(item, index) => `call-${item._id || index}-${item.createdAt}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.headerBackground,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.headerText,
  },
  placeholder: {
    width: 40,
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
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
});

export default CallHistory;

