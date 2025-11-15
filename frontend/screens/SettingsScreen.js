import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/common/Button';
import PasswordInput from '../components/common/PasswordInput';
import settingsService from '../services/settingsService';
import { showToastFromResponse } from '../utils/toast';

const SettingsScreen = ({ navigation, onBack }) => {
  const { colors, themeMode, setTheme, isDark } = useTheme();
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineModeLoading, setOfflineModeLoading] = useState(false);
  
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

      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  section: {
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.md,
  },
  passwordForm: {
    marginTop: SPACING.md,
  },
  passwordInput: {
    marginBottom: SPACING.md,
  },
  input: {
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  themeOption: {
    flex: 1,
  },
  themeInfo: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontStyle: 'italic',
  },
  loadingSpinner: {
    marginVertical: SPACING.md,
  },
  linkContainer: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  linkText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  shareButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  shareButton: {
    flex: 1,
    minWidth: '45%',
  },
  inviteButton: {
    marginTop: SPACING.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  toggleInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  toggleLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
  },
  toggleDescription: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    lineHeight: 18,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    // Active state handled by backgroundColor
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default SettingsScreen;

