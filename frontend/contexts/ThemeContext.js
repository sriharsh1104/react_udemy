import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Light Theme Colors
export const lightColors = {
  // Primary colors
  primary: '#6366F1', // Indigo-500
  primaryDark: '#4F46E5', // Indigo-600
  primaryLight: '#818CF8', // Indigo-400
  
  // Background colors
  background: '#F8FAFC', // Slate-50
  chatBackground: '#E5E7EB', // Light chat background
  receivedMessage: '#FFFFFF', // White for received messages
  
  // Message colors
  sentMessage: '#6366F1', // Indigo-500
  sentMessageText: '#FFFFFF',
  receivedMessageText: '#0F172A', // Slate-900
  
  // Text colors
  text: '#0F172A', // Slate-900
  textSecondary: '#64748B', // Slate-500
  textLight: '#94A3B8', // Slate-400
  
  // UI elements
  white: '#FFFFFF',
  black: '#000000',
  border: '#E2E8F0', // Slate-200
  divider: '#E2E8F0', // Slate-200
  
  // Status colors
  online: '#10B981', // Green-500
  offline: '#6B7280', // Gray-500
  typing: '#F59E0B', // Amber-500
  
  // Input
  inputBackground: '#FFFFFF',
  inputText: '#0F172A',
  inputPlaceholder: '#94A3B8',
  inputDisabledBackground: '#F1F5F9',
  
  // Header
  headerBackground: '#FFFFFF',
  headerText: '#0F172A',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
};

// Dark Theme Colors
export const darkColors = {
  // Primary colors
  primary: '#6366F1', // Indigo-500
  primaryDark: '#4F46E5', // Indigo-600
  primaryLight: '#818CF8', // Indigo-400
  
  // Background colors
  background: '#0F172A', // Slate-900
  chatBackground: '#0F172A', // Dark chat background
  receivedMessage: '#1E293B', // Slate-800
  
  // Message colors
  sentMessage: '#6366F1', // Indigo-500
  sentMessageText: '#FFFFFF',
  receivedMessageText: '#F1F5F9', // Slate-100
  
  // Text colors
  text: '#F1F5F9', // Slate-100
  textSecondary: '#94A3B8', // Slate-400
  textLight: '#64748B', // Slate-500
  
  // UI elements
  white: '#FFFFFF',
  black: '#000000',
  border: '#1E293B', // Slate-800
  divider: '#334155', // Slate-700
  
  // Status colors
  online: '#10B981', // Green-500
  offline: '#6B7280', // Gray-500
  typing: '#F59E0B', // Amber-500
  
  // Input
  inputBackground: '#1E293B',
  inputText: '#F1F5F9',
  inputPlaceholder: '#64748B',
  inputDisabledBackground: '#1E293B',
  
  // Header
  headerBackground: '#1E293B', // Slate-800
  headerText: '#F1F5F9', // Slate-100
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.1)',
};

const ThemeContext = createContext({
  theme: 'dark',
  colors: darkColors,
  setTheme: () => {},
  isDark: true,
});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('auto'); // 'light', 'dark', 'auto'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Determine actual theme based on mode
  const getActualTheme = () => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  };

  const actualTheme = getActualTheme();
  const colors = actualTheme === 'dark' ? darkColors : lightColors;
  const isDark = actualTheme === 'dark';

  const value = {
    theme: actualTheme,
    themeMode, // 'light', 'dark', 'auto'
    colors,
    setTheme,
    isDark,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

