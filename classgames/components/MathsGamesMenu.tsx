import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

type GameType = 'quiz' | 'balloon' | 'rocket';

interface GameTabProps {
  type: GameType;
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
  isDark: boolean;
}

function GameTab({ type, label, icon, isActive, onPress, isDark }: GameTabProps) {
  return (
    <TouchableOpacity
      style={[
        styles.tab,
        isActive && {
          backgroundColor: isDark 
            ? 'rgba(102, 126, 234, 0.3)' 
            : 'rgba(102, 126, 234, 0.15)',
          borderColor: '#667eea',
          transform: [{ scale: 1.05 }],
        },
        !isActive && {
          backgroundColor: isDark 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.02)',
          borderColor: isDark ? '#2d2d44' : '#e5e7eb',
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[
        styles.tabLabel,
        {
          color: isActive
            ? '#667eea'
            : isDark ? '#cbd5e1' : '#4b5563',
          fontWeight: isActive ? '700' : '600',
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface MathsGamesMenuProps {
  activeGame: GameType;
  onGameChange: (game: GameType) => void;
}

export default function MathsGamesMenu({ activeGame, onGameChange }: MathsGamesMenuProps) {
  const { isDark } = useTheme();

  const games = [
    { type: 'quiz' as GameType, label: 'Quiz', icon: '📝' },
    { type: 'balloon' as GameType, label: 'Balloon Pop', icon: '🎈' },
    { type: 'rocket' as GameType, label: 'Rocket Launch', icon: '🚀' },
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
        {games.map((game) => (
          <GameTab
            key={game.type}
            type={game.type}
            label={game.label}
            icon={game.icon}
            isActive={activeGame === game.type}
            onPress={() => onGameChange(game.type)}
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
    minWidth: isMobile ? 100 : 120,
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
  tabLabel: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
  },
});

