import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';
import billSplitService from '../../services/billSplitService';

const BillSummaryModal = ({
  visible,
  onClose,
  userEmail,
  contactEmail,
  groupId,
  roomId,
  groupMembers = [],
}) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalPending: 0,
    youOwe: 0,
    youAreOwed: 0,
    breakdown: [],
    peopleWhoOwe: [],
  });

  useEffect(() => {
    if (visible && roomId) {
      loadBills();
    }
  }, [visible, roomId]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const result = await billSplitService.getBillSplits(roomId, groupId);
      if (result.success) {
        const billsList = result.data?.billSplits || result.billSplits || [];
        setBills(billsList);
        calculateSummary(billsList);
      }
    } catch (error) {
      console.error('Error loading bills:', error);
      Alert.alert('Error', 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (billsList) => {
    let youOwe = 0;
    let youAreOwed = 0;
    const breakdown = [];
    const peopleWhoOwe = []; // Track people who owe money

    // Get all participants
    const participants = groupId
      ? [...new Set(groupMembers)]
      : [userEmail, contactEmail].filter(Boolean);

    billsList.forEach((bill) => {
      if (bill.status === 'pending' || bill.status === 'partially_paid') {
        const billCreator = bill.createdBy;
        
        bill.splits?.forEach((split) => {
          // Skip the bill creator - they already paid
          if (split.userEmail === billCreator) {
            return;
          }

          if (split.userEmail === userEmail) {
            if (!split.paid) {
              youOwe += split.amount;
            }
          } else {
            // Check if others owe you
            const yourSplit = bill.splits?.find(s => s.userEmail === userEmail);
            if (yourSplit && !split.paid) {
              // This person owes you (if you paid your share or you're the creator)
              if (yourSplit.paid || userEmail === billCreator) {
                youAreOwed += split.amount;
                // Track this person as someone who owes
                if (!peopleWhoOwe.find(p => p.userEmail === split.userEmail)) {
                  peopleWhoOwe.push({
                    userEmail: split.userEmail,
                    amount: split.amount,
                  });
                } else {
                  const existing = peopleWhoOwe.find(p => p.userEmail === split.userEmail);
                  existing.amount += split.amount;
                }
              }
            }
          }
        });
      }
    });

    // Calculate breakdown - who owes what
    participants.forEach((participant) => {
      if (participant === userEmail) return;

      let owes = 0;
      let isOwed = 0;

      billsList.forEach((bill) => {
        if (bill.status === 'pending' || bill.status === 'partially_paid') {
          const billCreator = bill.createdBy;
          const participantSplit = bill.splits?.find(s => s.userEmail === participant);
          const yourSplit = bill.splits?.find(s => s.userEmail === userEmail);

          // Skip if participant is the bill creator (they already paid)
          if (participant === billCreator) {
            return;
          }

          if (participantSplit && !participantSplit.paid) {
            // They owe
            if (yourSplit && (yourSplit.paid || userEmail === billCreator)) {
              // You paid or you're the creator, they owe you
              isOwed += participantSplit.amount;
            } else if (yourSplit && !yourSplit.paid && userEmail !== billCreator) {
              // Both haven't paid and you're not the creator - they owe their share
              owes += participantSplit.amount;
            }
          }

          if (yourSplit && !yourSplit.paid && participantSplit && participantSplit.paid && userEmail !== billCreator) {
            // You owe them (only if you're not the creator)
            owes += yourSplit.amount;
          }
        }
      });

      if (owes > 0 || isOwed > 0) {
        breakdown.push({
          userEmail: participant,
          owes: owes,
          isOwed: isOwed,
        });
      }
    });

    setSummary({
      totalPending: youOwe + youAreOwed,
      youOwe,
      youAreOwed,
      breakdown,
      peopleWhoOwe, // Store for reminder functionality
    });
  };

  const handleReminder = async () => {
    try {
      if (summary.peopleWhoOwe.length === 0) {
        Alert.alert('Info', 'No pending payments to remind');
        return;
      }

      // Send reminder via API - this will send a message in chat
      const result = await billSplitService.sendReminder(roomId, contactEmail, groupId);
      
      if (result.success) {
        // Message will appear in chat automatically via socket
        Alert.alert('Reminder Sent', `Reminder message sent in chat with total pending amount ₹${summary.totalPending.toFixed(2)}`);
        // Optionally reload bills to refresh the summary
        loadBills();
      } else {
        Alert.alert('Error', result.message || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      Alert.alert('Error', 'Failed to send reminder');
    }
  };

  const getUsername = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Bill Summary</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <ScrollView style={styles.content}>
              {/* Summary Box */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Total Pending</Text>
                <Text style={styles.summaryAmount}>₹{summary.totalPending.toFixed(2)}</Text>
                <View style={styles.summaryDetails}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>You Owe:</Text>
                    <Text style={[styles.summaryValue, styles.oweAmount]}>
                      ₹{summary.youOwe.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>You Are Owed:</Text>
                    <Text style={[styles.summaryValue, styles.owedAmount]}>
                      ₹{summary.youAreOwed.toFixed(2)}
                    </Text>
                  </View>
                </View>
                {summary.youAreOwed > 0 && summary.peopleWhoOwe.length > 0 && (
                  <TouchableOpacity
                    style={styles.reminderButtonMain}
                    onPress={handleReminder}
                  >
                    <Text style={styles.reminderButtonMainText}>🔔 Send Reminder to All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Breakdown */}
              {summary.breakdown.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Breakdown</Text>
                  {summary.breakdown.map((item, index) => (
                    <View key={index} style={styles.breakdownItem}>
                      <Text style={styles.breakdownName}>
                        {getUsername(item.userEmail)}
                      </Text>
                      <View style={styles.breakdownAmounts}>
                        {item.owes > 0 && (
                          <Text style={[styles.breakdownText, styles.owesText]}>
                            You owe: ₹{item.owes.toFixed(2)}
                          </Text>
                        )}
                        {item.isOwed > 0 && (
                          <Text style={[styles.breakdownText, styles.owedText]}>
                            They owe: ₹{item.isOwed.toFixed(2)}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Bills List */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>All Bills</Text>
                {bills.length === 0 ? (
                  <Text style={styles.emptyText}>No bills yet</Text>
                ) : (
                  bills.map((bill) => {
                    const userSplit = bill.splits?.find(s => s.userEmail === userEmail);
                    const isPaid = userSplit?.paid || false;
                    const userAmount = userSplit?.amount || 0;

                    return (
                      <View key={bill._id} style={styles.billItem}>
                        <View style={styles.billHeader}>
                          <Text style={styles.billIcon}>💰</Text>
                          <View style={styles.billInfo}>
                            <Text style={styles.billName}>{bill.billName}</Text>
                            <Text style={styles.billTotal}>
                              Total: ₹{bill.totalAmount.toFixed(2)}
                            </Text>
                          </View>
                          <View style={[
                            styles.statusBadge,
                            bill.status === 'fully_paid' && styles.statusPaid,
                            bill.status === 'partially_paid' && styles.statusPartial,
                          ]}>
                            <Text style={styles.statusText}>
                              {bill.status === 'fully_paid' ? 'Paid' : 
                               bill.status === 'partially_paid' ? 'Partial' : 'Pending'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.billDetails}>
                          <Text style={styles.billYourAmount}>
                            Your share: ₹{userAmount.toFixed(2)} {isPaid && '✓'}
                          </Text>
                          {bill.createdBy === userEmail && (
                            <Text style={styles.billCreatorBadge}>You paid</Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.closeButtonFooter]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.inputBackground,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeIcon: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  content: {
    padding: SPACING.lg,
  },
  summaryBox: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.xs,
  },
  summaryAmount: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  summaryDetails: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
  oweAmount: {
    color: '#FFD700', // Gold for owe
  },
  owedAmount: {
    color: '#4CAF50', // Green for owed
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  breakdownItem: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  breakdownName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  breakdownAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  breakdownText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  owesText: {
    color: '#FF6B6B',
  },
  owedText: {
    color: '#4CAF50',
  },
  billItem: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  billIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  billTotal: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#FFA500',
  },
  statusPaid: {
    backgroundColor: '#4CAF50',
  },
  statusPartial: {
    backgroundColor: '#FFA500',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
  billDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  billYourAmount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  reminderButtonMain: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  reminderButtonMainText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  billCreatorBadge: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#4CAF50',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  button: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  closeButtonFooter: {
    backgroundColor: COLORS.primary,
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
});

export default BillSummaryModal;

