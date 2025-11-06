import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

type GameMode = 'quiz' | 'word-match' | 'spelling-bee' | 'grammar-challenge' | 'vocabulary-builder';

interface GameModeTabProps {
  type: GameMode;
  label: string;
  icon: string;
  isActive: boolean;
  isComingSoon: boolean;
  onPress: () => void;
  isDark: boolean;
}

function GameModeTab({ type, label, icon, isActive, isComingSoon, onPress, isDark }: GameModeTabProps) {
  return (
    <TouchableOpacity
      style={[
        styles.tab,
        isActive && {
          backgroundColor: isDark 
            ? 'rgba(245, 87, 108, 0.3)' 
            : 'rgba(245, 87, 108, 0.15)',
          borderColor: '#f5576c',
          transform: [{ scale: 1.05 }],
        },
        !isActive && {
          backgroundColor: isDark 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.02)',
          borderColor: isDark ? '#2d2d44' : '#e5e7eb',
        },
        isComingSoon && {
          opacity: 0.6,
        }
      ]}
      onPress={onPress}
      disabled={isComingSoon}
      activeOpacity={0.7}>
      <Text style={styles.tabIcon}>{icon}</Text>
      <View style={styles.tabLabelContainer}>
        <Text style={[
          styles.tabLabel,
          {
            color: isActive
              ? '#f5576c'
              : isDark ? '#cbd5e1' : '#4b5563',
            fontWeight: isActive ? '700' : '600',
          }
        ]}>
          {label}
        </Text>
        {isComingSoon && (
          <Text style={[styles.comingSoon, { color: isDark ? '#a0a0b8' : '#6b7280' }]}>
            Coming Soon
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface EnglishGamesMenuProps {
  activeMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export default function EnglishGamesMenu({ activeMode, onModeChange }: EnglishGamesMenuProps) {
  const { isDark } = useTheme();

  const gameModes = [
    { type: 'quiz' as GameMode, label: 'Quiz', icon: '📝', comingSoon: false },
    { type: 'word-match' as GameMode, label: 'Word Match', icon: '🔤', comingSoon: true },
    { type: 'spelling-bee' as GameMode, label: 'Spelling Bee', icon: '🐝', comingSoon: true },
    { type: 'grammar-challenge' as GameMode, label: 'Grammar Challenge', icon: '✏️', comingSoon: true },
    { type: 'vocabulary-builder' as GameMode, label: 'Vocabulary Builder', icon: '📖', comingSoon: true },
  ];

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDark ? '#1a1a2e' : '#f8f9fa',
        borderBottomColor: isDark ? '#2d2d44' : '#e5e7eb',
      }
    ]}>
      <Text style={[
        styles.title,
        { color: isDark ? '#ffffff' : '#1a1a2e' }
      ]}>
        Choose a Game Mode
      </Text>
      <View style={styles.tabsContainer}>
        {gameModes.map((mode) => (
          <GameModeTab
            key={mode.type}
            type={mode.type}
            label={mode.label}
            icon={mode.icon}
            isActive={activeMode === mode.type}
            isComingSoon={mode.comingSoon}
            onPress={() => onModeChange(mode.type)}
            isDark={isDark}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: isMobile ? 16 : 20,
    borderBottomWidth: 2,
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
  title: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: isMobile ? 120 : 140,
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabIcon: {
    fontSize: 24,
  },
  tabLabelContainer: {
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
  },
  comingSoon: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    fontStyle: 'italic',
  },
});

