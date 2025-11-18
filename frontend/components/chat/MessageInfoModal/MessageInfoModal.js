import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING } from '../../../constants';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './MessageInfoModal.styles';

const MessageInfoModal = ({
  visible,
  onClose,
  messageId,
  chatType,
  userEmail,
  onLoadMessageInfo,
}) => {
  const { colors } = useTheme();
  const [messageInfo, setMessageInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && messageId && onLoadMessageInfo) {
      loadMessageInfo();
    } else {
      setMessageInfo(null);
    }
  }, [visible, messageId]);

  const loadMessageInfo = async () => {
    if (!messageId || !onLoadMessageInfo) return;
    
    setLoading(true);
    try {
      const result = await onLoadMessageInfo(messageId);
      if (result.success && result.messageInfo) {
        setMessageInfo(result.messageInfo);
      }
    } catch (error) {
      console.error('Error loading message info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsernameFromEmail = (email) => {
    if (!email) return 'Unknown';
    return email.split('@')[0];
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Message Info</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.closeIcon, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading message info...
                </Text>
              </View>
            ) : messageInfo ? (
              <>
                {/* Sender Info */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Sent by</Text>
                  <View style={[styles.infoRow, { backgroundColor: colors.receivedMessage }]}>
                    <Text style={[styles.infoText, { color: colors.text }]}>
                      {getUsernameFromEmail(messageInfo.senderEmail)}
                    </Text>
                    <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
                      {messageInfo.senderEmail}
                    </Text>
                  </View>
                </View>

                {/* Timestamp */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Sent at</Text>
                  <View style={[styles.infoRow, { backgroundColor: colors.receivedMessage }]}>
                    <Text style={[styles.infoText, { color: colors.text }]}>
                      {formatTimestamp(messageInfo.timestamp)}
                    </Text>
                  </View>
                </View>

                {/* Delivery Status */}
                {messageInfo.deliveredAt && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivered at</Text>
                    <View style={[styles.infoRow, { backgroundColor: colors.receivedMessage }]}>
                      <Text style={[styles.infoText, { color: colors.text }]}>
                        {formatTimestamp(messageInfo.deliveredAt)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Read Receipts */}
                {messageInfo.readReceipts && messageInfo.readReceipts.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: COLORS.success }]}>
                      ✓ Read ({messageInfo.readReceipts.length})
                    </Text>
                    {messageInfo.readReceipts.map((email, index) => (
                      <View
                        key={index}
                        style={[styles.infoRow, { backgroundColor: colors.receivedMessage }]}
                      >
                        <Text style={[styles.infoText, { color: colors.text }]}>
                          {getUsernameFromEmail(email)}
                        </Text>
                        <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
                          {email}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Not Read (Delivered but not read) */}
                {messageInfo.notRead && messageInfo.notRead.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: COLORS.warning }]}>
                      ⚠ Delivered but not read ({messageInfo.notRead.length})
                    </Text>
                    {messageInfo.notRead.map((email, index) => (
                      <View
                        key={index}
                        style={[styles.infoRow, { backgroundColor: colors.receivedMessage }]}
                      >
                        <Text style={[styles.infoText, { color: colors.text }]}>
                          {getUsernameFromEmail(email)}
                        </Text>
                        <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
                          {email}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Not Delivered (Network issue) */}
                {messageInfo.notDelivered && messageInfo.notDelivered.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
                      ✕ Not delivered ({messageInfo.notDelivered.length})
                    </Text>
                    <Text style={[styles.infoSubtext, { color: colors.textSecondary, marginBottom: SPACING.sm }]}>
                      Network issue or user offline
                    </Text>
                    {messageInfo.notDelivered.map((email, index) => (
                      <View
                        key={index}
                        style={[styles.infoRow, { backgroundColor: colors.receivedMessage }]}
                      >
                        <Text style={[styles.infoText, { color: colors.text }]}>
                          {getUsernameFromEmail(email)}
                        </Text>
                        <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
                          {email}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* No read receipts yet */}
                {(!messageInfo.readReceipts || messageInfo.readReceipts.length === 0) &&
                 (!messageInfo.notRead || messageInfo.notRead.length === 0) &&
                 (!messageInfo.notDelivered || messageInfo.notDelivered.length === 0) && (
                  <View style={styles.section}>
                    <Text style={[styles.infoText, { color: colors.textSecondary, textAlign: 'center' }]}>
                      No read receipts available
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.section}>
                <Text style={[styles.infoText, { color: colors.textSecondary, textAlign: 'center' }]}>
                  Failed to load message info
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default MessageInfoModal;

