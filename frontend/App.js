import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import logger from './utils/logger';
// GLoader removed - all loaders disabled
import profileService from './services/profileService';
import authService from './services/authService';
import { setGlobalLogoutHandler } from './utils/apiHelper';

// Fix for non-passive wheel event listener warning on web
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // Patch addEventListener to make wheel events passive by default
  // This fixes the violation warning from React Native Web's ScrollView
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // If it's a wheel event and options is not explicitly an object with passive: false,
    // make it passive to improve scroll performance
    if (type === 'wheel') {
      if (typeof options !== 'object' || options === null) {
        options = { passive: true };
      } else if (options.passive === undefined) {
        // Only set passive if not explicitly set to false
        options = { ...options, passive: true };
      }
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  // Global fix for aria-hidden accessibility warning
  // Monitor for focused elements inside aria-hidden containers
  const fixAriaHiddenForFocusedElements = () => {
    const activeElement = document.activeElement;
    if (!activeElement || activeElement === document.body || activeElement === document.documentElement) {
      return;
    }

    // Walk up the DOM tree and remove aria-hidden from ancestors of focused elements
    let current = activeElement.parentElement;
    while (current && current !== document.body && current !== document.documentElement) {
      if (current.hasAttribute('aria-hidden') && current.getAttribute('aria-hidden') === 'true') {
        // Only remove if this element actually contains the focused element
        if (current.contains(activeElement)) {
          current.removeAttribute('aria-hidden');
        }
      }
      current = current.parentElement;
    }
  };

  // Use MutationObserver to watch for aria-hidden changes and focused elements
  const observer = new MutationObserver(() => {
    requestAnimationFrame(fixAriaHiddenForFocusedElements);
  });

  // Observe the document body for aria-hidden attribute changes
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['aria-hidden'],
    subtree: true,
  });

  // Also run on focus events
  const handleFocus = () => {
    requestAnimationFrame(fixAriaHiddenForFocusedElements);
  };
  
  document.addEventListener('focusin', handleFocus, true);
  
  // Initial check
  requestAnimationFrame(fixAriaHiddenForFocusedElements);
}

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Disabled initial loader
  const [userEmail, setUserEmail] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBiometricLock, setShowBiometricLock] = useState(false);
  const [isCheckingBiometric, setIsCheckingBiometric] = useState(false);
  const navigationRef = externalNavRef || useRef(null);
  const appState = useRef(AppState.currentState);

  // Handle automatic logout on invalid token
  const handleInvalidTokenLogout = async () => {
    logger.log('🔒 Invalid token detected - logging out automatically');
    try {
      // Clear encryption keys
      const encryptionService = (await import('./services/encryptionService')).default;
      await encryptionService.clearAllKeys();
    } catch (error) {
      logger.error('Error clearing encryption keys:', error);
    }
    
    // Clear chat storage
    try {
      const chatStorageService = (await import('./services/chatStorageService')).default;
      await chatStorageService.clearAllChats();
    } catch (error) {
      logger.error('Error clearing chat storage:', error);
    }
    
    // Clear local storage
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userEmail');
    
    // Clear biometric authentication state
    const biometricService = (await import('./services/biometricService')).default;
    await biometricService.clearAuthenticationState();
    
    // Update state
    setIsLoggedIn(false);
    setUserEmail(null);
    setProfile(null);
    setShowLogoutModal(false);
    setShowBiometricLock(false);
    
    // Navigate to login
    if (navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
    
    // Show toast notification
    Toast.show({
      type: 'error',
      text1: 'Session Expired',
      text2: 'Your session has expired. Please login again.',
      position: 'top',
      topOffset: 60,
    });
  };

  // Set browser title to always show "onlygossips247" on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Set initial title
      document.title = 'onlygossips247';
      
      // Watch for title changes and reset it back
      const titleObserver = new MutationObserver(() => {
        if (document.title !== 'onlygossips247') {
          document.title = 'onlygossips247';
        }
      });
      
      // Observe title element changes
      const titleElement = document.querySelector('title');
      if (titleElement) {
        titleObserver.observe(titleElement, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
      
      // Also periodically check and reset (fallback)
      const titleCheckInterval = setInterval(() => {
        if (document.title !== 'onlygossips247') {
          document.title = 'onlygossips247';
        }
      }, 100);
      
      return () => {
        titleObserver.disconnect();
        clearInterval(titleCheckInterval);
      };
    }
  }, []);

  // Use ref to prevent double calls in React 18 dev mode
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      
    // Set global logout handler for invalid token
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
    handleInitialURL();
    
    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Setup app state listener for biometric lock
    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isLoggedIn
      ) {
        // App came to foreground and user is logged in - check biometric lock
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
      subscription?.remove();
      appStateSubscription?.remove();
      // Clear global logout handler on unmount
      setGlobalLogoutHandler(null);
    };
    }
  }, [isLoggedIn]);
  
  const handleInitialURL = async () => {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      }
    } catch (error) {
      logger.error('Error getting initial URL:', error);
    }
  };
  
  const handleDeepLink = ({ url }) => {
    if (!url) return;
    
    try {
      logger.log('🔗 Deep link received:', url);
      
      // Parse URL - handle both expo-linking format and direct URLs
      let parsed;
      try {
        parsed = Linking.parse(url);
      } catch (e) {
        // Fallback: manual parsing for web URLs
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const codeMatch = pathname.match(/\/referral\/([^/?]+)/);
        if (codeMatch && codeMatch[1]) {
          const referralCode = codeMatch[1];
          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('Referral', { referralCode });
            }
          }, 500);
        }
        return;
      }
      
      const { path, queryParams, hostname } = parsed;
      logger.log('🔗 Parsed:', { path, queryParams, hostname });
      
      // Handle referral link: /referral/:code
      if (path === 'referral' && queryParams?.code) {
        const referralCode = queryParams.code;
        setTimeout(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('Referral', { referralCode });
          }
        }, 500);
      } else if (path?.includes('referral/')) {
        // Handle format: /referral/CODE
        const codeMatch = path.match(/referral\/([^/?]+)/);
        if (codeMatch && codeMatch[1]) {
          const referralCode = codeMatch[1];
          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('Referral', { referralCode });
            }
          }, 500);
        }
      } else if (path && path.startsWith('/referral/')) {
        // Handle format: /referral/CODE (when path starts with /)
        const codeMatch = path.match(/\/referral\/([^/?]+)/);
        if (codeMatch && codeMatch[1]) {
          const referralCode = codeMatch[1];
          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('Referral', { referralCode });
            }
          }, 500);
        }
      }
    } catch (error) {
      logger.error('Error handling deep link:', error);
    }
  };

  const checkBiometricLock = async () => {
    try {
      const biometricService = (await import('./services/biometricService')).default;
      const isRequired = await biometricService.isAuthenticationRequired(0);
      
      if (isRequired) {
        setShowBiometricLock(true);
        return false; // Authentication required
      }
      return true; // No authentication required
    } catch (error) {
      logger.error('Error checking biometric lock:', error);
      return true; // On error, allow access
    }
  };

  const handleBiometricAuthenticated = () => {
    setShowBiometricLock(false);
  };

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const email = await AsyncStorage.getItem('userEmail');
      
      if (token && email) {
        setUserEmail(email);
        setIsLoggedIn(true);
        
        // Check if biometric lock is enabled and required
        const biometricPassed = await checkBiometricLock();
        if (!biometricPassed) {
          // Biometric lock screen will be shown
          return;
        }
        
        // Navigate to Chat - profile will be loaded when needed
        // Use requestAnimationFrame for smoother transition (prevents flicker)
        requestAnimationFrame(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('Chat');
          }
        });
      }
    } catch (error) {
      logger.error('Error checking auth status:', error);
    }
    // No loader needed - removed setIsLoading
  };

  const handleLogin = async (email, token, loginProfile, isProfileComplete) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    
    // Set profile with isProfileComplete flag
    const profileWithComplete = loginProfile 
      ? { ...loginProfile, isProfileComplete: isProfileComplete ?? loginProfile.isProfileComplete }
      : null;
    setProfile(profileWithComplete);
    
    // Check biometric lock after login
    const biometricPassed = await checkBiometricLock();
    if (!biometricPassed) {
      // Biometric lock screen will be shown
      return;
    }
    
    // Navigate based on profile completeness - ONLY navigate to Profile if incomplete
    setTimeout(() => {
      if (navigationRef.current) {
        // If profile is complete (true), go directly to Chat
        // If profile is incomplete (false/null), go to Profile
        if (isProfileComplete === true || (profileWithComplete && profileWithComplete.isProfileComplete === true)) {
          navigationRef.current.navigate('Chat');
        } else {
          navigationRef.current.navigate('Profile');
        }
      }
    }, 100);
  };

  const handleLogout = async () => {
    try {
      // Get token before clearing
      const token = await AsyncStorage.getItem('authToken');
      
      // Call logout API
      if (token) {
        await authService.logout(token);
      }
      
      // Clear encryption keys
      const encryptionService = (await import('./services/encryptionService')).default;
      await encryptionService.clearAllKeys();
      
      // Clear chat storage
      const chatStorageService = (await import('./services/chatStorageService')).default;
      await chatStorageService.clearAllChats();
      
      // Clear local storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
      
      // Clear biometric authentication state
      const biometricService = (await import('./services/biometricService')).default;
      await biometricService.clearAuthenticationState();
      
      setIsLoggedIn(false);
      setUserEmail(null);
      setProfile(null);
      setShowLogoutModal(false);
      setShowBiometricLock(false);
      
      // Navigate to login
      if (navigationRef.current) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      logger.error('Error logging out:', error);
      // Even if API fails, clear local storage and logout
      try {
        const encryptionService = (await import('./services/encryptionService')).default;
        await encryptionService.clearAllKeys();
      } catch (e) {
        logger.error('Error clearing encryption keys:', e);
      }
      try {
        const chatStorageService = (await import('./services/chatStorageService')).default;
        await chatStorageService.clearAllChats();
      } catch (e) {
        logger.error('Error clearing chat storage:', e);
      }
      try {
        const biometricService = (await import('./services/biometricService')).default;
        await biometricService.clearAuthenticationState();
      } catch (e) {
        logger.error('Error clearing biometric state:', e);
      }
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
      setIsLoggedIn(false);
      setUserEmail(null);
      setProfile(null);
      setShowLogoutModal(false);
      setShowBiometricLock(false);
      if (navigationRef.current) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleProfileBack = async () => {
    // Refresh profile after save
    const profileResult = await profileService.getProfile();
    if (profileResult.success) {
      setProfile(profileResult.profile);
      // Navigate to chat if profile is complete
      if (profileResult.profile?.isProfileComplete && navigationRef.current) {
        navigationRef.current.navigate('Chat');
      }
    }
  };

  // Configure linking for URL-based routing on web
  const linking = {
    prefixes: ['/'],
    config: {
      screens: {
        Login: '',
        Chat: 'chat',
        Profile: 'profile',
        Settings: 'settings',
        Feed: 'feed',
        Status: 'status',
        Call: 'call',
        Referral: 'referral/:referralCode',
      },
    },
  };

  return (
    <>
      <NavigationContainer 
        ref={navigationRef}
        linking={linking}
        onStateChange={() => {
          // Reset browser title to "onlygossips247" on every navigation change (web only)
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
            onConfirm={handleLogout}
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
            config={{
              success: (props) => (
                <View style={{
                  backgroundColor: '#34C759',
                  padding: 12,
                  borderRadius: 8,
                  marginHorizontal: 16,
                  marginTop: 8,
                  alignSelf: 'flex-end',
                  maxWidth: '80%',
                  ...(Platform.OS === 'web' ? {
                    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
                  } : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                  }),
                }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                    {props.text1}
                  </Text>
                  {props.text2 && (
                    <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
                      {typeof props.text2 === 'string' 
                        ? props.text2 
                        : (props.text2?.message || props.text2?.text || String(props.text2 || ''))}
                    </Text>
                  )}
                </View>
              ),
              error: (props) => (
                <View style={{
                  backgroundColor: '#FF3B30',
                  padding: 12,
                  borderRadius: 8,
                  marginHorizontal: 16,
                  marginTop: 8,
                  alignSelf: 'flex-end',
                  maxWidth: '80%',
                  ...(Platform.OS === 'web' ? {
                    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
                  } : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                  }),
                }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                    {props.text1}
                  </Text>
                  {props.text2 && (
                    <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
                      {typeof props.text2 === 'string' 
                        ? props.text2 
                        : (props.text2?.message || props.text2?.text || String(props.text2 || ''))}
                    </Text>
                  )}
                </View>
              ),
            }}
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
