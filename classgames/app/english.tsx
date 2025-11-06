import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Sidebar from '@/components/sidebar';
import EnglishGamesMenu from '@/components/EnglishGamesMenu';
import Scoreboard from '@/components/Scoreboard';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type GameMode = 'quiz' | 'word-match' | 'spelling-bee' | 'grammar-challenge' | 'vocabulary-builder';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isMobile = width < 768;

interface QuestionResult {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function EnglishGames() {
  const { theme, isDark } = useTheme();
  const colors = Colors[theme];
  const [activeMode, setActiveMode] = useState<GameMode>('quiz');
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [showScoreboard, setShowScoreboard] = useState(false);

  const questions = [
    {
      question: 'Fill in the blank: The cat is sitting ___ the mat.',
      options: ['on', 'in', 'at', 'by'],
      correct: 'on',
      type: 'multiple-choice',
    },
    {
      question: 'What is the opposite of "hot"?',
      options: ['warm', 'cold', 'cool', 'freeze'],
      correct: 'cold',
      type: 'multiple-choice',
    },
    {
      question: 'Choose the correct spelling:',
      options: ['beutiful', 'beautiful', 'beautifull', 'beutifull'],
      correct: 'beautiful',
      type: 'multiple-choice',
    },
    {
      question: 'What is a group of lions called?',
      options: ['herd', 'pack', 'pride', 'flock'],
      correct: 'pride',
      type: 'multiple-choice',
    },
    {
      question: 'Fill in the blank: I ___ to school every day.',
      options: ['go', 'goes', 'going', 'went'],
      correct: 'go',
      type: 'multiple-choice',
    },
  ];

  const handleAnswer = (answer: string) => {
    const currentQ = questions[currentQuestion];
    const isCorrect = answer.toLowerCase() === currentQ.correct.toLowerCase();
    
    setUserAnswer(answer);
    setShowResult(true);
    
    if (isCorrect) {
      setScore(score + 1);
    }

    const result: QuestionResult = {
      question: currentQ.question,
      userAnswer: answer,
      correctAnswer: currentQ.correct,
      isCorrect,
    };
    setQuestionResults(prev => [...prev, result]);
  };

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserAnswer('');
      setShowResult(false);
    } else {
      // Add final question result if not already added
      const currentQ = questions[currentQuestion];
      const finalIsCorrect = userAnswer.toLowerCase() === currentQ.correct.toLowerCase();
      const finalScore = score + (finalIsCorrect ? 1 : 0);
      
      // Check if last question result is already added
      if (questionResults.length < questions.length) {
        const result: QuestionResult = {
          question: currentQ.question,
          userAnswer: userAnswer || '',
          correctAnswer: currentQ.correct,
          isCorrect: finalIsCorrect,
        };
        setQuestionResults(prev => [...prev, result]);
      }
      
      setShowScoreboard(true);
    }
  };

  const handlePlayAgain = () => {
    setGameStarted(false);
              setCurrentQuestion(0);
              setScore(0);
              setUserAnswer('');
              setShowResult(false);
    setQuestionResults([]);
    setShowScoreboard(false);
  };

  const handleCloseScoreboard = () => {
    setShowScoreboard(false);
  };

  if (!gameStarted) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.layout}>
          <Sidebar />
          <View style={styles.mainContent}>
            <EnglishGamesMenu activeMode={activeMode} onModeChange={setActiveMode} />
            <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.startScreenContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.startScreenContainer}>
            <View style={[
              styles.startScreenCard,
              {
                backgroundColor: isDark ? '#1e1e2e' : '#ffffff',
                borderColor: isDark ? '#2d2d44' : '#e5e7eb',
              }
            ]}>
              <Text style={[styles.startScreenIcon, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
                📚
              </Text>
              <Text style={[styles.startScreenTitle, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
                English Games
              </Text>
              <Text style={[styles.startScreenDescription, { color: isDark ? '#a0a0b8' : '#6b7280' }]}>
                Test your English skills with fun quizzes!
              </Text>
              
              <View style={styles.gameRules}>
                <Text style={[styles.rulesTitle, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
                  Game Rules:
                </Text>
                <View style={styles.rulesList}>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleIcon}>📝</Text>
                    <Text style={[styles.ruleText, { color: isDark ? '#cbd5e1' : '#4b5563' }]}>
                      Answer multiple choice questions
                    </Text>
                  </View>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleIcon}>✅</Text>
                    <Text style={[styles.ruleText, { color: isDark ? '#cbd5e1' : '#4b5563' }]}>
                      Get instant feedback on your answers
                    </Text>
                  </View>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleIcon}>🎯</Text>
                    <Text style={[styles.ruleText, { color: isDark ? '#cbd5e1' : '#4b5563' }]}>
                      Answer correctly to score points!
                    </Text>
                  </View>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleIcon}>🔢</Text>
                    <Text style={[styles.ruleText, { color: isDark ? '#cbd5e1' : '#4b5563' }]}>
                      {questions.length} questions covering grammar and vocabulary
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.startButton,
                  {
                    backgroundColor: '#f5576c',
                    ...Platform.select({
                      ios: {
                        shadowColor: '#f5576c',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      },
                      android: {
                        elevation: 6,
                      },
                      web: {
                        boxShadow: '0 4px 14px 0 rgba(245, 87, 108, 0.4)',
                      },
                    }),
                  }
                ]}
                onPress={handleStartGame}
                activeOpacity={0.8}>
                <Text style={styles.startButtonText}>Start Game 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
          </View>
        </View>
      </ThemedView>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.layout}>
        <Sidebar />
        <View style={styles.mainContent}>
          <EnglishGamesMenu activeMode={activeMode} onModeChange={setActiveMode} />
          <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.gameContainer}>
          <View style={styles.headerSection}>
            <Text style={[
              styles.gameTitle,
              { color: isDark ? '#ffffff' : '#1a1a2e' }
            ]}>
              📚 English Games
            </Text>
            <Text style={[
              styles.gameSubtitle,
              { color: isDark ? '#a0a0b8' : '#6b7280' }
            ]}>
              Improve your English skills!
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={[
              styles.statCard,
              {
                backgroundColor: isDark 
                  ? 'rgba(245, 87, 108, 0.15)' 
                  : 'rgba(245, 87, 108, 0.08)',
                borderColor: isDark 
                  ? 'rgba(245, 87, 108, 0.3)' 
                  : 'rgba(245, 87, 108, 0.2)',
              }
            ]}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={[
                styles.statValue,
                { color: isDark ? '#f5576c' : '#f5576c' }
              ]}>
                {score}/{questions.length}
              </Text>
            </View>
            <View style={[
              styles.statCard,
              {
                backgroundColor: isDark 
                  ? 'rgba(102, 126, 234, 0.15)' 
                  : 'rgba(102, 126, 234, 0.08)',
                borderColor: isDark 
                  ? 'rgba(102, 126, 234, 0.3)' 
                  : 'rgba(102, 126, 234, 0.2)',
              }
            ]}>
              <Text style={styles.statLabel}>Question</Text>
              <Text style={[
                styles.statValue,
                { color: isDark ? '#667eea' : '#667eea' }
              ]}>
                {currentQuestion + 1}/{questions.length}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[
              styles.progressBarBg,
              { backgroundColor: isDark ? '#2d2d44' : '#e5e7eb' }
            ]}>
              <View style={[
                styles.progressBarFill,
                { width: `${progress}%`, backgroundColor: '#f5576c' }
              ]} />
            </View>
          </View>

          <View style={[
            styles.questionCard,
            {
              backgroundColor: isDark ? '#1e1e2e' : '#ffffff',
              borderColor: isDark ? '#2d2d44' : '#e5e7eb',
            }
          ]}>
            <View style={styles.questionHeader}>
              <Text style={[
                styles.questionNumberBadge,
                { backgroundColor: 'rgba(245, 87, 108, 0.1)', color: '#f5576c' }
              ]}>
                Q{currentQuestion + 1}
              </Text>
            </View>
            
            <Text style={[
              styles.question,
              { color: isDark ? '#ffffff' : '#1a1a2e' }
            ]}>
              {currentQ.question}
            </Text>

            <View style={styles.optionsContainer}>
              {currentQ.options.map((option, index) => {
                const isSelected = userAnswer === option;
                const isCorrect = option === currentQ.correct;
                let buttonStyle: any[] = [styles.optionButton];
                let textStyle = { color: colors.text };

                if (showResult) {
                  if (isCorrect) {
                    buttonStyle.push({
                      backgroundColor: '#10b981',
                      borderColor: '#10b981',
                    });
                    textStyle = { color: '#ffffff' };
                  } else if (isSelected && !isCorrect) {
                    buttonStyle.push({
                      backgroundColor: '#ef4444',
                      borderColor: '#ef4444',
                    });
                    textStyle = { color: '#ffffff' };
                  } else {
                    buttonStyle.push({
                    backgroundColor: isDark ? '#2d2d44' : '#f3f4f6',
                    borderColor: isDark ? '#3d3d54' : '#e5e7eb',
                    });
                  }
                } else {
                  if (isSelected) {
                    buttonStyle.push({
                      backgroundColor: '#f5576c',
                      borderColor: '#f5576c',
                    });
                    textStyle = { color: '#ffffff' };
                  } else {
                    buttonStyle.push({
                    backgroundColor: isDark ? '#2d2d44' : '#ffffff',
                    borderColor: isDark ? '#3d3d54' : '#e5e7eb',
                    });
                  }
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={buttonStyle}
                    onPress={() => !showResult && handleAnswer(option)}
                    disabled={showResult}
                    activeOpacity={0.7}>
                    <View style={styles.optionContent}>
                      <View style={[
                        styles.optionIndicator,
                        {
                          backgroundColor: isSelected && !showResult
                            ? '#ffffff'
                            : showResult && isCorrect
                            ? '#ffffff'
                            : 'transparent',
                        }
                      ]}>
                        {isSelected && !showResult && (
                          <Text style={{ color: '#f5576c', fontSize: 16, fontWeight: 'bold' }}>✓</Text>
                        )}
                        {showResult && isCorrect && (
                          <Text style={{ color: '#10b981', fontSize: 16, fontWeight: 'bold' }}>✓</Text>
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold' }}>✗</Text>
                        )}
                      </View>
                      <Text style={[
                        styles.optionText,
                        textStyle,
                        { fontWeight: isSelected ? '600' : '500' }
                      ]}>
                        {option}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {showResult && (
              <View style={styles.resultContainer}>
                <View style={[
                  styles.resultBanner,
                  {
                    backgroundColor: userAnswer.toLowerCase() === currentQ.correct.toLowerCase()
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                    borderColor: userAnswer.toLowerCase() === currentQ.correct.toLowerCase()
                      ? '#10b981'
                      : '#ef4444',
                  }
                ]}>
                  <Text style={[
                    styles.resultText,
                    {
                      color: userAnswer.toLowerCase() === currentQ.correct.toLowerCase() ? '#10b981' : '#ef4444',
                    }
                  ]}>
                    {userAnswer.toLowerCase() === currentQ.correct.toLowerCase()
                      ? '✓ Correct!'
                      : `✗ Wrong! Correct answer: ${currentQ.correct}`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    {
                      backgroundColor: '#f5576c',
                      ...Platform.select({
                        ios: {
                          shadowColor: '#f5576c',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                        },
                        android: {
                          elevation: 6,
                        },
                        web: {
                          boxShadow: '0 4px 14px 0 rgba(245, 87, 108, 0.4)',
                        },
                      }),
                    }
                  ]}
                  onPress={handleNext}
                  activeOpacity={0.8}>
                  <Text style={styles.nextButtonText}>
                    {currentQuestion < questions.length - 1 ? 'Next Question →' : 'Finish Game'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
        </View>
      </View>

      <Scoreboard
        visible={showScoreboard}
        totalQuestions={questions.length}
        correctAnswers={questionResults.filter(r => r.isCorrect).length}
        onClose={handleCloseScoreboard}
        onPlayAgain={handlePlayAgain}
        questions={questionResults}
      />
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
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  headerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: isMobile ? 36 : 48,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  gameSubtitle: {
    fontSize: isMobile ? 16 : 18,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  progressBarContainer: {
    marginBottom: 24,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionCard: {
    padding: isMobile ? 24 : 32,
    borderRadius: 24,
    borderWidth: 2,
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
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  questionHeader: {
    marginBottom: 20,
  },
  questionNumberBadge: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  question: {
    fontSize: isMobile ? 24 : 30,
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: isMobile ? 34 : 42,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    padding: isMobile ? 18 : 20,
    borderRadius: 16,
    borderWidth: 2,
    minHeight: 60,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'currentColor',
  },
  optionText: {
    fontSize: isMobile ? 18 : 20,
    flex: 1,
  },
  resultContainer: {
    marginTop: 24,
    gap: 16,
  },
  resultBanner: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  resultText: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  nextButton: {
    padding: isMobile ? 16 : 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: isMobile ? 17 : 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  startScreenContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: isMobile ? 20 : 32,
  },
  startScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startScreenCard: {
    width: '100%',
    maxWidth: 500,
    padding: isMobile ? 32 : 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 2,
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
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  startScreenIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  startScreenTitle: {
    fontSize: isMobile ? 36 : 48,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  startScreenDescription: {
    fontSize: isMobile ? 18 : 20,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: isMobile ? 26 : 28,
  },
  gameRules: {
    width: '100%',
    marginBottom: 32,
  },
  rulesTitle: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  rulesList: {
    gap: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ruleIcon: {
    fontSize: 24,
  },
  ruleText: {
    fontSize: isMobile ? 15 : 16,
    lineHeight: isMobile ? 22 : 24,
    flex: 1,
  },
  startButton: {
    width: '100%',
    padding: isMobile ? 18 : 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: isMobile ? 20 : 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
