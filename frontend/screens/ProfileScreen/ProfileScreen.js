import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import GLoader from '../../components/common/GLoader';
import profileService from '../../services/profileService';
import styles from './styles';

const ProfileScreen = ({ userEmail, onBack, isMandatory = false, initialProfile = null, isProfileComplete = false }) => {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!initialProfile);
  const [profileCompleteStatus, setProfileCompleteStatus] = useState(isProfileComplete);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingList, setFollowingList] = useState([]);
  const [showListModal, setShowListModal] = useState(false);
  const [listType, setListType] = useState(null); // 'followers' or 'following'
  const [listData, setListData] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  
  // Track initial values to detect changes
  const [initialValues, setInitialValues] = useState({
    name: '',
    age: '',
    phone1: '',
    phone2: '',
  });

  useEffect(() => {
    // Update profileCompleteStatus when prop changes
    setProfileCompleteStatus(isProfileComplete);
  }, [isProfileComplete]);

  useEffect(() => {
    // Only load profile if not passed as prop (to avoid double API call)
    if (initialProfile) {
      // Use initial profile data
      const initialName = initialProfile.name || '';
      const initialAge = initialProfile.age ? initialProfile.age.toString() : '';
      const initialPhone1 = initialProfile.phoneNumbers?.[0] || '';
      const initialPhone2 = initialProfile.phoneNumbers?.[1] || '';
      
      setName(initialName);
      setAge(initialAge);
      setPhone1(initialPhone1);
      setPhone2(initialPhone2);
      
      // Store initial values for change detection
      setInitialValues({
        name: initialName,
        age: initialAge,
        phone1: initialPhone1,
        phone2: initialPhone2,
      });
      
      setProfileCompleteStatus(initialProfile.isProfileComplete || false);
      setFollowersCount(initialProfile.followersCount || 0);
      setFollowingCount(initialProfile.followingCount || 0);
      setFollowingList(initialProfile.followingList || []);
      setInitialLoading(false);
    } else {
    loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload profile data (especially follower/following counts) when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Always reload follower/following counts from service when screen is focused
      const refreshCounts = async () => {
        try {
          const result = await profileService.getProfile();
          if (result.success && result.profile) {
            // Update only follower/following counts, keep other fields as they are
            if (result.profile.followersCount !== undefined) {
              setFollowersCount(result.profile.followersCount);
            }
            if (result.profile.followingCount !== undefined) {
              setFollowingCount(result.profile.followingCount);
            }
            if (result.profile.followingList !== undefined) {
              setFollowingList(result.profile.followingList);
            }
            // Also update profile complete status if changed
            if (result.profile.isProfileComplete !== undefined) {
              setProfileCompleteStatus(result.profile.isProfileComplete);
            }
          }
        } catch (error) {
          console.error('Error refreshing profile counts:', error);
        }
      };
      
      // Only refresh if not in initial loading state
      if (!initialLoading) {
        refreshCounts();
      }
    }, [initialLoading])
  );

  const loadProfile = async () => {
    setInitialLoading(true);
    const result = await profileService.getProfile();
    
    if (result.success && result.profile) {
      const initialName = result.profile.name || '';
      const initialAge = result.profile.age ? result.profile.age.toString() : '';
      const initialPhone1 = result.profile.phoneNumbers?.[0] || '';
      const initialPhone2 = result.profile.phoneNumbers?.[1] || '';
      
      setName(initialName);
      setAge(initialAge);
      setPhone1(initialPhone1);
      setPhone2(initialPhone2);
      
      // Store initial values for change detection
      setInitialValues({
        name: initialName,
        age: initialAge,
        phone1: initialPhone1,
        phone2: initialPhone2,
      });
      
      setProfileCompleteStatus(result.profile.isProfileComplete || false);
      setFollowersCount(result.profile.followersCount || 0);
      setFollowingCount(result.profile.followingCount || 0);
      setFollowingList(result.profile.followingList || []);
    }
    setInitialLoading(false);
  };
  
  // Check if any field has changed from initial values
  const hasChanges = () => {
    return (
      name.trim() !== initialValues.name.trim() ||
      age.trim() !== initialValues.age.trim() ||
      phone1.trim() !== initialValues.phone1.trim() ||
      phone2.trim() !== initialValues.phone2.trim()
    );
  };
  
  // Determine if save button should be disabled
  const isSaveDisabled = () => {
    // If profile is complete and no changes made, disable save button
    if (profileCompleteStatus && !hasChanges()) {
      return true;
    }
    // If saving in progress, disable
    if (saving) {
      return true;
    }
    return false;
  };

  const handleSave = async () => {
    const { isValidName, isValidAge, isValidPhone, sanitizeName, sanitizePhone } = require('../../utils/validation');
    
    // Validate required fields for mandatory profile
    if (isMandatory && (!name.trim() || !phone1.trim())) {
      Alert.alert('Required Fields', 'Please fill Name and at least one Phone Number to continue');
      return;
    }

    // Sanitize and validate name
    const sanitizedName = sanitizeName(name);
    if (!isValidName(sanitizedName)) {
      Alert.alert('Invalid Name', 'Please enter a valid name');
      return;
    }

    // Validate age
    if (age && !isValidAge(age)) {
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
      if (!isValidPhone(phone)) {
        Alert.alert('Invalid Phone', 'Please enter valid phone numbers');
        return;
      }
    }

    setSaving(true);
    
    try {
    const result = await profileService.updateProfile({
      name: name.trim(),
      age: age ? parseInt(age) : null,
      phoneNumbers,
    });

    if (result.success) {
      // Update profile complete status from response
      if (result.profile?.isProfileComplete) {
        setProfileCompleteStatus(true);
      }
      // Update follower/following counts from response
      if (result.profile?.followersCount !== undefined) {
        setFollowersCount(result.profile.followersCount);
      }
      if (result.profile?.followingCount !== undefined) {
        setFollowingCount(result.profile.followingCount);
      }
      if (result.profile?.followingList !== undefined) {
        setFollowingList(result.profile.followingList);
      }
      
      // Update initial values after successful save to reset change detection
      setInitialValues({
        name: name.trim(),
        age: age.trim(),
        phone1: phoneNumbers[0] || '',
        phone2: phoneNumbers[1] || '',
      });
      
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
    // If profile is complete or not mandatory, allow back navigation directly
    if (profileCompleteStatus || !isMandatory) {
      onBack();
      return;
    }
    
    // If mandatory and profile incomplete, warn user
    if (isMandatory && !profileCompleteStatus) {
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

  const handleStatClick = async (type) => {
    setListType(type);
    setShowListModal(true);
    setLoadingList(true);
    setListData([]);

    try {
      const result = await profileService.getProfile();
      if (result.success && result.profile) {
        if (type === 'following') {
          setListData(result.profile.followingList || []);
        } else if (type === 'followers') {
          setListData(result.profile.followersList || []);
        }
      }
    } catch (error) {
      console.error('Error loading list:', error);
    } finally {
      setLoadingList(false);
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
          {(!isMandatory || profileCompleteStatus) ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          {!profileCompleteStatus ? (
          <Text style={styles.headerTitle}>
            {isMandatory ? 'Complete Your Profile' : 'Profile'}
          </Text>
          ) : (
            <View style={styles.placeholder} />
          )}
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {isMandatory && !profileCompleteStatus && (
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

          {/* Followers & Following - Read Only Display */}
          <View style={styles.section}>
            <View style={styles.statsContainer}>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => handleStatClick('followers')}
                activeOpacity={0.7}
              >
                <Text style={styles.statValue}>{followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => handleStatClick('following')}
                activeOpacity={0.7}
              >
                <Text style={styles.statValue}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Feed statistics (read-only) - Tap to view list</Text>
          </View>

          {/* Followers/Following List Modal */}
          <Modal
            visible={showListModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowListModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {listType === 'followers' ? 'Followers' : 'Following'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowListModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Text style={[styles.modalCloseText, { color: colors.text }]}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                {loadingList ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : listData.length > 0 ? (
                  <FlatList
                    data={listData}
                    keyExtractor={(item, index) => item.email || `item-${index}`}
                    renderItem={({ item }) => (
                      <View style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                        <View style={styles.listItemContent}>
                          <View style={[styles.listItemAvatar, { backgroundColor: colors.primary }]}>
                            <Text style={styles.listItemAvatarText}>
                              {(item.name || item.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.listItemInfo}>
                            <Text style={[styles.listItemName, { color: colors.text }]}>
                              {item.name || item.email?.split('@')[0] || 'User'}
                            </Text>
                            <Text style={[styles.listItemEmail, { color: colors.textSecondary }]}>
                              {item.email}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                    contentContainerStyle={styles.modalListContent}
                  />
                ) : (
                  <View style={styles.modalEmptyContainer}>
                    <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                      No {listType === 'followers' ? 'followers' : 'following'} yet
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Modal>

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
            style={[styles.saveButton, isSaveDisabled() && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaveDisabled()}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>
      {/* <GLoader visible={saving} message="Saving profile..." /> */}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

ProfileScreen.propTypes = {
  userEmail: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  isMandatory: PropTypes.bool,
  initialProfile: PropTypes.object,
  isProfileComplete: PropTypes.bool,
};

ProfileScreen.defaultProps = {
  isMandatory: false,
  initialProfile: null,
  isProfileComplete: false,
};

export default ProfileScreen;

