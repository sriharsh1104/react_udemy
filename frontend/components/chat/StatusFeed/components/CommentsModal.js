import React from 'react';
import { View, Text, Modal, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import EmojiPicker from '../../EmojiPicker';
import GIFPicker from '../../GIFPicker';
import styles from '../StatusFeed.styles';

const CommentsModal = ({ 
  visible, 
  onClose, 
  commentsHook,
  userEmail,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        onClose();
        commentsHook.resetComments();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.commentsModal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Comments</Text>
            <TouchableOpacity
              onPress={() => {
                onClose();
                commentsHook.resetComments();
              }}
              style={styles.modalCloseButton}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {commentsHook.loadingComments ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <>
              <FlatList
                data={commentsHook.comments}
                keyExtractor={(item, index) => `comment-${item.commentId}-${index}`}
                style={styles.commentsList}
                renderItem={({ item }) => {
                  const isPostOwner = commentsHook.selectedStatusOwner === userEmail;
                  const showReplies = commentsHook.expandedReplies.has(item.commentId);
                  const hasReplies = item.replies && item.replies.length > 0;
                  
                  return (
                    <View style={[styles.commentItem, { borderBottomColor: colors.divider }]}>
                      <View style={styles.commentRow}>
                        <View style={[styles.commentAvatar, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.commentAvatarText, { color: colors.white }]}>
                            {item.userName?.charAt(0).toUpperCase() || 'U'}
                          </Text>
                        </View>
                        <View style={styles.commentContent}>
                          <View style={styles.commentHeader}>
                            <Text style={[styles.commentUserName, { color: colors.text }]}>
                              {item.userName || item.userEmail?.split('@')[0]}
                              {item.isPinned && <Text style={{ color: colors.primary }}> 📌</Text>}
                            </Text>
                            {isPostOwner && (
                              <TouchableOpacity
                                onPress={() => commentsHook.handlePinComment(item.commentId)}
                                style={styles.pinButton}
                              >
                                <Text style={styles.pinButtonText}>
                                  {item.isPinned ? '📌' : '📍'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <Text style={[styles.commentText, { color: colors.text }]}>
                            {item.comment}
                          </Text>
                          <View style={styles.commentActions}>
                            <TouchableOpacity
                              onPress={() => commentsHook.handleCommentLike(item.commentId, false, null)}
                              style={styles.commentActionButton}
                            >
                              <Text style={styles.commentActionIcon}>
                                {item.isLiked ? '❤️' : '🤍'}
                              </Text>
                              {item.likesCount > 0 && (
                                <Text style={[styles.commentActionCount, { color: colors.textSecondary }]}>
                                  {item.likesCount}
                                </Text>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => commentsHook.handleReplyPress(item.commentId)}
                              style={styles.commentActionButton}
                            >
                              <Text style={styles.commentActionIcon}>💬</Text>
                            </TouchableOpacity>
                            {hasReplies && (
                              <TouchableOpacity
                                onPress={() => commentsHook.handleToggleReplies(item.commentId)}
                                style={styles.commentActionButton}
                              >
                                <Text style={[styles.commentActionText, { color: colors.textSecondary }]}>
                                  {showReplies ? 'Hide' : 'View'} {item.repliesCount} {item.repliesCount === 1 ? 'reply' : 'replies'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                            {new Date(item.commentedAt).toLocaleString()}
                          </Text>
                          
                          {/* Replies */}
                          {showReplies && hasReplies && (
                            <View style={styles.repliesContainer}>
                              {item.replies.map((reply) => (
                                <View key={reply.replyId} style={styles.replyItem}>
                                  <View style={[styles.replyAvatar, { backgroundColor: colors.primary }]}>
                                    <Text style={[styles.replyAvatarText, { color: colors.white }]}>
                                      {reply.userName?.charAt(0).toUpperCase() || 'U'}
                                    </Text>
                                  </View>
                                  <View style={styles.replyContent}>
                                    <Text style={[styles.replyUserName, { color: colors.text }]}>
                                      {reply.userName || reply.userEmail?.split('@')[0]}
                                    </Text>
                                    <Text style={[styles.replyText, { color: colors.text }]}>
                                      {reply.reply}
                                    </Text>
                                    <View style={styles.replyActions}>
                                      <TouchableOpacity
                                        onPress={() => commentsHook.handleCommentLike(item.commentId, true, reply.replyId)}
                                        style={styles.commentActionButton}
                                      >
                                        <Text style={styles.commentActionIcon}>
                                          {reply.isLiked ? '❤️' : '🤍'}
                                        </Text>
                                        {reply.likesCount > 0 && (
                                          <Text style={[styles.commentActionCount, { color: colors.textSecondary }]}>
                                            {reply.likesCount}
                                          </Text>
                                        )}
                                      </TouchableOpacity>
                                      <Text style={[styles.replyTime, { color: colors.textSecondary }]}>
                                        {new Date(reply.repliedAt).toLocaleString()}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                          
                          {/* Reply Input */}
                          {commentsHook.replyingToCommentId === item.commentId && (
                            <View style={styles.replyInputContainer}>
                              <TextInput
                                style={[styles.replyInput, { color: colors.text, backgroundColor: colors.inputBackground }]}
                                placeholder="Write a reply..."
                                placeholderTextColor={colors.textSecondary}
                                value={commentsHook.replyText}
                                onChangeText={commentsHook.setReplyText}
                                multiline={Platform.OS === 'web'}
                                maxLength={1000}
                                onSubmitEditing={Platform.OS !== 'web' ? commentsHook.handleAddComment : undefined}
                                blurOnSubmit={false}
                                returnKeyType="send"
                                onKeyPress={commentsHook.handleCommentKeyPress}
                              />
                              <View style={styles.replyInputActions}>
                                <TouchableOpacity
                                  onPress={commentsHook.handleCancelReply}
                                  style={styles.replyCancelButton}
                                >
                                  <Text style={[styles.replyCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={commentsHook.handleAddComment}
                                  disabled={!commentsHook.replyText.trim()}
                                  style={[
                                    styles.replySendButton,
                                    { backgroundColor: commentsHook.replyText.trim() ? colors.primary : colors.divider },
                                  ]}
                                >
                                  <Text style={[styles.replySendText, { color: colors.white }]}>Reply</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyComments}>
                    <Text style={[styles.emptyCommentsText, { color: colors.textSecondary }]}>
                      No comments yet. Be the first to comment!
                    </Text>
                  </View>
                }
              />
              
              {/* Comment Input */}
              {!commentsHook.replyingToCommentId && (
                <View style={[styles.commentInputContainer, { borderTopColor: colors.divider }]}>
                  <View style={styles.commentInputWrapper}>
                    <TouchableOpacity 
                      style={styles.commentActionButton}
                      onPress={commentsHook.handleTakePhoto}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.commentActionIcon}>📷</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.commentActionButton}
                      onPress={() => {
                        commentsHook.setShowGIFPicker(false);
                        commentsHook.setShowEmojiPicker(!commentsHook.showEmojiPicker);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.commentActionIcon}>😊</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.commentActionButton}
                      onPress={() => {
                        commentsHook.setShowEmojiPicker(false);
                        commentsHook.setShowGIFPicker(!commentsHook.showGIFPicker);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.commentGIFButton, { color: colors.primary }]}>GIF</Text>
                    </TouchableOpacity>
                    
                    <TextInput
                      style={[styles.commentInput, { color: colors.text, backgroundColor: colors.inputBackground }]}
                      placeholder="Add a comment..."
                      placeholderTextColor={colors.textSecondary}
                      value={commentsHook.commentText}
                      onChangeText={commentsHook.setCommentText}
                      multiline={Platform.OS === 'web'}
                      maxLength={1000}
                      onSubmitEditing={Platform.OS !== 'web' ? commentsHook.handleAddComment : undefined}
                      blurOnSubmit={false}
                      returnKeyType="send"
                      onKeyPress={commentsHook.handleCommentKeyPress}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={commentsHook.handleAddComment}
                    disabled={!commentsHook.commentText.trim()}
                    style={[
                      styles.commentSendButton,
                      { backgroundColor: commentsHook.commentText.trim() ? colors.primary : colors.divider },
                    ]}
                  >
                    <Text style={[styles.commentSendText, { color: colors.white }]}>Post</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Emoji Picker Modal */}
              <EmojiPicker
                visible={commentsHook.showEmojiPicker}
                onClose={() => commentsHook.setShowEmojiPicker(false)}
                onEmojiSelect={commentsHook.handleEmojiSelect}
              />

              {/* GIF Picker Modal */}
              <GIFPicker
                visible={commentsHook.showGIFPicker}
                onClose={() => commentsHook.setShowGIFPicker(false)}
                onGIFSelect={commentsHook.handleGIFSelect}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CommentsModal;

