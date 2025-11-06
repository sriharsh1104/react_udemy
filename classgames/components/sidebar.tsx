import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useGameMode, GameType, EnglishMode, GKMode, ComputerMode } from '@/contexts/GameModeContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isMobile = width < 768;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = Colors[theme];
  const { gameMode, setGameMode } = useGameMode();
  const [isOpen, setIsOpen] = useState(!isMobile);
  
  // Auto-expand category based on current path
  const getCategoryFromPath = () => {
    if (pathname?.startsWith('/maths')) return 'maths';
    if (pathname?.startsWith('/english')) return 'english';
    if (pathname?.startsWith('/gk')) return 'gk';
    if (pathname?.startsWith('/computer')) return 'computer';
    return null;
  };
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(getCategoryFromPath());

  // Update expanded category when pathname changes
  useEffect(() => {
    const category = getCategoryFromPath();
    if (category) {
      setExpandedCategory(category);
    }
  }, [pathname]);

  const navItems = [
    { label: 'All Games', path: '/', icon: '🎮', hasSubMenu: false },
    { label: 'Maths', path: '/maths', icon: '🔢', hasSubMenu: true, category: 'maths' },
    { label: 'English', path: '/english', icon: '📚', hasSubMenu: true, category: 'english' },
    { label: 'GK', path: '/gk', icon: '🌍', hasSubMenu: true, category: 'gk' },
    { label: 'Computer', path: '/computer', icon: '💻', hasSubMenu: true, category: 'computer' },
  ];

  const mathsSubMenu = [
    { type: 'quiz' as GameType, label: 'Quiz', icon: '📝' },
    { type: 'balloon' as GameType, label: 'Balloon Pop', icon: '🎈' },
    { type: 'rocket' as GameType, label: 'Rocket Launch', icon: '🚀' },
  ];

  const englishSubMenu = [
    { type: 'quiz' as EnglishMode, label: 'Quiz', icon: '📝' },
    { type: 'word-match' as EnglishMode, label: 'Word Match', icon: '🔤', comingSoon: true },
    { type: 'spelling-bee' as EnglishMode, label: 'Spelling Bee', icon: '🐝', comingSoon: true },
    { type: 'grammar-challenge' as EnglishMode, label: 'Grammar Challenge', icon: '✏️', comingSoon: true },
    { type: 'vocabulary-builder' as EnglishMode, label: 'Vocabulary Builder', icon: '📖', comingSoon: true },
  ];

  const gkSubMenu = [
    { type: 'quiz' as GKMode, label: 'Quiz', icon: '🌍' },
    { type: 'world-trivia' as GKMode, label: 'World Trivia', icon: '🗺️', comingSoon: true },
    { type: 'science-quiz' as GKMode, label: 'Science Quiz', icon: '🔬', comingSoon: true },
    { type: 'history-challenge' as GKMode, label: 'History Challenge', icon: '📜', comingSoon: true },
    { type: 'nature-explorer' as GKMode, label: 'Nature Explorer', icon: '🌿', comingSoon: true },
  ];

  const computerSubMenu = [
    { type: 'quiz' as ComputerMode, label: 'Quiz', icon: '💻' },
    { type: 'typing-master' as ComputerMode, label: 'Typing Master', icon: '⌨️', comingSoon: true },
    { type: 'code-challenge' as ComputerMode, label: 'Code Challenge', icon: '💻', comingSoon: true },
    { type: 'hardware-quiz' as ComputerMode, label: 'Hardware Quiz', icon: '🔧', comingSoon: true },
    { type: 'internet-explorer' as ComputerMode, label: 'Internet Explorer', icon: '🌐', comingSoon: true },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/index' || pathname === '';
    }
    return pathname === path || pathname?.startsWith(path);
  };

  const handleNavigation = (path: string, category?: string) => {
    if (path === '/') {
      router.push('/');
      setExpandedCategory(null);
    } else {
      router.push(path as '/maths' | '/english' | '/gk' | '/computer');
      if (category) {
        // Toggle if already expanded and on the same page, otherwise expand
        const isCurrentlyActive = isActive(path);
        if (isCurrentlyActive && expandedCategory === category) {
          setExpandedCategory(null);
        } else {
          setExpandedCategory(category);
        }
      }
    }
    if (isMobile && !category) {
      setIsOpen(false);
    }
  };

  const handleSubMenuClick = (type: GameType | EnglishMode | GKMode | ComputerMode, category: string) => {
    setGameMode(type);
    // Close sidebar on mobile after selection
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const getSubMenu = (category: string) => {
    switch (category) {
      case 'maths':
        return mathsSubMenu;
      case 'english':
        return englishSubMenu;
      case 'gk':
        return gkSubMenu;
      case 'computer':
        return computerSubMenu;
      default:
        return [];
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
                🎓 Games
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
              const isExpanded = expandedCategory === item.category;
              const subMenu = item.hasSubMenu && item.category ? getSubMenu(item.category) : [];

              return (
                <View key={item.path}>
                  <TouchableOpacity
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
                    onPress={() => handleNavigation(item.path, item.category)}
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
                    {item.hasSubMenu && (
                      <Text style={[styles.expandIcon, { color: isDark ? '#cbd5e1' : '#4b5563' }]}>
                        {isExpanded ? '▼' : '▶'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  
                  {isExpanded && subMenu.length > 0 && (
                    <View style={styles.subMenuContainer}>
                      {subMenu.map((subItem) => (
                        <TouchableOpacity
                          key={subItem.type}
                          style={[
                            styles.subMenuButton,
                            {
                              backgroundColor: isDark 
                                ? 'rgba(255, 255, 255, 0.03)' 
                                : 'rgba(0, 0, 0, 0.01)',
                              borderColor: isDark ? '#2d2d44' : '#e5e7eb',
                              opacity: (subItem as any).comingSoon ? 0.6 : 1,
                            },
                            gameMode === subItem.type && {
                              backgroundColor: isDark 
                                ? 'rgba(102, 126, 234, 0.2)' 
                                : 'rgba(102, 126, 234, 0.1)',
                              borderColor: '#667eea',
                            }
                          ]}
                          onPress={() => !(subItem as any).comingSoon && handleSubMenuClick(subItem.type, item.category!)}
                          disabled={(subItem as any).comingSoon}
                          activeOpacity={0.7}>
                          <Text style={styles.subMenuIcon}>{subItem.icon}</Text>
                          <Text
                            style={[
                              styles.subMenuText,
                              {
                                color: gameMode === subItem.type
                                  ? '#667eea'
                                  : isDark ? '#a0a0b8' : '#6b7280',
                                fontWeight: gameMode === subItem.type ? '700' : '500',
                              },
                            ]}>
                            {subItem.label}
                          </Text>
                          {(subItem as any).comingSoon && (
                            <Text style={[styles.comingSoon, { color: isDark ? '#a0a0b8' : '#6b7280' }]}>
                              Soon
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
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
  expandIcon: {
    fontSize: 12,
    marginLeft: 8,
  },
  subMenuContainer: {
    marginLeft: 16,
    marginTop: 4,
    marginBottom: 8,
    gap: 4,
  },
  subMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
    gap: 8,
  },
  subMenuIcon: {
    fontSize: 18,
  },
  subMenuText: {
    fontSize: isMobile ? 13 : 14,
    flex: 1,
  },
  comingSoon: {
    fontSize: 10,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});

