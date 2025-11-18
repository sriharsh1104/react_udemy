import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../../constants';
import billSplitService from '../../../services/billSplitService';
import AlertModal from '../../common/AlertModal/AlertModal';
import useAlertModal from '../../../hooks/useAlertModal';
import styles from './BillSummaryModal.styles';

const BillSummaryModal = ({
  visible,
  onClose,
  userEmail,
  contactEmail,
  groupId,
  roomId,
  groupMembers = [],
}) => {
  const { showAlert, alertState, hideAlert } = useAlertModal();
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
      showAlert('Error', 'Failed to load bills', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (billsList) => {
    // Get all participants
    const participants = groupId
      ? [...new Set(groupMembers)]
      : [userEmail, contactEmail].filter(Boolean);

    // Track net amounts for each participant
    // Positive = they owe you, Negative = you owe them
    const netAmounts = new Map();
    participants.forEach(p => netAmounts.set(p, 0));

    // Calculate raw amounts from all bills
    billsList.forEach((bill) => {
      if (bill.status === 'pending' || bill.status === 'partially_paid') {
        const billCreator = bill.createdBy;
        
        bill.splits?.forEach((split) => {
          // Skip the bill creator - they already paid
          if (split.userEmail === billCreator) {
            return;
          }

          if (!split.paid) {
            // This person owes the bill creator
            const currentOwed = netAmounts.get(split.userEmail) || 0;
            netAmounts.set(split.userEmail, currentOwed + split.amount);
            
            // Bill creator is owed this amount
            const creatorOwed = netAmounts.get(billCreator) || 0;
            netAmounts.set(billCreator, creatorOwed - split.amount);
          }
        });
      }
    });

    // Calculate net amounts after offsetting between you and each participant
    // First, calculate total you owe and total you are owed
    let totalYouOwe = 0;
    let totalYouAreOwed = 0;
    const breakdown = [];
    const peopleWhoOwe = [];

    participants.forEach((participant) => {
      if (participant === userEmail) return;

      // Calculate what this participant owes you (bills you created where they haven't paid)
      let participantOwesYou = 0;
      // Calculate what you owe this participant (bills they created where you haven't paid)
      let youOweParticipant = 0;

      billsList.forEach((bill) => {
        if (bill.status === 'pending' || bill.status === 'partially_paid') {
          const billCreator = bill.createdBy;
          const participantSplit = bill.splits?.find(s => s.userEmail === participant);
          const yourSplit = bill.splits?.find(s => s.userEmail === userEmail);

          // If you're the creator and participant hasn't paid their share
          if (userEmail === billCreator && participantSplit && !participantSplit.paid) {
            participantOwesYou += participantSplit.amount;
          }
          
          // If participant is the creator and you haven't paid your share
          if (participant === billCreator && yourSplit && !yourSplit.paid) {
            youOweParticipant += yourSplit.amount;
          }
        }
      });

      // Net amount: offset what they owe you vs what you owe them
      const netOwed = participantOwesYou - youOweParticipant;

      if (netOwed > 0) {
        // They owe you net amount (after offsetting)
        totalYouAreOwed += netOwed;
        breakdown.push({
          userEmail: participant,
          owes: 0,
          isOwed: netOwed,
        });
        peopleWhoOwe.push({
          userEmail: participant,
          amount: netOwed,
        });
      } else if (netOwed < 0) {
        // You owe them net amount (after offsetting)
        totalYouOwe += Math.abs(netOwed);
        breakdown.push({
          userEmail: participant,
          owes: Math.abs(netOwed),
          isOwed: 0,
        });
      }
    });

    // Final net calculation: offset total you owe vs total you are owed
    const netOwed = totalYouAreOwed - totalYouOwe;

    setSummary({
      totalPending: Math.abs(netOwed), // Net pending amount (absolute value)
      youOwe: netOwed < 0 ? Math.abs(netOwed) : 0, // Only show if net is negative (you owe more)
      youAreOwed: netOwed > 0 ? netOwed : 0, // Only show if net is positive (you're owed more)
      breakdown,
      peopleWhoOwe, // Store for reminder functionality
    });
  };

  const handleReminder = async () => {
    try {
      if (summary.peopleWhoOwe.length === 0) {
        showAlert('Info', 'No pending payments to remind', { type: 'info' });
        return;
      }

      // Send reminder via API - this will send a message in chat
      const result = await billSplitService.sendReminder(roomId, contactEmail, groupId);
      
      if (result.success) {
        // Message will appear in chat automatically via socket
        showAlert('Reminder Sent', `Reminder message sent in chat with total pending amount ₹${summary.totalPending.toFixed(2)}`, { type: 'success' });
        // Optionally reload bills to refresh the summary
        loadBills();
      } else {
        showAlert('Error', result.message || 'Failed to send reminder', { type: 'error' });
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      showAlert('Error', 'Failed to send reminder', { type: 'error' });
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

      {/* Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttonText={alertState.buttonText}
        type={alertState.type}
        onClose={hideAlert}
      />
    </Modal>
  );
};

export default BillSummaryModal;

