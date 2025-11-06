import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isMobile = width < 768;

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = Colors[theme];

  const navItems = [
    { label: 'All Games', path: '/', icon: '🎮' },
    { label: 'Maths', path: '/maths', icon: '🔢' },
    { label: 'English', path: '/english', icon: '📚' },
    { label: 'GK', path: '/gk', icon: '🌍' },
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
      router.push(path as '/maths' | '/english' | '/gk');
    }
  };

  return (
    <View style={[
      styles.header,
      {
        backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
        borderBottomColor: isDark ? '#2d2d44' : '#e8e8f0',
      }
    ]}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.title,
              { color: isDark ? '#ffffff' : '#1a1a2e' }
            ]}>
              🎓 Learning Games
            </Text>
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
          <Text style={[
            styles.subtitle,
            { color: isDark ? '#a0a0b8' : '#6b7280' }
          ]}>
            Fun Learning for Class 5 & Below
          </Text>
        </View>
        
        <View style={styles.navContainer}>
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
                    transform: [{ scale: 1.05 }],
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
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: isMobile ? 16 : 24,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  headerContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: isMobile ? 28 : 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
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
  subtitle: {
    fontSize: isMobile ? 13 : 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  navContainer: {
    flexDirection: isMobile ? 'row' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: isMobile ? 8 : 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isMobile ? 10 : 12,
    paddingHorizontal: isMobile ? 16 : 20,
    borderRadius: 16,
    borderWidth: 1.5,
    minWidth: isMobile ? 90 : 110,
    justifyContent: 'center',
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  navIcon: {
    fontSize: isMobile ? 18 : 20,
  },
  navText: {
    fontSize: isMobile ? 13 : 14,
    letterSpacing: 0.2,
  },
});
