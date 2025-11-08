import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import ChatScreen from './screens/ChatScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import LogoutModal from './components/common/LogoutModal';
import GLoader from './components/common/GLoader';
import NotificationContainer from './components/common/Notification';
import profileService from './services/profileService';
import authService from './services/authService';

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
    console.log('📨 App: handleSendReply called', {
      hasNotification: !!notification,
      hasOnReply: !!(notification && notification.onReply),
      senderEmail: notification?.senderEmail,
      message: message
    });
    
    if (notification && notification.onReply) {
      try {
        console.log('✅ App: Calling notification.onReply...');
        notification.onReply(message);
        console.log('✅ App: notification.onReply called successfully');
      } catch (error) {
        console.error('❌ App: Error calling notification.onReply:', error);
      }
    } else {
      console.error('❌ App: Missing notification or onReply callback', {
        hasNotification: !!notification,
        hasOnReply: !!(notification && notification.onReply)
      });
    }
  };

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onDismiss={removeNotification}
        onPress={handleNotificationPress}
        onMarkAsRead={handleNotificationMarkAsRead}
        onReply={handleNotificationReply}
        onSendReply={handleSendReply}
      />
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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const email = await AsyncStorage.getItem('userEmail');
      
      if (token && email) {
        setUserEmail(email);
        setIsLoggedIn(true);
        // Check profile completeness
        const profileResult = await profileService.getProfile();
        if (profileResult.success) {
          setProfile(profileResult.profile);
          // Navigate based on profile completeness - ONLY navigate to Profile if incomplete
          setTimeout(() => {
            if (navigationRef.current) {
              // If profile is complete (true), go directly to Chat
              // If profile is incomplete (false/null), go to Profile
              if (profileResult.profile && profileResult.profile.isProfileComplete === true) {
                navigationRef.current.navigate('Chat');
              } else {
                navigationRef.current.navigate('Profile');
              }
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
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
      console.error('Error logging out:', error);
      // Even if API fails, clear local storage and logout
      try {
        const encryptionService = (await import('./services/encryptionService')).default;
        await encryptionService.clearAllKeys();
      } catch (e) {
        console.error('Error clearing encryption keys:', e);
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

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <View style={styles.container}>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
            <Stack.Screen name="Chat">
              {(props) => (
                <ChatScreen
                  {...props}
                  userEmail={userEmail}
                  onLogout={handleLogout}
                  onProfilePress={() => props.navigation.navigate('Profile')}
                  onSettingsPress={() => props.navigation.navigate('Settings')}
                  onLogoutPress={handleLogoutPress}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Profile">
              {(props) => (
                <ProfileScreen
                  {...props}
                  userEmail={userEmail}
                  initialProfile={profile}
                  onBack={() => {
                    handleProfileBack();
                    if (profile?.isProfileComplete) {
                      props.navigation.navigate('Chat');
                    } else {
                      props.navigation.goBack();
                    }
                  }}
                  isMandatory={!profile || !profile.isProfileComplete}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Settings">
              {(props) => (
                <SettingsScreen
                  {...props}
                  onBack={() => props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
          
          <LogoutModal
            visible={showLogoutModal}
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutModal(false)}
          />
          
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
                      {props.text2}
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
                      {props.text2}
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
