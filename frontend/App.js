import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from './screens/ChatScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import LogoutModal from './components/common/LogoutModal';
import profileService from './services/profileService';
import authService from './services/authService';
import { COLORS } from './constants';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigationRef = useRef(null);

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

  if (isLoading) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
    </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <View style={styles.container}>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
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
                onLogoutPress={handleLogoutPress}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Profile">
            {(props) => (
              <ProfileScreen
                {...props}
                userEmail={userEmail}
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
        </Stack.Navigator>
        
        <LogoutModal
          visible={showLogoutModal}
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
        
        <StatusBar style="light" />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
