import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Sidebar from '@/components/sidebar';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isMobile = width < 768;
const cardWidth = isTablet ? (width - 80) / 3 : width - 40;

export default function AllGames() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const colors = Colors[theme];

  const gameCategories = [
    {
      title: 'Maths Games',
      description: 'Practice addition, subtraction, multiplication, and division with fun quizzes',
      icon: '🔢',
      route: '/maths',
      gradient: ['#667eea', '#764ba2'],
      color: '#667eea',
    },
    {
      title: 'English Games',
      description: 'Learn grammar, spelling, and vocabulary through interactive exercises',
      icon: '📚',
      route: '/english',
      gradient: ['#f093fb', '#f5576c'],
      color: '#f5576c',
    },
    {
      title: 'GK Games',
      description: 'Test your general knowledge about the world around you',
      icon: '🌍',
      route: '/gk',
      gradient: ['#4facfe', '#00f2fe'],
      color: '#4facfe',
    },
    {
      title: 'Computer Games',
      description: 'Test your computer and technology knowledge with fun quizzes',
      icon: '💻',
      route: '/computer',
      gradient: ['#10b981', '#059669'],
      color: '#10b981',
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.layout}>
        <Sidebar />
        <View style={styles.mainContent}>
          <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.gameContainer}>
          <View style={styles.heroSection}>
            <Text style={[
              styles.pageTitle,
                    { color: isDark ? '#ffffff' : '#1a1a2e' }
            ]}>
              Welcome to Learning Games! 🎮
            </Text>
            <Text style={[
              styles.subtitle,
                    { color: isDark ? '#a0a0b8' : '#6b7280' }
            ]}>
              Choose a game category below and start your learning journey!
            </Text>
          </View>

          <View style={styles.categoriesContainer}>
            {gameCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: isDark ? '#1e1e2e' : '#ffffff',
                    borderColor: category.color,
                    width: isTablet ? cardWidth : '100%',
                  }
                ]}
                onPress={() => router.push(category.route as '/maths' | '/english' | '/gk' | '/computer')}
                activeOpacity={0.9}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: `${category.color}15` }
                ]}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                </View>
                
                <ThemedText type="subtitle" style={[
                  styles.categoryTitle,
                    { color: isDark ? '#ffffff' : '#1a1a2e' }
                ]}>
                  {category.title}
                </ThemedText>
                
                <ThemedText style={[
                  styles.categoryDescription,
                    { color: isDark ? '#a0a0b8' : '#6b7280' }
                ]}>
                  {category.description}
                </ThemedText>
                
                <TouchableOpacity
                  style={[
                    styles.playButton,
                    {
                      backgroundColor: category.color,
                      ...Platform.select({
                        ios: {
                          shadowColor: category.color,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                        },
                        android: {
                          elevation: 6,
                        },
                        web: {
                          boxShadow: `0 4px 14px 0 ${category.color}40`,
                        },
                      }),
                    }
                  ]}
                  activeOpacity={0.8}>
                  <Text style={styles.playButtonText}>Play Now</Text>
                  <Text style={styles.playButtonArrow}>→</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[
            styles.infoCard,
            {
              backgroundColor: isDark 
                ? 'rgba(102, 126, 234, 0.1)' 
                : 'rgba(102, 126, 234, 0.05)',
              borderColor: isDark 
                ? 'rgba(102, 126, 234, 0.3)' 
                : 'rgba(102, 126, 234, 0.2)',
            }
          ]}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoIcon}>🎮</Text>
              <ThemedText type="subtitle" style={[
                styles.infoTitle,
                    { color: isDark ? '#ffffff' : '#1a1a2e' }
              ]}>
                How to Play
              </ThemedText>
            </View>
            <View style={styles.infoList}>
              {[
                'Select a game category from above',
                'Answer questions by choosing the correct option',
                'Get instant feedback on your answers',
                'Track your score and improve your knowledge!',
              ].map((item, idx) => (
                <View key={idx} style={styles.infoItem}>
                  <View style={[
                    styles.infoBullet,
                    { backgroundColor: isDark ? '#667eea' : '#667eea' }
                  ]} />
                  <Text style={[
                    styles.infoText,
                    { color: isDark ? '#cbd5e1' : '#4b5563' }
                  ]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  gameContainer: {
    padding: isMobile ? 20 : 32,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  heroSection: {
    marginBottom: isMobile ? 32 : 40,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: isMobile ? 32 : 48,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -1,
    lineHeight: isMobile ? 40 : 56,
  },
  subtitle: {
    fontSize: isMobile ? 16 : 18,
    textAlign: 'center',
    lineHeight: isMobile ? 24 : 28,
    paddingHorizontal: isMobile ? 0 : 40,
  },
  categoriesContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: isMobile ? 24 : 28,
    marginBottom: 40,
    justifyContent: isTablet ? 'space-between' : 'center',
  },
  categoryCard: {
    padding: isMobile ? 24 : 32,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      },
    }),
  },
  iconContainer: {
    width: isMobile ? 80 : 100,
    height: isMobile ? 80 : 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIcon: {
    fontSize: isMobile ? 48 : 56,
  },
  categoryTitle: {
    fontSize: isMobile ? 24 : 28,
    marginBottom: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: isMobile ? 15 : 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: isMobile ? 22 : 24,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isMobile ? 14 : 16,
    paddingHorizontal: isMobile ? 32 : 40,
    borderRadius: 16,
    gap: 8,
    minWidth: 140,
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  playButtonArrow: {
    color: '#ffffff',
    fontSize: isMobile ? 18 : 20,
    fontWeight: '700',
  },
  infoCard: {
    padding: isMobile ? 24 : 32,
    borderRadius: 20,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  infoIcon: {
    fontSize: 28,
  },
  infoTitle: {
    fontSize: isMobile ? 22 : 24,
    fontWeight: '700',
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  infoText: {
    fontSize: isMobile ? 15 : 16,
    lineHeight: isMobile ? 24 : 26,
    flex: 1,
  },
});
