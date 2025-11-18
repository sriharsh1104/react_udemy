import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import logger from './utils/logger';
import profileService from './services/profileService';
import { setGlobalLogoutHandler } from './utils/apiHelper';
import { setupWebFixes, setupWebTitle } from './utils/webFixes';
import { useDeepLink } from './hooks/useDeepLink';
import { useAuth } from './hooks/useAuth';
import { navigationConfig } from './config/navigationConfig';
import { toastConfig } from './config/toastConfig';

// Setup web fixes on app initialization
setupWebFixes();

// Lazy load screens for code splitting
const ChatScreen = lazy(() => import('./screens/ChatScreen/ChatScreen'));
const LoginScreen = lazy(() => import('./screens/LoginScreen/LoginScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen/ProfileScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen/SettingsScreen'));
const ReferralScreen = lazy(() => import('./screens/ReferralScreen/ReferralScreen'));
const FeedScreen = lazy(() => import('./screens/FeedScreen/FeedScreen'));
const StatusScreen = lazy(() => import('./screens/StatusScreen/StatusScreen'));
const CallScreen = lazy(() => import('./screens/CallScreen/CallScreen'));
const LogoutModal = lazy(() => import('./components/common/LogoutModal'));
const NotificationContainer = lazy(() => import('./components/common/Notification'));
const BiometricLockScreen = lazy(() => import('./components/common/BiometricLockScreen'));

const Stack = createNativeStackNavigator();

const AppContentWithNotifications = () => {
  const { notifications, removeNotification, markAsRead } = useNotifications();
  const navigationRef = React.useRef(null);
  
  const handleNotificationPress = (notification) => {
    // Call the notification's onPress handler if it exists
    if (notification.onPress) {
      notification.onPress();
    }
    removeNotification(notification.id);
  };

  const handleNotificationMarkAsRead = (notification) => {
    if (notification.onMarkAsRead) {
      notification.onMarkAsRead();
    }
    markAsRead(notification.senderEmail, notification.onMarkAsRead);
  };

  const handleNotificationReply = (notification) => {
    // Reply input will be shown inline in notification
  };

  const handleSendReply = (notification, message) => {
    logger.log('📨 App: handleSendReply called', {
      hasNotification: !!notification,
      hasOnReply: !!(notification && notification.onReply),
      senderEmail: notification?.senderEmail,
      message: message
    });
    
    if (notification && notification.onReply) {
      try {
        logger.log('✅ App: Calling notification.onReply...');
        notification.onReply(message);
        logger.log('✅ App: notification.onReply called successfully');
      } catch (error) {
        logger.error('❌ App: Error calling notification.onReply:', error);
      }
    } else {
      logger.error('❌ App: Missing notification or onReply callback', {
        hasNotification: !!notification,
        hasOnReply: !!(notification && notification.onReply)
      });
    }
  };

  return (
    <>
      <Suspense fallback={null}>
      <NotificationContainer
        notifications={notifications}
        onDismiss={removeNotification}
        onPress={handleNotificationPress}
        onMarkAsRead={handleNotificationMarkAsRead}
        onReply={handleNotificationReply}
        onSendReply={handleSendReply}
      />
      </Suspense>
      <AppContent navigationRef={navigationRef} />
    </>
  );
};

const AppContent = ({ navigationRef: externalNavRef }) => {
  const { colors, isDark } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBiometricLock, setShowBiometricLock] = useState(false);
  const navigationRef = externalNavRef || useRef(null);
  const appState = useRef(AppState.currentState);

  // Use auth hook
  const {
    isLoggedIn,
    userEmail,
    profile,
    setProfile,
    handleInvalidTokenLogout,
    checkAuthStatus,
    handleLogin,
    handleLogout,
    refreshProfile,
  } = useAuth(navigationRef);

  // Setup web title
  useEffect(() => {
    const cleanup = setupWebTitle();
    return cleanup;
  }, []);

  // Setup deep link handling
  useDeepLink(navigationRef);

  // Initialize app
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      
      setGlobalLogoutHandler(handleInvalidTokenLogout);
      
      // One-time migration: Clear old random salts to use new deterministic salts
      const migrateEncryptionSalts = async () => {
        try {
          const encryptionService = (await import('./services/encryptionService')).default;
          const migrationKey = 'encryption_salt_migration_v2';
          const hasMigrated = await AsyncStorage.getItem(migrationKey);
          
          if (!hasMigrated) {
            logger.log('🔄 Migrating encryption salts to deterministic version...');
            await encryptionService.clearAllSalts();
            await AsyncStorage.setItem(migrationKey, 'true');
            logger.log('✅ Encryption salt migration completed');
          }
        } catch (error) {
          logger.error('Error migrating encryption salts:', error);
        }
      };
      
      migrateEncryptionSalts();
      checkAuthStatus();
      
      // Setup app state listener for biometric lock
      const handleAppStateChange = async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active' &&
          isLoggedIn
        ) {
          const biometricService = (await import('./services/biometricService')).default;
          const isRequired = await biometricService.isAuthenticationRequired(0);
          
          if (isRequired) {
            setShowBiometricLock(true);
          }
        }
        appState.current = nextAppState;
      };

      const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
      
      return () => {
        appStateSubscription?.remove();
        setGlobalLogoutHandler(null);
      };
    }
  }, [isLoggedIn, handleInvalidTokenLogout, checkAuthStatus]);

  const handleBiometricAuthenticated = () => {
    setShowBiometricLock(false);
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false); // Close modal first
    await handleLogout(); // Then perform logout
  };

  return (
    <>
      <NavigationContainer 
        ref={navigationRef}
        linking={navigationConfig}
        onStateChange={() => {
          if (Platform.OS === 'web' && typeof document !== 'undefined') {
            document.title = 'onlygossips247';
          }
        }}
      >
        <View style={styles.container}>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="Login">
              {(props) => (
                <Suspense fallback={null}>
                  <LoginScreen {...props} onLogin={handleLogin} />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Chat">
              {(props) => (
                <Suspense fallback={null}>
                <ChatScreen
                  {...props}
                  userEmail={userEmail}
                  onLogout={handleLogout}
                  onProfilePress={() => props.navigation.navigate('Profile')}
                  onSettingsPress={() => props.navigation.navigate('Settings')}
                  onLogoutPress={handleLogoutPress}
                />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Profile">
              {(props) => (
                <Suspense fallback={null}>
                <ProfileScreen
                  {...props}
                  userEmail={userEmail}
                  initialProfile={profile}
                  isProfileComplete={profile?.isProfileComplete || false}
                  onBack={async () => {
                    // Reload profile to get updated isProfileComplete status
                    const profileResult = await profileService.getProfile();
                    if (profileResult.success && profileResult.profile) {
                      const updatedProfile = profileResult.profile;
                      setProfile(updatedProfile);
                      // Navigate to chat if profile is complete
                      if (updatedProfile?.isProfileComplete) {
                        props.navigation.navigate('Chat');
                      } else {
                        props.navigation.goBack();
                      }
                    } else {
                      props.navigation.goBack();
                    }
                  }}
                  isMandatory={!profile || !profile.isProfileComplete}
                />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Settings">
              {(props) => (
                <Suspense fallback={null}>
                <SettingsScreen
                  {...props}
                  onBack={() => props.navigation.goBack()}
                />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Referral">
              {(props) => (
                <Suspense fallback={null}>
                <ReferralScreen
                  {...props}
                />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Feed">
              {(props) => (
                <Suspense fallback={null}>
                <FeedScreen
                  {...props}
                />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Status">
              {(props) => (
                <Suspense fallback={null}>
                <StatusScreen
                  {...props}
                />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Call">
              {(props) => (
                <Suspense fallback={null}>
                <CallScreen
                  {...props}
                />
                </Suspense>
              )}
            </Stack.Screen>
          </Stack.Navigator>
          
          <Suspense fallback={null}>
          <LogoutModal
            visible={showLogoutModal}
            onConfirm={handleLogoutConfirm}
            onCancel={() => setShowLogoutModal(false)}
          />
          </Suspense>
          
          {showBiometricLock && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
              <Suspense fallback={null}>
                <BiometricLockScreen onAuthenticated={handleBiometricAuthenticated} />
              </Suspense>
            </View>
          )}
          
          <StatusBar style={isDark ? "light" : "dark"} />
          <Toast 
            position="top"
            topOffset={60}
            config={toastConfig}
          />
        </View>
      </NavigationContainer>
      {/* Initial loader disabled - removed to prevent stuck loader */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppContentWithNotifications />
      </NotificationProvider>
    </ThemeProvider>
  );
}
