import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { COLORS } from '../../../constants';
import MessageItem from '../MessageItem';
import styles from './ChatSearchModal.styles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChatSearchModal = ({ 
  visible, 
  onClose, 
  messages = [],
  userEmail,
  contactName,
  isGroup = false
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    return messages.filter(msg => {
      // Skip deleted messages
      if (msg.isDeleted) return false;
      
      // Get message text
      let messageText = '';
      if (typeof msg.message === 'string') {
        // Try to parse as JSON (for file messages)
        try {
          const parsed = JSON.parse(msg.message);
          if (parsed && parsed.type === 'file') {
            // For file messages, search in filename
            messageText = parsed.fileName || parsed.name || '';
          } else {
            messageText = msg.message;
          }
        } catch {
          // Not JSON, use as-is
          messageText = msg.message;
        }
      } else {
        messageText = msg.message?.message || msg.message?.text || String(msg.message || '');
      }
      
      // Check if message text contains the search query
      return messageText.toLowerCase().includes(query);
    });
  }, [messages, searchQuery]);

  const handleMessagePress = (message) => {
    // Scroll to message in chat (this would need to be implemented via callback)
    onClose();
  };

  const renderMessageItem = ({ item }) => {
    const senderName = isGroup 
      ? (item.senderEmail === userEmail ? 'You' : (item.senderName || item.senderEmail?.split('@')[0] || 'Unknown'))
      : (item.isSent ? 'You' : (contactName || 'Contact'));

    return (
      <TouchableOpacity
        onPress={() => handleMessagePress(item)}
        style={[styles.messageItemContainer, { backgroundColor: colors.background }]}
      >
        <MessageItem
          message={item.message}
          username={senderName}
          timestamp={item.timestamp}
          isSent={item.isSent}
          status={item.status}
          messageId={item.messageId}
          isGroup={isGroup}
          userEmail={userEmail}
          isDeleted={item.isDeleted}
          editedAt={item.editedAt}
          replyTo={item.replyTo}
          replyToMessage={item.replyToMessage}
          replyToSender={item.replyToSender}
          isCallMessage={item.isCallMessage}
          callRecord={item.callRecord}
          isBillSplit={item.isBillSplit}
          billSplitData={item.billSplitData}
        />
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
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Search Messages</Text>
            <View style={styles.closeButton} />
          </View>

          {/* Search Input */}
          <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search messages..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Text style={[styles.clearIcon, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Results */}
          <View style={styles.resultsContainer}>
            {searchQuery.trim().length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Type to search messages
                </Text>
              </View>
            ) : filteredMessages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No messages found
                </Text>
              </View>
            ) : (
              <>
                <View style={[styles.resultsHeader, { borderBottomColor: colors.divider }]}>
                  <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                    {filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'} found
                  </Text>
                </View>
                <FlatList
                  data={filteredMessages}
                  renderItem={renderMessageItem}
                  keyExtractor={(item, index) => item.messageId || `search-${index}`}
                  contentContainerStyle={styles.messagesList}
                  showsVerticalScrollIndicator={true}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ChatSearchModal;

