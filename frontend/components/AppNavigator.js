import React, { Suspense } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { navigationLinking, handleNavigationStateChange } from '../config/navigation';
import {
  ChatScreen,
  LoginScreen,
  ProfileScreen,
  SettingsScreen,
  ReferralScreen,
  FeedScreen,
  StatusScreen,
  CallScreen,
  LogoutModal,
  BiometricLockScreen,
} from '../config/lazyScreens';
import profileService from '../services/profileService';

const Stack = createNativeStackNavigator();

/**
 * Main navigation component
 */
const AppNavigator = ({
  navigationRef,
  userEmail,
  profile,
  setProfile,
  showLogoutModal,
  setShowLogoutModal,
  showBiometricLock,
  handleLogin,
  handleLogout,
  handleLogoutPress,
  handleBiometricAuthenticated,
}) => {
  const { colors } = useTheme();

  return (
    <NavigationContainer 
      ref={navigationRef}
      linking={navigationLinking}
      onStateChange={handleNavigationStateChange}
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
                <ReferralScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen name="Feed">
            {(props) => (
              <Suspense fallback={null}>
                <FeedScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen name="Status">
            {(props) => (
              <Suspense fallback={null}>
                <StatusScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen name="Call">
            {(props) => (
              <Suspense fallback={null}>
                <CallScreen {...props} />
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
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AppNavigator;

