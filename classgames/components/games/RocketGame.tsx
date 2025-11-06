import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions, Animated } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Scoreboard from '@/components/Scoreboard';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { generateMathQuestions, MathQuestion } from '@/utils/questionGenerator';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isMobile = width < 768;

interface QuestionResult {
  question: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  operation: string;
}

const ANSWER_TIME = 20; // seconds to answer
const SOLUTION_TIME = 15; // seconds to show solution

export default function RocketGame() {
  const { theme, isDark } = useTheme();
  const colors = Colors[theme];
  const [questions, setQuestions] = useState<MathQuestion[]>([]);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [rocketAnimations] = useState(() => 
    Array(4).fill(0).map(() => ({
      translateY: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    }))
  );
  const [launchedRockets, setLaunchedRockets] = useState<number[]>([]);
  const [celebrateAnimation] = useState(new Animated.Value(0));
  const [rocketPosition] = useState(new Animated.Value(0));
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME);
  const [solutionTimeLeft, setSolutionTimeLeft] = useState(SOLUTION_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const solutionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progressAnimation] = useState(new Animated.Value(1));

  const handleStartGame = () => {
    const newQuestions = generateMathQuestions();
    setQuestions(newQuestions);
    setGameStarted(true);
  };

  // Timer effect for answering
  useEffect(() => {
    if (questions.length === 0 || showResult) return;

    setTimeLeft(ANSWER_TIME);
    progressAnimation.setValue(1);

    Animated.timing(progressAnimation, {
      toValue: 0,
      duration: ANSWER_TIME * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestion, questions.length, showResult]);

  // Timer effect for showing solution
  useEffect(() => {
    if (!showResult) {
      setSolutionTimeLeft(SOLUTION_TIME);
      return;
    }

    setSolutionTimeLeft(SOLUTION_TIME);
    solutionTimerRef.current = setInterval(() => {
      setSolutionTimeLeft((prev) => {
        if (prev <= 1) {
          if (solutionTimerRef.current) {
            clearInterval(solutionTimerRef.current);
          }
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (solutionTimerRef.current) {
        clearInterval(solutionTimerRef.current);
      }
    };
  }, [showResult]);

  const handleAutoSubmit = () => {
    if (questions.length === 0 || showResult) return;
    
    const currentQ = questions[currentQuestion];
    const answer = selectedAnswer ?? currentQ.options[0];
    const isCorrect = answer === currentQ.correct;
    const answerIndex = currentQ.options.indexOf(answer);
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    if (isCorrect && selectedAnswer !== null) {
      setScore(score + 1);
      launchRocket(answerIndex);
      celebrate();
      setLaunchedRockets([...launchedRockets, answerIndex]);
    }

    const result: QuestionResult = {
      question: currentQ.question,
      userAnswer: answer,
      correctAnswer: currentQ.correct,
      isCorrect,
      operation: currentQ.operation,
    };
    setQuestionResults([...questionResults, result]);
  };

  const launchRocket = (index: number) => {
    const rocketAnim = rocketAnimations[index];
    
    Animated.parallel([
      Animated.sequence([
        Animated.timing(rocketAnim.scale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rocketAnim.scale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rocketAnim.translateY, {
        toValue: -300,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(rocketAnim.opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const celebrate = () => {
    Animated.sequence([
      Animated.timing(celebrateAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(celebrateAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAnswer = (answer: number, index: number) => {
    if (questions.length === 0 || showResult) return;
    
    // Clear answer timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const currentQ = questions[currentQuestion];
    const isCorrect = answer === currentQ.correct;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    if (isCorrect) {
      setScore(score + 1);
      launchRocket(index);
      celebrate();
      setLaunchedRockets([...launchedRockets, index]);
    }

    const result: QuestionResult = {
      question: currentQ.question,
      userAnswer: answer,
      correctAnswer: currentQ.correct,
      isCorrect,
      operation: currentQ.operation,
    };
    setQuestionResults([...questionResults, result]);
  };

  const handleNext = () => {
    // Clear all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (solutionTimerRef.current) {
      clearInterval(solutionTimerRef.current);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setLaunchedRockets([]);
      setTimeLeft(ANSWER_TIME);
      setSolutionTimeLeft(SOLUTION_TIME);
      rocketAnimations.forEach(anim => {
        anim.translateY.setValue(0);
        anim.scale.setValue(1);
        anim.opacity.setValue(1);
      });
    } else {
      setShowScoreboard(true);
    }
  };

  const handlePlayAgain = () => {
    // Clear all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (solutionTimerRef.current) {
      clearInterval(solutionTimerRef.current);
    }

    setGameStarted(false);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuestionResults([]);
    setShowScoreboard(false);
    setLaunchedRockets([]);
    setTimeLeft(ANSWER_TIME);
    setSolutionTimeLeft(SOLUTION_TIME);
    setQuestions([]);
    rocketAnimations.forEach(anim => {
      anim.translateY.setValue(0);
      anim.scale.setValue(1);
      anim.opacity.setValue(1);
    });
  };

  const handleCloseScoreboard = () => {
    setShowScoreboard(false);
  };

  if (!gameStarted) {
    return (
      <ThemedView style={styles.container}>
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
                🚀
              </Text>
              <Text style={[styles.startScreenTitle, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
                Rocket Launch Game
              </Text>
              <Text style={[styles.startScreenDescription, { color: isDark ? '#a0a0b8' : '#6b7280' }]}>
                Launch rockets by answering correctly!
              </Text>
              
              <View style={styles.gameRules}>
                <Text style={[styles.rulesTitle, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
                  Game Rules:
                </Text>
                <View style={styles.rulesList}>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleIcon}>🚀</Text>
                    <Text style={[styles.ruleText, { color: isDark ? '#cbd5e1' : '#4b5563' }]}>
                      Select correct answer to launch rocket
                    </Text>
                  </View>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleIcon}>⏱️</Text>
                    <Text style={[styles.ruleText, { color: isDark ? '#cbd5e1' : '#4b5563' }]}>
                      You have 20 seconds per question
                    </Text>
                  </View>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleIcon}>✨</Text>
                    <Text style={[styles.ruleText, { color: isDark ? '#cbd5e1' : '#4b5563' }]}>
                      Watch rockets fly when you answer correctly!
                    </Text>
                  </View>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleIcon}>🎯</Text>
                    <Text style={[styles.ruleText, { color: isDark ? '#cbd5e1' : '#4b5563' }]}>
                      Score points with correct answers
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.startButton,
                  {
                    backgroundColor: '#ff9f40',
                    ...Platform.select({
                      ios: {
                        shadowColor: '#ff9f40',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      },
                      android: {
                        elevation: 6,
                      },
                      web: {
                        boxShadow: '0 4px 14px 0 rgba(255, 159, 64, 0.4)',
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
      </ThemedView>
    );
  }

  if (questions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
            Preparing rockets... 🚀
          </Text>
        </View>
      </ThemedView>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const finalScore = score + (selectedAnswer === currentQ.correct ? 1 : 0);

  const scaleInterpolate = celebrateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.gameContainer}>
          <View style={styles.headerSection}>
            <Text style={[styles.gameTitle, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
              🚀 Rocket Launch Game
            </Text>
            <Text style={[styles.gameSubtitle, { color: isDark ? '#a0a0b8' : '#6b7280' }]}>
              Launch rockets by answering correctly!
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={[
              styles.statCard,
              {
                backgroundColor: isDark 
                  ? 'rgba(255, 159, 64, 0.15)' 
                  : 'rgba(255, 159, 64, 0.08)',
                borderColor: isDark 
                  ? 'rgba(255, 159, 64, 0.3)' 
                  : 'rgba(255, 159, 64, 0.2)',
              }
            ]}>
              <Text style={styles.statLabel}>Score</Text>
              <Animated.View style={{ transform: [{ scale: scaleInterpolate }] }}>
                <Text style={[styles.statValue, { color: '#ff9f40' }]}>
                  {score}/{questions.length}
                </Text>
              </Animated.View>
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
              <Text style={[styles.statValue, { color: '#667eea' }]}>
                {currentQuestion + 1}/{questions.length}
              </Text>
            </View>
          </View>

          {/* Timer Display */}
          {!showResult && (
            <View style={styles.timerContainer}>
              <View style={[
                styles.timerBox,
                {
                  backgroundColor: isDark 
                    ? 'rgba(255, 159, 64, 0.15)' 
                    : 'rgba(255, 159, 64, 0.08)',
                  borderColor: timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#ff9f40',
                }
              ]}>
                <Text style={styles.timerLabel}>⏱️ Time Left</Text>
                <Text style={[
                  styles.timerValue,
                  { color: timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#ff9f40' }
                ]}>
                  {timeLeft}s
                </Text>
              </View>
              <View style={styles.timerProgressContainer}>
                <View style={[
                  styles.timerProgressBg,
                  { backgroundColor: isDark ? '#2d2d44' : '#e5e7eb' }
                ]}>
                  <Animated.View style={[
                    styles.timerProgressFill,
                    {
                      width: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#ff9f40',
                    }
                  ]} />
                </View>
              </View>
            </View>
          )}

          {/* Solution Timer Display */}
          {showResult && (
            <View style={styles.timerContainer}>
              <View style={[
                styles.timerBox,
                {
                  backgroundColor: isDark 
                    ? 'rgba(16, 185, 129, 0.15)' 
                    : 'rgba(16, 185, 129, 0.08)',
                  borderColor: '#10b981',
                }
              ]}>
                <Text style={styles.timerLabel}>📖 Solution</Text>
                <Text style={[styles.timerValue, { color: '#10b981' }]}>
                  {solutionTimeLeft}s
                </Text>
              </View>
            </View>
          )}

          <View style={styles.progressBarContainer}>
            <View style={[
              styles.progressBarBg,
              { backgroundColor: isDark ? '#2d2d44' : '#e5e7eb' }
            ]}>
              <View style={[
                styles.progressBarFill,
                { width: `${progress}%`, backgroundColor: '#ff9f40' }
              ]} />
            </View>
          </View>

          {/* Rockets Display */}
          <View style={styles.rocketsContainer}>
            {currentQ.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQ.correct;
              const isLaunched = launchedRockets.includes(index);
              const rocketAnim = rocketAnimations[index];
              
              const rocketColors = ['#ff9f40', '#4ecdc4', '#ff6b6b', '#a8e6cf'];
              const rocketColor = rocketColors[index % rocketColors.length];

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.rocketWrapper,
                    {
                      opacity: rocketAnim.opacity,
                      transform: [
                        { translateY: rocketAnim.translateY },
                        { scale: rocketAnim.scale },
                      ],
                    }
                  ]}>
                  <TouchableOpacity
                    style={[
                      styles.rocketButton,
                      {
                        backgroundColor: isDark ? '#2d2d44' : '#ffffff',
                        borderColor: isSelected ? rocketColor : (isDark ? '#3d3d54' : '#e5e7eb'),
                        borderWidth: isSelected ? 3 : 2,
                      }
                    ]}
                    onPress={() => !showResult && handleAnswer(option, index)}
                    disabled={showResult || isLaunched}
                    activeOpacity={0.8}>
                    <View style={[styles.rocket, { backgroundColor: rocketColor }]}>
                      <Text style={styles.rocketNumber}>{option}</Text>
                      {isSelected && !showResult && (
                        <Text style={styles.rocketCheck}>✓</Text>
                      )}
                      {showResult && isCorrect && (
                        <Text style={styles.rocketCheck}>✓</Text>
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <Text style={styles.rocketCross}>✗</Text>
                      )}
                    </View>
                    {!isLaunched && (
                      <>
                        <View style={[styles.rocketFlame, { backgroundColor: rocketColor }]} />
                        <View style={[styles.rocketBase, { backgroundColor: rocketColor }]} />
                      </>
                    )}
                    {isLaunched && (
                      <View style={styles.launchTrail}>
                        <Text style={styles.trailText}>✨</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
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
                { backgroundColor: 'rgba(255, 159, 64, 0.1)', color: '#ff9f40' }
              ]}>
                Q{currentQuestion + 1}
              </Text>
              <Text style={[
                styles.operationBadge,
                {
                  backgroundColor: isDark 
                    ? 'rgba(102, 126, 234, 0.2)' 
                    : 'rgba(102, 126, 234, 0.1)',
                  color: '#667eea',
                }
              ]}>
                {currentQ.operation.charAt(0).toUpperCase() + currentQ.operation.slice(1)}
              </Text>
            </View>
            
            <Text style={[
              styles.question,
              { color: isDark ? '#ffffff' : '#1a1a2e' }
            ]}>
              {currentQ.question}
            </Text>

            {showResult && (
              <View style={styles.resultContainer}>
                <View style={[
                  styles.resultBanner,
                  {
                    backgroundColor: selectedAnswer === currentQ.correct
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                    borderColor: selectedAnswer === currentQ.correct
                      ? '#10b981'
                      : '#ef4444',
                  }
                ]}>
                  <Text style={[
                    styles.resultText,
                    {
                      color: selectedAnswer === currentQ.correct ? '#10b981' : '#ef4444',
                    }
                  ]}>
                    {selectedAnswer === currentQ.correct
                      ? '🚀 Rocket Launched! Great Job!'
                      : `😔 Wrong!`}
                  </Text>
                  <View style={styles.solutionBox}>
                    <Text style={[
                      styles.solutionLabel,
                      { color: isDark ? '#a0a0b8' : '#6b7280' }
                    ]}>
                      Solution:
                    </Text>
                    <Text style={[
                      styles.solutionText,
                      { color: isDark ? '#ffffff' : '#1a1a2e' }
                    ]}>
                      {(() => {
                        const q = currentQ.question;
                        if (currentQ.operation === 'addition') {
                          const nums = q.match(/\d+/g);
                          return nums && nums.length === 2 ? `${nums[0]} + ${nums[1]} = ${currentQ.correct}` : `Answer: ${currentQ.correct}`;
                        } else if (currentQ.operation === 'subtraction') {
                          const nums = q.match(/\d+/g);
                          return nums && nums.length === 2 ? `${nums[0]} - ${nums[1]} = ${currentQ.correct}` : `Answer: ${currentQ.correct}`;
                        } else if (currentQ.operation === 'multiplication') {
                          const nums = q.match(/\d+/g);
                          return nums && nums.length === 2 ? `${nums[0]} × ${nums[1]} = ${currentQ.correct}` : `Answer: ${currentQ.correct}`;
                        } else if (currentQ.operation === 'division') {
                          const nums = q.match(/\d+/g);
                          return nums && nums.length === 2 ? `${nums[0]} ÷ ${nums[1]} = ${currentQ.correct}` : `Answer: ${currentQ.correct}`;
                        }
                        return `Answer: ${currentQ.correct}`;
                      })()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    {
                      backgroundColor: '#ff9f40',
                      ...Platform.select({
                        ios: {
                          shadowColor: '#ff9f40',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                        },
                        android: {
                          elevation: 6,
                        },
                        web: {
                          boxShadow: '0 4px 14px 0 rgba(255, 159, 64, 0.4)',
                        },
                      }),
                    }
                  ]}
                  onPress={handleNext}
                  activeOpacity={0.8}>
                  <Text style={styles.nextButtonText}>
                    {currentQuestion < questions.length - 1 ? `Next Question (${solutionTimeLeft}s) →` : 'Finish Game'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Scoreboard
        visible={showScoreboard}
        totalQuestions={questions.length}
        correctAnswers={finalScore}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
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
  rocketsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 32,
    paddingVertical: 20,
    flexWrap: 'wrap',
    gap: 16,
    minHeight: 200,
  },
  rocketWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  rocketButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: isMobile ? 80 : 100,
  },
  rocket: {
    width: isMobile ? 50 : 60,
    height: isMobile ? 80 : 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  rocketNumber: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: '800',
    color: '#fff',
  },
  rocketCheck: {
    fontSize: 16,
    color: '#fff',
    position: 'absolute',
    top: 5,
    right: 5,
  },
  rocketCross: {
    fontSize: 16,
    color: '#fff',
    position: 'absolute',
    top: 5,
    right: 5,
  },
  rocketFlame: {
    width: isMobile ? 30 : 40,
    height: isMobile ? 20 : 25,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginTop: -5,
    opacity: 0.8,
  },
  rocketBase: {
    width: isMobile ? 40 : 50,
    height: isMobile ? 15 : 20,
    borderRadius: 8,
    marginTop: -8,
  },
  launchTrail: {
    marginTop: 10,
  },
  trailText: {
    fontSize: 20,
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
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  questionNumberBadge: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  operationBadge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  question: {
    fontSize: isMobile ? 26 : 32,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: isMobile ? 36 : 44,
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
    marginBottom: 12,
  },
  solutionBox: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: 8,
  },
  solutionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  solutionText: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  timerContainer: {
    marginBottom: 20,
    gap: 8,
  },
  timerBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  timerValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  timerProgressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerProgressBg: {
    height: '100%',
    borderRadius: 3,
  },
  timerProgressFill: {
    height: '100%',
    borderRadius: 3,
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

