/**
 * ChatContent Component
 * Renders the main chat interface (messages, input, etc.)
 */

import React from 'react';
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
  handleStreakFile,
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
}) => {
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
            extraData={`${messages.length}-${messages[messages.length - 1]?.messageId || messages[messages.length - 1]?.timestamp || Date.now()}`}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => {
              requestAnimationFrame(() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }, 100);
              });
            }}
            showsVerticalScrollIndicator={false}
            inverted={false}
            removeClippedSubviews={false}
            maxToRenderPerBatch={15}
            updateCellsBatchingPeriod={50}
            initialNumToRender={15}
            windowSize={10}
          />
        )}
      </View>

      <TypingIndicator typingUsers={currentTypingUser ? [currentTypingUser] : []} />

      <MessageInput
        value={inputMessage}
        onChangeText={handleTyping}
        onSend={handleSendMessage}
        onFileSelect={handleFileSelect}
        onStreakPress={chatType === 'private' ? handleStreakFile : null}
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
  handleStreakFile: PropTypes.func,
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
};

export default ChatContent;

