import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isMobile = width < 768;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = Colors[theme];
  const [isOpen, setIsOpen] = useState(!isMobile);

  const navItems = [
    { label: 'All Games', path: '/', icon: '🎮' },
    { label: 'Maths', path: '/maths', icon: '🔢' },
    { label: 'English', path: '/english', icon: '📚' },
    { label: 'GK', path: '/gk', icon: '🌍' },
    { label: 'Computer', path: '/computer', icon: '💻' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/index' || pathname === '';
    }
    return pathname === path || pathname?.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    if (path === '/') {
      router.push('/');
    } else {
      router.push(path as '/maths' | '/english' | '/gk' | '/computer');
    }
    if (isMobile) {
      setIsOpen(false);
    }
  };

  if (!isOpen && isMobile) {
    return (
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}>
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      {isMobile && (
        <View style={styles.overlay} onTouchEnd={() => setIsOpen(false)} />
      )}
      <View style={[
        styles.sidebar,
        {
          backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
          borderRightColor: isDark ? '#2d2d44' : '#e8e8f0',
        },
        isMobile && styles.sidebarMobile
      ]}>
        <View style={styles.sidebarContent}>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={[
                styles.title,
                { color: isDark ? '#ffffff' : '#1a1a2e' }
              ]}>
                🎓 Priyanka Games
              </Text>
              {isMobile && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsOpen(false)}
                  activeOpacity={0.7}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.themeToggle,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? '#2d2d44' : '#e5e7eb',
                }
              ]}
              onPress={toggleTheme}
              activeOpacity={0.7}>
              <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.navContainer} showsVerticalScrollIndicator={false}>
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <TouchableOpacity
                  key={item.path}
                  style={[
                    styles.navButton,
                    active && {
                      backgroundColor: isDark 
                        ? 'rgba(10, 126, 164, 0.3)' 
                        : 'rgba(10, 126, 164, 0.1)',
                      borderColor: colors.tint,
                      transform: [{ scale: 1.02 }],
                    },
                    !active && {
                      backgroundColor: isDark 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      borderColor: isDark ? '#2d2d44' : '#e5e7eb',
                    }
                  ]}
                  onPress={() => handleNavigation(item.path)}
                  activeOpacity={0.7}>
                  <Text style={styles.navIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.navText,
                      {
                        color: active
                          ? colors.tint
                          : isDark ? '#cbd5e1' : '#4b5563',
                        fontWeight: active ? '700' : '600',
                      },
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: isMobile ? 280 : 260,
    borderRightWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '2px 0 6px -1px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  sidebarMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 1000,
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  menuButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    zIndex: 1001,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  sidebarContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  titleContainer: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: isMobile ? 20 : 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  themeIcon: {
    fontSize: 20,
  },
  navContainer: {
    flex: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  navIcon: {
    fontSize: 20,
  },
  navText: {
    fontSize: isMobile ? 15 : 16,
    letterSpacing: 0.2,
    flex: 1,
  },
});

