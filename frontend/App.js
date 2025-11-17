import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import logger from './utils/logger';
import GLoader from './components/common/GLoader';
import profileService from './services/profileService';
import authService from './services/authService';
import { setGlobalLogoutHandler } from './utils/apiHelper';

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
      <Suspense fallback={<GLoader visible={true} message="Loading..." />}>
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
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigationRef = externalNavRef || useRef(null);

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
    
    // Clear local storage
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userEmail');
    
    // Update state
    setIsLoggedIn(false);
    setUserEmail(null);
    setProfile(null);
    setShowLogoutModal(false);
    
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
    
    return () => {
      subscription?.remove();
      // Clear global logout handler on unmount
      setGlobalLogoutHandler(null);
    };
    }
  }, []);
  
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

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const email = await AsyncStorage.getItem('userEmail');
      
      if (token && email) {
        setUserEmail(email);
        setIsLoggedIn(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email, token, loginProfile, isProfileComplete) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    
    // Set profile with isProfileComplete flag
    const profileWithComplete = loginProfile 
      ? { ...loginProfile, isProfileComplete: isProfileComplete ?? loginProfile.isProfileComplete }
      : null;
    setProfile(profileWithComplete);
    
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
      
      // Clear local storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
      setIsLoggedIn(false);
      setUserEmail(null);
      setProfile(null);
      setShowLogoutModal(false);
      
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
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
      setIsLoggedIn(false);
      setUserEmail(null);
      setProfile(null);
      setShowLogoutModal(false);
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
                <Suspense fallback={<GLoader visible={true} message="Loading..." />}>
                  <LoginScreen {...props} onLogin={handleLogin} />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Chat">
              {(props) => (
                <Suspense fallback={<GLoader visible={true} message="Loading..." />}>
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
                <Suspense fallback={<GLoader visible={true} message="Loading..." />}>
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
                <Suspense fallback={<GLoader visible={true} message="Loading..." />}>
                <SettingsScreen
                  {...props}
                  onBack={() => props.navigation.goBack()}
                />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Referral">
              {(props) => (
                <Suspense fallback={<GLoader visible={true} message="Loading..." />}>
                <ReferralScreen
                  {...props}
                />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Feed">
              {(props) => (
                <Suspense fallback={<GLoader visible={true} message="Loading..." />}>
                <FeedScreen
                  {...props}
                />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Status">
              {(props) => (
                <Suspense fallback={<GLoader visible={true} message="Loading..." />}>
                <StatusScreen
                  {...props}
                />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Call">
              {(props) => (
                <Suspense fallback={<GLoader visible={true} message="Loading..." />}>
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
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
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
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
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
      <GLoader visible={isLoading} message="Loading..." />
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
