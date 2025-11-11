import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../constants';
import GLoader from '../components/common/GLoader';
import profileService from '../services/profileService';

const ProfileScreen = ({ userEmail, onBack, isMandatory = false, initialProfile = null }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!initialProfile);

  useEffect(() => {
    // Only load profile if not passed as prop (to avoid double API call)
    if (initialProfile) {
      // Use initial profile data
      setName(initialProfile.name || '');
      setAge(initialProfile.age ? initialProfile.age.toString() : '');
      setPhone1(initialProfile.phoneNumbers?.[0] || '');
      setPhone2(initialProfile.phoneNumbers?.[1] || '');
      setInitialLoading(false);
    } else {
    loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    setInitialLoading(true);
    const result = await profileService.getProfile();
    
    if (result.success && result.profile) {
      setName(result.profile.name || '');
      setAge(result.profile.age ? result.profile.age.toString() : '');
      setPhone1(result.profile.phoneNumbers?.[0] || '');
      setPhone2(result.profile.phoneNumbers?.[1] || '');
    }
    setInitialLoading(false);
  };

  const handleSave = async () => {
    console.log('💾 handleSave called');
    
    // Validate required fields for mandatory profile
    if (isMandatory && (!name.trim() || !phone1.trim())) {
      Alert.alert('Required Fields', 'Please fill Name and at least one Phone Number to continue');
      return;
    }

    // Validate age
    if (age && (isNaN(age) || parseInt(age) < 1 || parseInt(age) > 150)) {
      Alert.alert('Invalid Age', 'Please enter a valid age (1-150)');
      return;
    }

    // Validate phone numbers
    const phoneNumbers = [phone1.trim(), phone2.trim()].filter(p => p);
    
    if (isMandatory && phoneNumbers.length === 0) {
      Alert.alert('Required', 'Please enter at least one phone number');
      return;
    }
    
    for (const phone of phoneNumbers) {
      if (!/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
        Alert.alert('Invalid Phone', 'Please enter valid phone numbers');
        return;
      }
    }

    console.log('✅ Validation passed, calling updateProfile');
    setSaving(true);
    
    try {
    const result = await profileService.updateProfile({
      name: name.trim(),
      age: age ? parseInt(age) : null,
      phoneNumbers,
    });

      console.log('📥 updateProfile result:', result);

    if (result.success) {
      // Directly navigate to chat section on success
      // Toast already shown by profileService
      onBack();
    } else {
      // Toast already shown by profileService
        setSaving(false);
      }
    } catch (error) {
      console.error('❌ Error in handleSave:', error);
      Alert.alert('Error', `Failed to save profile: ${error.message || 'Unknown error'}`);
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isMandatory) {
      // Warn user if trying to go back with incomplete profile
      Alert.alert(
        'Profile Incomplete',
        'Please complete your profile to continue using the app.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go Back', style: 'destructive', onPress: onBack },
        ]
      );
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GLoader visible={initialLoading} message="Loading profile..." />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          {!isMandatory ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          <Text style={styles.headerTitle}>
            {isMandatory ? 'Complete Your Profile' : 'Profile'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {isMandatory && (
            <View style={styles.mandatoryNotice}>
              <Text style={styles.mandatoryText}>
                Please complete your profile to continue
              </Text>
            </View>
          )}

          {/* Email - Fixed Display */}
          <View style={styles.section}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.emailContainer}>
              <Text style={styles.emailText}>{userEmail}</Text>
            </View>
            <Text style={styles.hint}>Email cannot be changed</Text>
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Name {isMandatory && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.inputPlaceholder}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>

          {/* Age */}
          <View style={styles.section}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              placeholderTextColor={COLORS.inputPlaceholder}
              value={age}
              onChangeText={(text) => setAge(text.replace(/[^0-9]/g, '').slice(0, 3))}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          {/* Phone Number 1 */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Phone Number 1 {isMandatory && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="+1234567890"
              placeholderTextColor={COLORS.inputPlaceholder}
              value={phone1}
              onChangeText={setPhone1}
              keyboardType="phone-pad"
              maxLength={15}
            />
            <Text style={styles.hint}>You can login with this number</Text>
          </View>

          {/* Phone Number 2 */}
          <View style={styles.section}>
            <Text style={styles.label}>Phone Number 2 (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="+1234567890"
              placeholderTextColor={COLORS.inputPlaceholder}
              value={phone2}
              onChangeText={setPhone2}
              keyboardType="phone-pad"
              maxLength={15}
            />
            <Text style={styles.hint}>You can login with this number</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>
      <GLoader visible={saving} message="Saving profile..." />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    padding: SPACING.xs,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.headerText,
  },
  placeholder: {
    width: 60,
  },
  content: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emailContainer: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  emailText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  hint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: COLORS.receivedMessage,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
  mandatoryNotice: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  mandatoryText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
  },
  required: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default ProfileScreen;

