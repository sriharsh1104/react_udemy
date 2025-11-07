import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatScreen from './screens/ChatScreen';
import LoginScreen from './screens/LoginScreen';
import { COLORS } from './constants';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

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
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email, token) => {
    setUserEmail(email);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
      setIsLoggedIn(false);
      setUserEmail(null);
    } catch (error) {
      console.error('Error logging out:', error);
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
    <View style={styles.container}>
      {isLoggedIn ? (
        <ChatScreen userEmail={userEmail} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
