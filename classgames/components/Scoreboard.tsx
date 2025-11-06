import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, Dimensions, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

interface ScoreboardProps {
  visible: boolean;
  totalQuestions: number;
  correctAnswers: number;
  onClose: () => void;
  onPlayAgain: () => void;
  questions?: Array<{
    question: string;
    userAnswer: number | string;
    correctAnswer: number | string;
    isCorrect: boolean;
    operation?: string;
  }>;
}

export default function Scoreboard({
  visible,
  totalQuestions,
  correctAnswers,
  onClose,
  onPlayAgain,
  questions = [],
}: ScoreboardProps) {
  const { isDark } = useTheme();
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  const getPerformanceMessage = () => {
    if (percentage === 100) return { emoji: '🌟', text: 'Perfect Score!', color: '#10b981' };
    if (percentage >= 80) return { emoji: '🎉', text: 'Excellent!', color: '#10b981' };
    if (percentage >= 60) return { emoji: '👏', text: 'Good Job!', color: '#f59e0b' };
    if (percentage >= 40) return { emoji: '💪', text: 'Keep Practicing!', color: '#f59e0b' };
    return { emoji: '📚', text: 'Try Again!', color: '#ef4444' };
  };

  const performance = getPerformanceMessage();

  // Group questions by operation if available
  const groupedQuestions = questions.reduce((acc, q, index) => {
    const op = q.operation || 'other';
    if (!acc[op]) acc[op] = [];
    acc[op].push({ ...q, index });
    return acc;
  }, {} as Record<string, typeof questions>);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[
          styles.container,
          {
            backgroundColor: isDark ? '#1e1e2e' : '#ffffff',
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
              },
              android: {
                elevation: 10,
              },
              web: {
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              },
            }),
          }
        ]}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
                🎯 Final Score
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? '#a0a0b8' : '#6b7280' }]}>
                Game Complete!
              </Text>
            </View>

            {/* Score Circle */}
            <View style={styles.scoreCircleContainer}>
              <View style={[
                styles.scoreCircle,
                { borderColor: performance.color }
              ]}>
                <Text style={[styles.scorePercentage, { color: performance.color }]}>
                  {percentage}%
                </Text>
                <Text style={[styles.scoreFraction, { color: isDark ? '#a0a0b8' : '#6b7280' }]}>
                  {correctAnswers}/{totalQuestions}
                </Text>
              </View>
              <Text style={[styles.performanceText, { color: performance.color }]}>
                {performance.emoji} {performance.text}
              </Text>
            </View>

            {/* Statistics */}
            <View style={styles.statsContainer}>
              <View style={[
                styles.statBox,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                }
              ]}>
                <Text style={styles.statValue}>{correctAnswers}</Text>
                <Text style={[styles.statLabel, { color: isDark ? '#a0a0b8' : '#6b7280' }]}>
                  Correct
                </Text>
              </View>
              <View style={[
                styles.statBox,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                }
              ]}>
                <Text style={[styles.statValue, { color: '#ef4444' }]}>
                  {totalQuestions - correctAnswers}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#a0a0b8' : '#6b7280' }]}>
                  Incorrect
                </Text>
              </View>
            </View>

            {/* Detailed Results */}
            {questions.length > 0 && (
              <View style={styles.detailsSection}>
                <Text style={[styles.detailsTitle, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
                  Question Details
                </Text>
                {Object.entries(groupedQuestions).map(([operation, ops]) => (
                  <View key={operation} style={styles.operationGroup}>
                    <Text style={[
                      styles.operationTitle,
                      { color: isDark ? '#cbd5e1' : '#4b5563' }
                    ]}>
                      {operation.charAt(0).toUpperCase() + operation.slice(1)} ({ops.length} questions)
                    </Text>
                    {ops.map((q, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.questionRow,
                          {
                            backgroundColor: q.isCorrect
                              ? (isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)')
                              : (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'),
                            borderColor: q.isCorrect
                              ? (isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)')
                              : (isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'),
                          }
                        ]}>
                        <Text style={[styles.questionText, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
                          {q.question}
                        </Text>
                        <View style={styles.answerRow}>
                          <Text style={[
                            styles.answerLabel,
                            { color: isDark ? '#a0a0b8' : '#6b7280' }
                          ]}>
                            Your Answer:
                          </Text>
                          <Text style={[
                            styles.answerValue,
                            { color: q.isCorrect ? '#10b981' : '#ef4444' }
                          ]}>
                            {q.userAnswer}
                          </Text>
                          {!q.isCorrect && (
                            <>
                              <Text style={[styles.answerLabel, { color: isDark ? '#a0a0b8' : '#6b7280' }]}>
                                Correct:
                              </Text>
                              <Text style={[styles.answerValue, { color: '#10b981' }]}>
                                {q.correctAnswer}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.playAgainButton,
                  {
                    backgroundColor: '#667eea',
                    ...Platform.select({
                      ios: {
                        shadowColor: '#667eea',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      },
                      android: {
                        elevation: 6,
                      },
                      web: {
                        boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.4)',
                      },
                    }),
                  }
                ]}
                onPress={onPlayAgain}
                activeOpacity={0.8}>
                <Text style={styles.buttonText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.closeButton,
                  {
                    backgroundColor: isDark ? '#2d2d44' : '#f3f4f6',
                    borderColor: isDark ? '#3d3d54' : '#e5e7eb',
                  }
                ]}
                onPress={onClose}
                activeOpacity={0.8}>
                <Text style={[
                  styles.buttonText,
                  { color: isDark ? '#ffffff' : '#1a1a2e' }
                ]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? 20 : 40,
  },
  container: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isMobile ? 24 : 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: isMobile ? 32 : 40,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: isMobile ? 16 : 18,
  },
  scoreCircleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreCircle: {
    width: isMobile ? 140 : 160,
    height: isMobile ? 140 : 160,
    borderRadius: isMobile ? 70 : 80,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scorePercentage: {
    fontSize: isMobile ? 42 : 48,
    fontWeight: '800',
  },
  scoreFraction: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: '600',
    marginTop: 4,
  },
  performanceText: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  statValue: {
    fontSize: isMobile ? 32 : 36,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsSection: {
    marginBottom: 32,
  },
  detailsTitle: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  operationGroup: {
    marginBottom: 20,
  },
  operationTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  questionRow: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  questionText: {
    fontSize: isMobile ? 15 : 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  answerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: isMobile ? 13 : 14,
    fontWeight: '500',
  },
  answerValue: {
    fontSize: isMobile ? 15 : 16,
    fontWeight: '700',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: isMobile ? 16 : 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  playAgainButton: {
    marginBottom: 8,
  },
  closeButton: {
    borderWidth: 1.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: isMobile ? 17 : 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

