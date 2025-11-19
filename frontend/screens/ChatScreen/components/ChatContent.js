/**
 * ChatContent Component
 * Renders the main chat interface (messages, input, etc.)
 */

import React, { useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { View, FlatList, Text } from 'react-native';
import MessageItem from '../../../components/chat/MessageItem';
import TypingIndicator from '../../../components/chat/TypingIndicator';
import MessageInput from '../../../components/chat/MessageInput';
import MessageActionBar from '../../../components/chat/MessageActionBar';
import PinnedMessageBanner from '../../../components/chat/PinnedMessageBanner';
import styles from '../styles';

const ChatContent = ({
  messages,
  loadingMessages,
  flatListRef,
  renderMessage,
  currentTypingUser,
  inputMessage,
  handleTyping,
  handleSendMessage,
  handleFileSelect,
  userEmail,
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  setInputMessage,
  chatType,
  contactEmail,
  groupId,
  setShowBillSplitModal,
  selectedMessages,
  handleMessageSelect,
  handleMenuPress,
  handlePinMessage,
  handleUnpinMessage,
  handleActionBarCopy,
  handleActionBarReply,
  handleActionBarForward,
  handleActionBarPin,
  handleActionBarUnpin,
  handleActionBarDelete,
  handleActionBarInfo,
  handleActionBarClose,
  handleActionBarEdit,
  canEditMessage,
  pinnedMessage,
  handlePinnedMessagePress,
  handleUnpinFromBanner,
  currentGroup,
  colors,
  onScrollPositionChange,
}) => {
  const contentHeightRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  
  // Track scroll position to determine if user is at bottom (WhatsApp-like behavior)
  const handleScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    scrollOffsetRef.current = contentOffset.y;
    contentHeightRef.current = contentSize.height;
    
    // Check if user is near bottom (within 100px)
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    const isNearBottom = distanceFromBottom < 100;
    
    if (onScrollPositionChange) {
      onScrollPositionChange(isNearBottom);
    }
  }, [onScrollPositionChange]);
  
  // Auto-scroll to bottom when content size changes (new message) only if user is at bottom
  const handleContentSizeChange = useCallback((contentWidth, contentHeight) => {
    const previousHeight = contentHeightRef.current;
    const heightDiff = contentHeight - previousHeight;
    contentHeightRef.current = contentHeight;
    
    // Only auto-scroll if:
    // 1. New content was added (height increased)
    // 2. User is near bottom (within 100px)
    if (heightDiff > 0 && scrollOffsetRef.current + 100 >= previousHeight - 100) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [flatListRef]);
  return (
    <>
      {/* Message Action Bar */}
      <MessageActionBar
        visible={selectedMessages.length > 0}
        selectedCount={selectedMessages.length}
        isCreator={chatType === 'group' && currentGroup && currentGroup.createdBy === userEmail}
        isGroup={chatType === 'group'}
        isPinned={selectedMessages.length > 0 && selectedMessages[0].isPinned}
        onCopy={handleActionBarCopy}
        onReply={handleActionBarReply}
        onForward={handleActionBarForward}
        onPin={handleActionBarPin}
        onUnpin={handleActionBarUnpin}
        onDelete={handleActionBarDelete}
        onInfo={handleActionBarInfo}
        onClose={handleActionBarClose}
        onEdit={handleActionBarEdit}
        canEdit={canEditMessage()}
      />

      {/* Pinned Message Banner - Only for groups */}
      {chatType === 'group' && pinnedMessage && (
        <PinnedMessageBanner
          pinnedMessage={pinnedMessage}
          onPress={handlePinnedMessagePress}
          onClose={handleUnpinFromBanner}
          isCreator={currentGroup && currentGroup.createdBy === userEmail}
        />
      )}
      
      <View style={styles.chatBackground}>
        {loadingMessages && messages.length === 0 ? (
          <View style={styles.messagesLoadingContainer}>
            <Text style={[styles.messagesLoadingText, { color: colors.textSecondary }]}>
              Loading messages...
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => {
              if (item.messageId || item._id) {
                return `message-${item.messageId || item._id}`;
              }
              const messageStr = typeof item.message === 'string' 
                ? item.message 
                : (item.message?.message || item.message?.text || String(item.message || ''));
              return `message-${index}-${item.timestamp}-${item.senderEmail}-${messageStr.substring(0, 10)}`;
            }}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={true}
            inverted={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={20}
            updateCellsBatchingPeriod={100}
            initialNumToRender={20}
            windowSize={21}
            onScroll={handleScroll}
            scrollEventThrottle={200}
            onContentSizeChange={handleContentSizeChange}
            onScrollToIndexFailed={(info) => {
              // Fallback for scroll failures
              setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
              }, 100);
            }}
          />
        )}
      </View>

      <TypingIndicator typingUsers={currentTypingUser ? [currentTypingUser] : []} />

      <MessageInput
        value={inputMessage}
        onChangeText={handleTyping}
        onSend={handleSendMessage}
        onFileSelect={handleFileSelect}
        userEmail={userEmail}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => {
          setEditingMessage(null);
          setInputMessage('');
        }}
        onBillSplitPress={() => {
          if (chatType === 'private' && contactEmail) {
            setShowBillSplitModal(true);
          } else if (chatType === 'group' && groupId) {
            setShowBillSplitModal(true);
          }
        }}
      />
    </>
  );
};

ChatContent.propTypes = {
  messages: PropTypes.array.isRequired,
  loadingMessages: PropTypes.bool.isRequired,
  flatListRef: PropTypes.object.isRequired,
  renderMessage: PropTypes.func.isRequired,
  currentTypingUser: PropTypes.object,
  inputMessage: PropTypes.string.isRequired,
  handleTyping: PropTypes.func.isRequired,
  handleSendMessage: PropTypes.func.isRequired,
  handleFileSelect: PropTypes.func.isRequired,
  userEmail: PropTypes.string.isRequired,
  replyingTo: PropTypes.object,
  setReplyingTo: PropTypes.func.isRequired,
  editingMessage: PropTypes.object,
  setEditingMessage: PropTypes.func.isRequired,
  setInputMessage: PropTypes.func.isRequired,
  chatType: PropTypes.string,
  contactEmail: PropTypes.string,
  groupId: PropTypes.string,
  setShowBillSplitModal: PropTypes.func.isRequired,
  selectedMessages: PropTypes.array.isRequired,
  handleMessageSelect: PropTypes.func.isRequired,
  handleMenuPress: PropTypes.func.isRequired,
  handlePinMessage: PropTypes.func.isRequired,
  handleUnpinMessage: PropTypes.func.isRequired,
  handleActionBarCopy: PropTypes.func.isRequired,
  handleActionBarReply: PropTypes.func.isRequired,
  handleActionBarForward: PropTypes.func.isRequired,
  handleActionBarPin: PropTypes.func.isRequired,
  handleActionBarUnpin: PropTypes.func.isRequired,
  handleActionBarDelete: PropTypes.func.isRequired,
  handleActionBarInfo: PropTypes.func.isRequired,
  handleActionBarClose: PropTypes.func.isRequired,
  handleActionBarEdit: PropTypes.func.isRequired,
  canEditMessage: PropTypes.func.isRequired,
  pinnedMessage: PropTypes.object,
  handlePinnedMessagePress: PropTypes.func.isRequired,
  handleUnpinFromBanner: PropTypes.func.isRequired,
  currentGroup: PropTypes.object,
  colors: PropTypes.object.isRequired,
  onScrollPositionChange: PropTypes.func,
};

export default ChatContent;

