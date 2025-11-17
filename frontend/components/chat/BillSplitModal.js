import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../constants';

const BillSplitModal = ({
  visible,
  onClose,
  onCreateBill,
  userEmail,
  contactEmail,
  groupId,
  groupMembers = [],
}) => {
  const [billName, setBillName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [splits, setSplits] = useState([]);
  const [splitMode, setSplitMode] = useState('equal'); // 'equal', 'custom'

  // Get all participants
  const participants = groupId 
    ? groupMembers.filter(email => email !== userEmail)
    : [contactEmail].filter(Boolean);

  useEffect(() => {
    if (visible && participants.length > 0) {
      // Initialize with equal split
      initializeEqualSplit();
    }
  }, [visible, participants.length]);

  const initializeEqualSplit = () => {
    const allUsers = groupId 
      ? [userEmail, ...groupMembers]
      : [userEmail, contactEmail];
    
    setSplits(
      allUsers.map(email => ({
        userEmail: email,
        amount: 0,
        selected: true,
      }))
    );
  };

  const handleAmountChange = (text) => {
    // Allow only numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    setTotalAmount(cleaned);
    
    if (splitMode === 'equal' && cleaned && participants.length > 0) {
      const amount = parseFloat(cleaned) || 0;
      const allUsers = groupId 
        ? [userEmail, ...groupMembers]
        : [userEmail, contactEmail];
      
      const perPerson = amount / allUsers.length;
      setSplits(
        allUsers.map(email => ({
          userEmail: email,
          amount: Math.round(perPerson * 100) / 100,
          selected: true,
        }))
      );
    }
  };

  const toggleUserSelection = (userEmail) => {
    setSplits(prev => 
      prev.map(split => 
        split.userEmail === userEmail
          ? { ...split, selected: !split.selected }
          : split
      )
    );
  };

  const handleCustomAmountChange = (userEmail, amount) => {
    const { sanitizeAmount } = require('../../utils/validation');
    const cleaned = sanitizeAmount(amount);
    setSplits(prev =>
      prev.map(split =>
        split.userEmail === userEmail
          ? { ...split, amount: cleaned }
          : split
      )
    );
  };

  const handleCreate = () => {
    const { sanitizeString, isValidAmount, sanitizeAmount } = require('../../utils/validation');
    
    const sanitizedBillName = sanitizeString(billName);
    if (!sanitizedBillName.trim()) {
      Alert.alert('Error', 'Please enter a bill name');
      return;
    }

    const sanitizedAmount = sanitizeAmount(totalAmount);
    if (!isValidAmount(sanitizedAmount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Filter only selected users
    const selectedSplits = splits.filter(s => s.selected);
    
    if (selectedSplits.length === 0) {
      Alert.alert('Error', 'Please select at least one person');
      return;
    }

    // Calculate total of splits
    const splitTotal = selectedSplits.reduce((sum, s) => sum + (s.amount || 0), 0);
    const total = parseFloat(totalAmount);

    // Check if totals match (allow small rounding difference)
    if (Math.abs(splitTotal - total) > 0.01) {
      Alert.alert('Error', `Split amounts (₹${splitTotal.toFixed(2)}) must equal total amount (₹${total.toFixed(2)})`);
      return;
    }

    onCreateBill({
      billName: billName.trim(),
      totalAmount: total,
      splits: selectedSplits.map(s => ({
        userEmail: s.userEmail,
        amount: s.amount,
      })),
    });

    // Reset form
    setBillName('');
    setTotalAmount('');
    setSplits([]);
    setSplitMode('equal');
    onClose();
  };

  const getUsername = (email) => {
    if (!email) return '';
    return email.split('@')[0];
  };

  const selectedSplits = splits.filter(s => s.selected);
  const splitTotal = selectedSplits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const total = parseFloat(totalAmount) || 0;
  const difference = Math.abs(splitTotal - total);

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
            <Text style={styles.title}>Split Bill</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Bill Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bill Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Dinner, Movie tickets"
                value={billName}
                onChangeText={setBillName}
                placeholderTextColor={COLORS.inputPlaceholder}
              />
            </View>

            {/* Total Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={totalAmount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.inputPlaceholder}
              />
            </View>

            {/* Split Mode Toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, splitMode === 'equal' && styles.modeButtonActive]}
                onPress={() => setSplitMode('equal')}
              >
                <Text style={[styles.modeText, splitMode === 'equal' && styles.modeTextActive]}>
                  Equal Split
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, splitMode === 'custom' && styles.modeButtonActive]}
                onPress={() => setSplitMode('custom')}
              >
                <Text style={[styles.modeText, splitMode === 'custom' && styles.modeTextActive]}>
                  Custom Split
                </Text>
              </TouchableOpacity>
            </View>

            {/* Split Details */}
            <View style={styles.splitsContainer}>
              <Text style={styles.sectionTitle}>Who's paying?</Text>
              
              {splits.map((split, index) => (
                <View key={split.userEmail} style={styles.splitRow}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => toggleUserSelection(split.userEmail)}
                  >
                    <View style={[
                      styles.checkboxInner,
                      split.selected && styles.checkboxChecked
                    ]}>
                      {split.selected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  
                  <Text style={styles.userName} numberOfLines={1}>
                    {split.userEmail === userEmail ? 'You' : getUsername(split.userEmail)}
                  </Text>
                  
                  {splitMode === 'custom' && split.selected && (
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0.00"
                      value={split.amount > 0 ? split.amount.toString() : ''}
                      onChangeText={(text) => handleCustomAmountChange(split.userEmail, text)}
                      keyboardType="decimal-pad"
                      placeholderTextColor={COLORS.inputPlaceholder}
                    />
                  )}
                  
                  {split.selected && (
                    <Text style={styles.amountText}>
                      ₹{split.amount.toFixed(2)}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Summary */}
            {total > 0 && (
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total:</Text>
                  <Text style={styles.summaryAmount}>₹{total.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Split Total:</Text>
                  <Text style={[
                    styles.summaryAmount,
                    difference > 0.01 && styles.summaryAmountError
                  ]}>
                    ₹{splitTotal.toFixed(2)}
                  </Text>
                </View>
                {difference > 0.01 && (
                  <Text style={styles.errorText}>
                    Difference: ₹{difference.toFixed(2)}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.createButton, difference > 0.01 && styles.createButtonDisabled]}
              onPress={handleCreate}
              disabled={difference > 0.01}
            >
              <Text style={styles.createButtonText}>Create Bill</Text>
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
  content: {
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  modeButton: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  modeTextActive: {
    color: COLORS.white,
  },
  splitsContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  checkbox: {
    marginRight: SPACING.md,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  userName: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
  },
  amountInput: {
    width: 100,
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    marginRight: SPACING.sm,
    textAlign: 'right',
  },
  amountText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    minWidth: 80,
    textAlign: 'right',
  },
  summary: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  summaryAmount: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  summaryAmountError: {
    color: COLORS.error || '#FF3B30',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.error || '#FF3B30',
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.receivedMessage,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
  },
  createButton: {
    backgroundColor: COLORS.primary,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
});

export default BillSplitModal;

