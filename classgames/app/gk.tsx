import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Sidebar from '@/components/sidebar';
import Scoreboard from '@/components/Scoreboard';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type GameMode = 'quiz' | 'world-trivia' | 'science-quiz' | 'history-challenge' | 'nature-explorer';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isMobile = width < 768;

interface QuestionResult {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

// Shuffle array function
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const allQuestions = [
    {
      question: 'What is the capital city of India?',
      options: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'],
      correct: 'Delhi',
    },
    {
      question: 'How many days are there in a week?',
      options: ['5', '6', '7', '8'],
      correct: '7',
    },
    {
      question: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correct: 'Mars',
    },
    {
      question: 'What do bees make?',
      options: ['Milk', 'Honey', 'Butter', 'Cheese'],
      correct: 'Honey',
    },
    {
      question: 'Which is the largest ocean in the world?',
      options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
      correct: 'Pacific Ocean',
    },
    {
      question: 'How many continents are there in the world?',
      options: ['5', '6', '7', '8'],
      correct: '7',
    },
    {
      question: 'Which animal is known as the King of the Jungle?',
      options: ['Tiger', 'Lion', 'Elephant', 'Bear'],
      correct: 'Lion',
    },
    {
      question: 'What is the color of the sun?',
      options: ['Yellow', 'Red', 'White', 'Orange'],
      correct: 'White',
    },
  {
    question: 'Which is the largest planet in our solar system?',
    options: ['Earth', 'Jupiter', 'Saturn', 'Neptune'],
    correct: 'Jupiter',
  },
  {
    question: 'How many bones are there in an adult human body?',
    options: ['196', '206', '216', '226'],
    correct: '206',
  },
  {
    question: 'What is the smallest country in the world?',
    options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
    correct: 'Vatican City',
  },
  {
    question: 'Which gas do plants absorb from the atmosphere?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
    correct: 'Carbon Dioxide',
  },
  {
    question: 'What is the longest river in the world?',
    options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'],
    correct: 'Nile',
  },
  {
    question: 'Which is the tallest mountain in the world?',
    options: ['K2', 'Mount Everest', 'Kangchenjunga', 'Lhotse'],
    correct: 'Mount Everest',
  },
  {
    question: 'How many hours are there in a day?',
    options: ['20', '22', '24', '26'],
    correct: '24',
  },
  {
    question: 'Which is the largest desert in the world?',
    options: ['Gobi Desert', 'Sahara Desert', 'Arabian Desert', 'Kalahari Desert'],
    correct: 'Sahara Desert',
  },
  {
    question: 'What is the chemical symbol for water?',
    options: ['H2O', 'CO2', 'O2', 'NaCl'],
    correct: 'H2O',
  },
  {
    question: 'Which bird is known for its ability to mimic human speech?',
    options: ['Crow', 'Parrot', 'Owl', 'Eagle'],
    correct: 'Parrot',
  },
  {
    question: 'How many sides does a triangle have?',
    options: ['2', '3', '4', '5'],
    correct: '3',
  },
  {
    question: 'Which is the fastest land animal?',
    options: ['Lion', 'Cheetah', 'Tiger', 'Leopard'],
    correct: 'Cheetah',
  },
  {
    question: 'What is the capital city of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correct: 'Paris',
  },
  {
    question: 'Which fruit is known as the "King of Fruits"?',
    options: ['Apple', 'Mango', 'Banana', 'Orange'],
    correct: 'Mango',
  },
  {
    question: 'How many legs does a spider have?',
    options: ['6', '8', '10', '12'],
    correct: '8',
  },
  {
    question: 'Which is the smallest planet in our solar system?',
    options: ['Mercury', 'Venus', 'Mars', 'Pluto'],
    correct: 'Mercury',
  },
  {
    question: 'What is the largest mammal in the world?',
    options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
    correct: 'Blue Whale',
  },
  {
    question: 'Which is the national animal of India?',
    options: ['Lion', 'Tiger', 'Elephant', 'Peacock'],
    correct: 'Tiger',
  },
  {
    question: 'How many minutes are there in an hour?',
    options: ['50', '60', '70', '80'],
    correct: '60',
  },
  {
    question: 'Which is the largest continent?',
    options: ['Africa', 'Asia', 'North America', 'Europe'],
    correct: 'Asia',
  },
  {
    question: 'What do we call a baby cat?',
    options: ['Puppy', 'Kitten', 'Cub', 'Calf'],
    correct: 'Kitten',
  },
  {
    question: 'Which is the hardest natural substance on Earth?',
    options: ['Gold', 'Iron', 'Diamond', 'Platinum'],
    correct: 'Diamond',
  },
  {
    question: 'How many wheels does a bicycle have?',
    options: ['1', '2', '3', '4'],
    correct: '2',
  },
  {
    question: 'Which is the largest country in the world by area?',
    options: ['China', 'Canada', 'Russia', 'United States'],
    correct: 'Russia',
  },
  {
    question: 'What is the capital city of Japan?',
    options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'],
    correct: 'Tokyo',
  },
  {
    question: 'Which season comes after winter?',
    options: ['Summer', 'Spring', 'Autumn', 'Monsoon'],
    correct: 'Spring',
  },
  {
    question: 'How many eyes does a human have?',
    options: ['1', '2', '3', '4'],
    correct: '2',
  },
  {
    question: 'Which is the national bird of India?',
    options: ['Eagle', 'Peacock', 'Parrot', 'Sparrow'],
    correct: 'Peacock',
  },
  {
    question: 'What is the main source of energy for Earth?',
    options: ['Moon', 'Stars', 'Sun', 'Wind'],
    correct: 'Sun',
  },
  {
    question: 'Which is the largest fish in the ocean?',
    options: ['Shark', 'Whale Shark', 'Blue Whale', 'Dolphin'],
    correct: 'Whale Shark',
  },
  {
    question: 'How many months are there in a year?',
    options: ['10', '11', '12', '13'],
    correct: '12',
  },
  {
    question: 'Which is the smallest state in India?',
    options: ['Goa', 'Sikkim', 'Manipur', 'Tripura'],
    correct: 'Goa',
  },
  {
    question: 'What is the capital city of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    correct: 'Canberra',
  },
  {
    question: 'Which animal is known as the "Ship of the Desert"?',
    options: ['Horse', 'Camel', 'Elephant', 'Donkey'],
    correct: 'Camel',
  },
  {
    question: 'How many planets are there in our solar system?',
    options: ['7', '8', '9', '10'],
    correct: '8',
  },
  {
    question: 'Which is the longest day of the year?',
    options: ['Summer Solstice', 'Winter Solstice', 'Spring Equinox', 'Autumn Equinox'],
    correct: 'Summer Solstice',
  },
  {
    question: 'What is the capital city of Brazil?',
    options: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Buenos Aires'],
    correct: 'Brasília',
  },
  {
    question: 'Which is the largest organ in the human body?',
    options: ['Liver', 'Lungs', 'Skin', 'Heart'],
    correct: 'Skin',
  },
];

export default function GKGames() {
  const { theme, isDark } = useTheme();
  const colors = Colors[theme];
  const [activeMode, setActiveMode] = useState<GameMode>('quiz');
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [questions, setQuestions] = useState<typeof allQuestions>([]);

  const handleAnswer = (answer: string) => {
    const currentQ = questions[currentQuestion];
    const isCorrect = answer === currentQ.correct;
    
    setSelectedAnswer(answer);
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
    // Shuffle questions and select 20 random questions
    const shuffled = shuffleArray(allQuestions);
    const selectedQuestions = shuffled.slice(0, 20);
    setQuestions(selectedQuestions);
    setGameStarted(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Add final question result if not already added
      const currentQ = questions[currentQuestion];
      const finalIsCorrect = selectedAnswer === currentQ.correct;
      
      // Check if last question result is already added
      if (questionResults.length < questions.length) {
        const result: QuestionResult = {
          question: currentQ.question,
          userAnswer: selectedAnswer || '',
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
              setSelectedAnswer(null);
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
                🌍
              </Text>
              <Text style={[styles.startScreenTitle, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
                GK Games
              </Text>
              <Text style={[styles.startScreenDescription, { color: isDark ? '#a0a0b8' : '#6b7280' }]}>
                Test your general knowledge with random questions!
              </Text>
              
              <View style={styles.gameRules}>
                <Text style={[styles.rulesTitle, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
                  Game Rules:
                </Text>
                <View style={styles.rulesList}>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleIcon}>🌍</Text>
                    <Text style={[styles.ruleText, { color: isDark ? '#cbd5e1' : '#4b5563' }]}>
                      Answer questions about the world around you
                    </Text>
                  </View>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleIcon}>🎲</Text>
                    <Text style={[styles.ruleText, { color: isDark ? '#cbd5e1' : '#4b5563' }]}>
                      Questions are randomly selected each game
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
                      20 random questions covering various topics
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.startButton,
                  {
                    backgroundColor: '#4facfe',
                    ...Platform.select({
                      ios: {
                        shadowColor: '#4facfe',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      },
                      android: {
                        elevation: 6,
                      },
                      web: {
                        boxShadow: '0 4px 14px 0 rgba(79, 172, 254, 0.4)',
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

  if (questions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.layout}>
          <Sidebar />
          <View style={styles.mainContent}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
            Loading questions... 🌍
          </Text>
        </View>
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
              🌍 GK Games
            </Text>
            <Text style={[
              styles.gameSubtitle,
              { color: isDark ? '#a0a0b8' : '#6b7280' }
            ]}>
              Test your general knowledge!
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={[
              styles.statCard,
              {
                backgroundColor: isDark 
                  ? 'rgba(79, 172, 254, 0.15)' 
                  : 'rgba(79, 172, 254, 0.08)',
                borderColor: isDark 
                  ? 'rgba(79, 172, 254, 0.3)' 
                  : 'rgba(79, 172, 254, 0.2)',
              }
            ]}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={[
                styles.statValue,
                { color: isDark ? '#4facfe' : '#4facfe' }
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
                { width: `${progress}%`, backgroundColor: '#4facfe' }
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
                { backgroundColor: 'rgba(79, 172, 254, 0.1)', color: '#4facfe' }
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
                const isSelected = selectedAnswer === option;
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
                      backgroundColor: '#4facfe',
                      borderColor: '#4facfe',
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
                          <Text style={{ color: '#4facfe', fontSize: 16, fontWeight: 'bold' }}>✓</Text>
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
                      ? '✓ Correct!'
                      : `✗ Wrong! Correct answer: ${currentQ.correct}`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    {
                      backgroundColor: '#4facfe',
                      ...Platform.select({
                        ios: {
                          shadowColor: '#4facfe',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                        },
                        android: {
                          elevation: 6,
                        },
                        web: {
                          boxShadow: '0 4px 14px 0 rgba(79, 172, 254, 0.4)',
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
