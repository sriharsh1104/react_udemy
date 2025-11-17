import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook to get userEmail from AsyncStorage
 * This prevents exposing email in URL parameters
 */
export const useUserEmail = () => {
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserEmail();
  }, []);

  const loadUserEmail = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      setUserEmail(email || null);
    } catch (error) {
      console.error('Error loading userEmail:', error);
      setUserEmail(null);
    } finally {
      setLoading(false);
    }
  };

  return { userEmail, loading, refreshUserEmail: loadUserEmail };
};

export default useUserEmail;

