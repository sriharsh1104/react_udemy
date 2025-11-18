import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../../constants';
import AlertModal from '../../common/AlertModal/AlertModal';
import useAlertModal from '../../../hooks/useAlertModal';
import styles from './BillSplitModal.styles';

const BillSplitModal = ({
  visible,
  onClose,
  onCreateBill,
  userEmail,
  contactEmail,
  groupId,
  groupMembers = [],
}) => {
  const { showAlert, alertState, hideAlert } = useAlertModal();
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
    const { sanitizeAmount } = require('../../../utils/validation');
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
    const { sanitizeString, isValidAmount, sanitizeAmount } = require('../../../utils/validation');
    
    const sanitizedBillName = sanitizeString(billName);
    if (!sanitizedBillName.trim()) {
      showAlert('Error', 'Please enter a bill name', { type: 'error' });
      return;
    }

    const sanitizedAmount = sanitizeAmount(totalAmount);
    if (!isValidAmount(sanitizedAmount)) {
      showAlert('Error', 'Please enter a valid amount', { type: 'error' });
      return;
    }

    // Filter only selected users
    const selectedSplits = splits.filter(s => s.selected);
    
    if (selectedSplits.length === 0) {
      showAlert('Error', 'Please select at least one person', { type: 'error' });
      return;
    }

    // Calculate total of splits
    const splitTotal = selectedSplits.reduce((sum, s) => sum + (s.amount || 0), 0);
    const total = parseFloat(totalAmount);

    // Check if totals match (allow small rounding difference)
    if (Math.abs(splitTotal - total) > 0.01) {
      showAlert('Error', `Split amounts (₹${splitTotal.toFixed(2)}) must equal total amount (₹${total.toFixed(2)})`, { type: 'error' });
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

export default BillSplitModal;

