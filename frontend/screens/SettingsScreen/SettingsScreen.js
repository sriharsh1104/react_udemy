import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TYPOGRAPHY } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/common/Button';
import PasswordInput from '../../components/common/PasswordInput';
import settingsService from '../../services/settingsService';
import biometricService from '../../services/biometricService';
import { showToastFromResponse } from '../../utils/toast';
import styles from './styles';

const SettingsScreen = ({ navigation, onBack }) => {
  const { colors, themeMode, setTheme, isDark } = useTheme();
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineModeLoading, setOfflineModeLoading] = useState(false);
  const [biometricLockEnabled, setBiometricLockEnabled] = useState(false);
  const [biometricLockLoading, setBiometricLockLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Check password status
      const passwordStatus = await settingsService.checkPasswordStatus();
      if (passwordStatus.success) {
        setHasPassword(passwordStatus.hasPassword);
      }
      
      // Load offline mode status
      const offlineModeStatus = await settingsService.getOfflineMode();
      if (offlineModeStatus.success) {
        setOfflineMode(offlineModeStatus.offlineMode);
      }

      // Check biometric availability and status
      const availability = await biometricService.isBiometricAvailable();
      setBiometricAvailable(availability.available);
      if (availability.available) {
        setBiometricType(biometricService.getBiometricTypeName(availability.types));
      }
      
      const biometricEnabled = await biometricService.isBiometricLockEnabled();
      setBiometricLockEnabled(biometricEnabled);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showToastFromResponse({
        success: false,
        message: 'Password must be at least 6 characters',
      }, { errorTitle: 'Invalid Password' });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToastFromResponse({
        success: false,
        message: 'Passwords do not match',
      }, { errorTitle: 'Password Mismatch' });
      return;
    }

    setPasswordLoading(true);
    const result = await settingsService.setPassword(newPassword);
    if (result.success) {
      setHasPassword(true);
      setShowPasswordFields(false);
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordLoading(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToastFromResponse({
        success: false,
        message: 'All fields are required',
      }, { errorTitle: 'Required Fields' });
      return;
    }

    if (newPassword.length < 6) {
      showToastFromResponse({
        success: false,
        message: 'New password must be at least 6 characters',
      }, { errorTitle: 'Invalid Password' });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToastFromResponse({
        success: false,
        message: 'New passwords do not match',
      }, { errorTitle: 'Password Mismatch' });
      return;
    }

    setPasswordLoading(true);
    const result = await settingsService.changePassword(currentPassword, newPassword);
    if (result.success) {
      setShowPasswordFields(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordLoading(false);
  };

  const handleThemeChange = async (mode) => {
    setTheme(mode);
    showToastFromResponse({
      success: true,
      message: `Theme set to ${mode === 'auto' ? 'Auto (System)' : mode}`,
    }, { successTitle: 'Theme Updated' });
  };

  const handleToggleOfflineMode = async (enabled) => {
    setOfflineModeLoading(true);
    try {
      const result = await settingsService.toggleOfflineMode(enabled);
      if (result.success) {
        setOfflineMode(result.offlineMode);
      }
    } catch (error) {
      console.error('Error toggling offline mode:', error);
    } finally {
      setOfflineModeLoading(false);
    }
  };

  const handleToggleBiometricLock = async (enabled) => {
    setBiometricLockLoading(true);
    try {
      if (enabled) {
        // Enable biometric lock
        const result = await biometricService.enableBiometricLock();
        if (result.success) {
          setBiometricLockEnabled(true);
          if (result.biometricType) {
            setBiometricType(result.biometricType);
          }
          showToastFromResponse({
            success: true,
            message: `${result.biometricType || 'Biometric'} lock enabled successfully`,
          }, { successTitle: 'Biometric Lock Enabled' });
        } else {
          showToastFromResponse({
            success: false,
            message: result.message || 'Failed to enable biometric lock',
          }, { errorTitle: 'Failed to Enable' });
        }
      } else {
        // Disable biometric lock
        const result = await biometricService.disableBiometricLock();
        if (result.success) {
          setBiometricLockEnabled(false);
          showToastFromResponse({
            success: true,
            message: 'Biometric lock disabled successfully',
          }, { successTitle: 'Biometric Lock Disabled' });
        } else {
          showToastFromResponse({
            success: false,
            message: result.message || 'Failed to disable biometric lock',
          }, { errorTitle: 'Failed to Disable' });
        }
      }
    } catch (error) {
      console.error('Error toggling biometric lock:', error);
      showToastFromResponse({
        success: false,
        message: 'An error occurred while toggling biometric lock',
      }, { errorTitle: 'Error' });
    } finally {
      setBiometricLockLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.headerBackground, shadowColor: colors.shadow }]}>
        <TouchableOpacity onPress={onBack || (() => navigation.goBack())} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.headerText }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Password Section */}
        <View style={[styles.section, { backgroundColor: colors.receivedMessage }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔒 Password</Text>
          
          {!hasPassword ? (
            <>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Set a password to secure your account
              </Text>
              {!showPasswordFields ? (
                <Button
                  title="Set Password"
                  onPress={() => setShowPasswordFields(true)}
                  variant="primary"
                  fullWidth
                />
              ) : (
                <View style={styles.passwordForm}>
                  <PasswordInput
                    placeholder="Enter new password"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={styles.passwordInput}
                  />
                  <PasswordInput
                    placeholder="Confirm password"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.passwordInput}
                  />
                  <View style={styles.buttonRow}>
                    <Button
                      title="Cancel"
                      onPress={() => {
                        setShowPasswordFields(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      variant="secondary"
                      disabled={passwordLoading}
                      style={styles.button}
                    />
                    <Button
                      title="Set Password"
                      onPress={handleSetPassword}
                      variant="primary"
                      loading={passwordLoading}
                      disabled={passwordLoading}
                      style={styles.button}
                    />
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Change your account password
              </Text>
              {!showPasswordFields ? (
                <Button
                  title="Change Password"
                  onPress={() => setShowPasswordFields(true)}
                  variant="primary"
                  fullWidth
                />
              ) : (
                <View style={styles.passwordForm}>
                  <PasswordInput
                    placeholder="Current password"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    style={styles.passwordInput}
                  />
                  <PasswordInput
                    placeholder="New password"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={styles.passwordInput}
                  />
                  <PasswordInput
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.passwordInput}
                  />
                  <View style={styles.buttonRow}>
                    <Button
                      title="Cancel"
                      onPress={() => {
                        setShowPasswordFields(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      variant="secondary"
                      disabled={passwordLoading}
                      style={styles.button}
                    />
                    <Button
                      title="Change Password"
                      onPress={handleChangePassword}
                      variant="primary"
                      loading={passwordLoading}
                      disabled={passwordLoading}
                      style={styles.button}
                    />
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: colors.receivedMessage }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎨 Theme</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Choose your preferred theme mode
          </Text>
          
          <View style={styles.themeOptions}>
            <Button
              title="Light"
              icon="☀️"
              onPress={() => handleThemeChange('light')}
              variant={themeMode === 'light' ? 'primary' : 'outline'}
              size="small"
              style={[
                styles.themeOption,
                themeMode === 'light' && { backgroundColor: colors.primary + '20' }
              ]}
              textStyle={
                themeMode === 'light' 
                  ? { color: colors.primary, fontWeight: TYPOGRAPHY.fontWeight.semibold }
                  : { color: colors.textSecondary }
              }
            />
            
            <Button
              title="Dark"
              icon="🌙"
              onPress={() => handleThemeChange('dark')}
              variant={themeMode === 'dark' ? 'primary' : 'outline'}
              size="small"
              style={[
                styles.themeOption,
                themeMode === 'dark' && { backgroundColor: colors.primary + '20' }
              ]}
              textStyle={
                themeMode === 'dark' 
                  ? { color: colors.primary, fontWeight: TYPOGRAPHY.fontWeight.semibold }
                  : { color: colors.textSecondary }
              }
            />
            
            <Button
              title="Auto (System)"
              icon="🔄"
              onPress={() => handleThemeChange('auto')}
              variant={themeMode === 'auto' ? 'primary' : 'outline'}
              size="small"
              style={[
                styles.themeOption,
                themeMode === 'auto' && { backgroundColor: colors.primary + '20' }
              ]}
              textStyle={
                themeMode === 'auto' 
                  ? { color: colors.primary, fontWeight: TYPOGRAPHY.fontWeight.semibold }
                  : { color: colors.textSecondary }
              }
            />
          </View>
          
          <Text style={[styles.themeInfo, { color: colors.textSecondary }]}>
            Current: {themeMode === 'auto' ? `Auto (${isDark ? 'dark' : 'light'})` : themeMode}
          </Text>
        </View>

        {/* Offline Mode Section */}
        <View style={[styles.section, { backgroundColor: colors.receivedMessage }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>👁️ Privacy Mode</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            When enabled, you'll appear offline to others. Messages you read won't show as read to senders.
          </Text>
          
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                Offline Mode
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                {offlineMode 
                  ? 'You appear offline. Read receipts are disabled.' 
                  : 'You appear online. Read receipts are enabled.'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleSwitch,
                offlineMode && styles.toggleSwitchActive,
                { backgroundColor: offlineMode ? colors.primary : colors.divider }
              ]}
              onPress={() => handleToggleOfflineMode(!offlineMode)}
              disabled={offlineModeLoading}
              activeOpacity={0.7}
            >
              <View style={[
                styles.toggleThumb,
                { 
                  backgroundColor: colors.white,
                  alignSelf: offlineMode ? 'flex-end' : 'flex-start'
                }
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Biometric Lock Section */}
        <View style={[styles.section, { backgroundColor: colors.receivedMessage }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔐 Biometric Lock</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {biometricAvailable 
              ? `Secure your app with ${biometricType || 'biometric'} authentication. When enabled, you'll need to authenticate every time you open the app.`
              : 'Biometric authentication is not available on this device. Please set up fingerprint or face ID in your device settings.'}
          </Text>
          
          {biometricAvailable && (
            <View style={styles.toggleContainer}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  {biometricType || 'Biometric'} Lock
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  {biometricLockEnabled 
                    ? `App is locked with ${biometricType || 'biometric'} authentication. You'll need to authenticate when opening the app.` 
                    : 'App is not locked. Enable to require authentication when opening the app.'}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  biometricLockEnabled && styles.toggleSwitchActive,
                  { backgroundColor: biometricLockEnabled ? colors.primary : colors.divider }
                ]}
                onPress={() => handleToggleBiometricLock(!biometricLockEnabled)}
                disabled={biometricLockLoading}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.toggleThumb,
                  { 
                    backgroundColor: colors.white,
                    alignSelf: biometricLockEnabled ? 'flex-end' : 'flex-start'
                  }
                ]} />
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;

