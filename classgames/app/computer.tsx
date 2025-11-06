import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Sidebar from '@/components/sidebar';
import Scoreboard from '@/components/Scoreboard';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type GameMode = 'quiz' | 'typing-master' | 'code-challenge' | 'hardware-quiz' | 'internet-explorer';

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
  // Basic Computer Parts
  {
    question: 'What do we use to type on a computer?',
    options: ['Mouse', 'Keyboard', 'Monitor', 'Speaker'],
    correct: 'Keyboard',
  },
  {
    question: 'What shows pictures and words on a computer?',
    options: ['Keyboard', 'Mouse', 'Monitor', 'Printer'],
    correct: 'Monitor',
  },
  {
    question: 'What do we use to click on things on a computer?',
    options: ['Keyboard', 'Mouse', 'Monitor', 'Printer'],
    correct: 'Mouse',
  },
  {
    question: 'What prints papers from a computer?',
    options: ['Keyboard', 'Mouse', 'Monitor', 'Printer'],
    correct: 'Printer',
  },
  {
    question: 'What makes sound from a computer?',
    options: ['Keyboard', 'Mouse', 'Speaker', 'Monitor'],
    correct: 'Speaker',
  },
  {
    question: 'What is the brain of a computer called?',
    options: ['CPU', 'Mouse', 'Keyboard', 'Monitor'],
    correct: 'CPU',
  },
  {
    question: 'What do we use to save our work on a computer?',
    options: ['Hard Disk', 'Mouse', 'Keyboard', 'Monitor'],
    correct: 'Hard Disk',
  },
  {
    question: 'What do we plug into a computer to save files?',
    options: ['USB Drive', 'Mouse', 'Keyboard', 'Monitor'],
    correct: 'USB Drive',
  },
  {
    question: 'What connects a computer to the internet?',
    options: ['Mouse', 'Keyboard', 'Modem', 'Printer'],
    correct: 'Modem',
  },
  {
    question: 'What is the main part of a computer called?',
    options: ['CPU', 'Monitor', 'Keyboard', 'Mouse'],
    correct: 'CPU',
  },
  
  // Basic Computer Uses
  {
    question: 'What can we do on a computer?',
    options: ['Play games', 'Write stories', 'Watch videos', 'All of these'],
    correct: 'All of these',
  },
  {
    question: 'What do we use to write a letter on a computer?',
    options: ['Paint', 'Word', 'Calculator', 'Games'],
    correct: 'Word',
  },
  {
    question: 'What do we use to draw pictures on a computer?',
    options: ['Word', 'Paint', 'Calculator', 'Music'],
    correct: 'Paint',
  },
  {
    question: 'What do we use to do math on a computer?',
    options: ['Paint', 'Word', 'Calculator', 'Games'],
    correct: 'Calculator',
  },
  {
    question: 'What do we use to watch videos on a computer?',
    options: ['Paint', 'Word', 'Video Player', 'Calculator'],
    correct: 'Video Player',
  },
  {
    question: 'What do we use to listen to music on a computer?',
    options: ['Paint', 'Word', 'Music Player', 'Calculator'],
    correct: 'Music Player',
  },
  {
    question: 'What do we use to make presentations?',
    options: ['Word', 'PowerPoint', 'Paint', 'Calculator'],
    correct: 'PowerPoint',
  },
  {
    question: 'What do we use to make tables and charts?',
    options: ['Word', 'Excel', 'Paint', 'Games'],
    correct: 'Excel',
  },
  {
    question: 'What do we use to browse websites?',
    options: ['Paint', 'Word', 'Browser', 'Calculator'],
    correct: 'Browser',
  },
  {
    question: 'What do we use to send emails?',
    options: ['Paint', 'Email', 'Games', 'Calculator'],
    correct: 'Email',
  },
  
  // Internet Basics
  {
    question: 'What is the internet?',
    options: ['A computer', 'A network of computers', 'A game', 'A printer'],
    correct: 'A network of computers',
  },
  {
    question: 'What do we use to search for information?',
    options: ['Paint', 'Google', 'Calculator', 'Word'],
    correct: 'Google',
  },
  {
    question: 'What is a website?',
    options: ['A computer', 'A page on the internet', 'A game', 'A printer'],
    correct: 'A page on the internet',
  },
  {
    question: 'What do we use to watch videos online?',
    options: ['Paint', 'YouTube', 'Calculator', 'Word'],
    correct: 'YouTube',
  },
  {
    question: 'What is email used for?',
    options: ['Playing games', 'Sending messages', 'Drawing pictures', 'Doing math'],
    correct: 'Sending messages',
  },
  {
    question: 'What is Wi-Fi?',
    options: ['A computer', 'Wireless internet', 'A game', 'A printer'],
    correct: 'Wireless internet',
  },
  {
    question: 'What do we use to chat with friends online?',
    options: ['Paint', 'Chat apps', 'Calculator', 'Word'],
    correct: 'Chat apps',
  },
  {
    question: 'What is a password used for?',
    options: ['Playing games', 'Protecting our account', 'Drawing pictures', 'Doing math'],
    correct: 'Protecting our account',
  },
  {
    question: 'What should we never share online?',
    options: ['Our password', 'Our name', 'Our favorite color', 'Our favorite game'],
    correct: 'Our password',
  },
  {
    question: 'What is safe to share online?',
    options: ['Our password', 'Our address', 'Our favorite game', 'Our phone number'],
    correct: 'Our favorite game',
  },
  
  // File Types
  {
    question: 'What type of file is a picture?',
    options: ['.txt', '.jpg', '.exe', '.pdf'],
    correct: '.jpg',
  },
  {
    question: 'What type of file is a document?',
    options: ['.jpg', '.doc', '.mp3', '.mp4'],
    correct: '.doc',
  },
  {
    question: 'What type of file is a song?',
    options: ['.jpg', '.doc', '.mp3', '.txt'],
    correct: '.mp3',
  },
  {
    question: 'What type of file is a video?',
    options: ['.jpg', '.doc', '.mp3', '.mp4'],
    correct: '.mp4',
  },
  {
    question: 'What type of file is a text document?',
    options: ['.jpg', '.txt', '.mp3', '.mp4'],
    correct: '.txt',
  },
  {
    question: 'What type of file is a PDF document?',
    options: ['.jpg', '.doc', '.pdf', '.mp3'],
    correct: '.pdf',
  },
  {
    question: 'What do we use to open a picture file?',
    options: ['Word', 'Paint', 'Calculator', 'Games'],
    correct: 'Paint',
  },
  {
    question: 'What do we use to open a document file?',
    options: ['Paint', 'Word', 'Calculator', 'Games'],
    correct: 'Word',
  },
  {
    question: 'What do we use to play a video file?',
    options: ['Paint', 'Word', 'Video Player', 'Calculator'],
    correct: 'Video Player',
  },
  {
    question: 'What do we use to play a music file?',
    options: ['Paint', 'Word', 'Music Player', 'Calculator'],
    correct: 'Music Player',
  },
  
  // Computer Safety
  {
    question: 'What should we do if we see something bad online?',
    options: ['Tell an adult', 'Keep watching', 'Share it', 'Ignore it'],
    correct: 'Tell an adult',
  },
  {
    question: 'What should we do before closing a computer?',
    options: ['Save our work', 'Delete everything', 'Turn off immediately', 'Do nothing'],
    correct: 'Save our work',
  },
  {
    question: 'What should we do if a stranger wants to chat online?',
    options: ['Chat with them', 'Tell an adult', 'Share our address', 'Meet them'],
    correct: 'Tell an adult',
  },
  {
    question: 'How long should we use a computer?',
    options: ['All day', 'A few hours', 'Never take breaks', 'Without rest'],
    correct: 'A few hours',
  },
  {
    question: 'What should we do to protect our eyes?',
    options: ['Sit very close', 'Take breaks', 'Never blink', 'Use in dark'],
    correct: 'Take breaks',
  },
  {
    question: 'What should we do if the computer freezes?',
    options: ['Hit it', 'Tell an adult', 'Keep clicking', 'Shake it'],
    correct: 'Tell an adult',
  },
  {
    question: 'What should we do with our password?',
    options: ['Share with friends', 'Write it down', 'Keep it secret', 'Tell everyone'],
    correct: 'Keep it secret',
  },
  {
    question: 'What should we do before downloading something?',
    options: ['Download immediately', 'Ask an adult', 'Download everything', 'Never ask'],
    correct: 'Ask an adult',
  },
  {
    question: 'What is a virus on a computer?',
    options: ['A game', 'Bad software', 'A picture', 'A song'],
    correct: 'Bad software',
  },
  {
    question: 'What protects our computer from viruses?',
    options: ['Games', 'Antivirus', 'Paint', 'Word'],
    correct: 'Antivirus',
  },
  
  // Basic Computer Terms
  {
    question: 'What is a folder used for?',
    options: ['Playing games', 'Storing files', 'Drawing pictures', 'Doing math'],
    correct: 'Storing files',
  },
  {
    question: 'What is a file?',
    options: ['A computer', 'Saved information', 'A game', 'A printer'],
    correct: 'Saved information',
  },
  {
    question: 'What is a desktop?',
    options: ['A table', 'The main screen', 'A game', 'A printer'],
    correct: 'The main screen',
  },
  {
    question: 'What is an icon?',
    options: ['A computer', 'A small picture for a program', 'A game', 'A printer'],
    correct: 'A small picture for a program',
  },
  {
    question: 'What is a window on a computer?',
    options: ['Glass window', 'A program screen', 'A game', 'A printer'],
    correct: 'A program screen',
  },
  {
    question: 'What is a menu?',
    options: ['Food list', 'List of options', 'A game', 'A printer'],
    correct: 'List of options',
  },
  {
    question: 'What is a button on a computer?',
    options: ['A real button', 'Something to click', 'A game', 'A printer'],
    correct: 'Something to click',
  },
  {
    question: 'What is copy?',
    options: ['A game', 'Making a copy', 'Deleting', 'Moving'],
    correct: 'Making a copy',
  },
  {
    question: 'What is paste?',
    options: ['A game', 'Putting copied text', 'Deleting', 'Moving'],
    correct: 'Putting copied text',
  },
  {
    question: 'What is delete?',
    options: ['A game', 'Removing something', 'Copying', 'Moving'],
    correct: 'Removing something',
  },
  
  // Computer Games & Fun
  {
    question: 'What can we play on a computer?',
    options: ['Games', 'Food', 'Toys', 'Books'],
    correct: 'Games',
  },
  {
    question: 'What is a game on a computer?',
    options: ['A book', 'Fun activity', 'A printer', 'A keyboard'],
    correct: 'Fun activity',
  },
  {
    question: 'What do we use to control games?',
    options: ['Keyboard and Mouse', 'Food', 'Books', 'Toys'],
    correct: 'Keyboard and Mouse',
  },
  {
    question: 'What is animation?',
    options: ['A book', 'Moving pictures', 'A printer', 'A keyboard'],
    correct: 'Moving pictures',
  },
  {
    question: 'What is a cartoon on a computer?',
    options: ['A book', 'Animated video', 'A printer', 'A keyboard'],
    correct: 'Animated video',
  },
  {
    question: 'What can we create with a computer?',
    options: ['Food', 'Stories and pictures', 'Toys', 'Books'],
    correct: 'Stories and pictures',
  },
  {
    question: 'What is coding?',
    options: ['A game', 'Writing instructions for computer', 'A printer', 'A keyboard'],
    correct: 'Writing instructions for computer',
  },
  {
    question: 'What can we learn on a computer?',
    options: ['Many things', 'Nothing', 'Only games', 'Only videos'],
    correct: 'Many things',
  },
  {
    question: 'What is an app?',
    options: ['A computer', 'A program', 'A printer', 'A keyboard'],
    correct: 'A program',
  },
  {
    question: 'What is a tablet?',
    options: ['A medicine', 'A small computer', 'A printer', 'A keyboard'],
    correct: 'A small computer',
  },
  
  // Basic Computer Skills
  {
    question: 'What do we press to make letters BIG?',
    options: ['Shift key', 'Enter key', 'Space key', 'Delete key'],
    correct: 'Shift key',
  },
  {
    question: 'What do we press to go to a new line?',
    options: ['Shift key', 'Enter key', 'Space key', 'Delete key'],
    correct: 'Enter key',
  },
  {
    question: 'What do we press to make a space?',
    options: ['Shift key', 'Enter key', 'Space key', 'Delete key'],
    correct: 'Space key',
  },
  {
    question: 'What do we press to delete?',
    options: ['Shift key', 'Enter key', 'Space key', 'Delete key'],
    correct: 'Delete key',
  },
  {
    question: 'What do we click to close a window?',
    options: ['X button', 'Minimize button', 'Maximize button', 'Menu button'],
    correct: 'X button',
  },
  {
    question: 'What do we click to make a window smaller?',
    options: ['X button', 'Minimize button', 'Maximize button', 'Menu button'],
    correct: 'Minimize button',
  },
  {
    question: 'What do we click to make a window bigger?',
    options: ['X button', 'Minimize button', 'Maximize button', 'Menu button'],
    correct: 'Maximize button',
  },
  {
    question: 'What is double-click?',
    options: ['Click once', 'Click twice quickly', 'Click slowly', 'Never click'],
    correct: 'Click twice quickly',
  },
  {
    question: 'What is right-click?',
    options: ['Click left button', 'Click right button', 'Click both', 'Never click'],
    correct: 'Click right button',
  },
  {
    question: 'What is drag and drop?',
    options: ['A game', 'Moving something', 'Deleting', 'Copying'],
    correct: 'Moving something',
  },
  
  // Computer Parts - Simple
  {
    question: 'What is a laptop?',
    options: ['A big computer', 'A portable computer', 'A printer', 'A keyboard'],
    correct: 'A portable computer',
  },
  {
    question: 'What is a desktop computer?',
    options: ['A small computer', 'A computer that stays on a desk', 'A printer', 'A keyboard'],
    correct: 'A computer that stays on a desk',
  },
  {
    question: 'What is a tablet?',
    options: ['A big computer', 'A touchscreen computer', 'A printer', 'A keyboard'],
    correct: 'A touchscreen computer',
  },
  {
    question: 'What is a smartphone?',
    options: ['A big computer', 'A phone with computer features', 'A printer', 'A keyboard'],
    correct: 'A phone with computer features',
  },
  {
    question: 'What is a camera on a computer?',
    options: ['A printer', 'Takes pictures', 'A keyboard', 'A mouse'],
    correct: 'Takes pictures',
  },
  {
    question: 'What is a microphone?',
    options: ['A printer', 'Records sound', 'A keyboard', 'A mouse'],
    correct: 'Records sound',
  },
  {
    question: 'What is a scanner?',
    options: ['A printer', 'Copies pictures to computer', 'A keyboard', 'A mouse'],
    correct: 'Copies pictures to computer',
  },
  {
    question: 'What is a webcam?',
    options: ['A printer', 'Camera for video calls', 'A keyboard', 'A mouse'],
    correct: 'Camera for video calls',
  },
  {
    question: 'What is a headphone?',
    options: ['A printer', 'For listening to sound', 'A keyboard', 'A mouse'],
    correct: 'For listening to sound',
  },
  {
    question: 'What is a charger?',
    options: ['A printer', 'Powers the computer', 'A keyboard', 'A mouse'],
    correct: 'Powers the computer',
  },
  
  // Simple Computer Concepts
  {
    question: 'What is a program?',
    options: ['A computer', 'Instructions for computer', 'A printer', 'A keyboard'],
    correct: 'Instructions for computer',
  },
  {
    question: 'What is software?',
    options: ['A computer', 'Programs on a computer', 'A printer', 'A keyboard'],
    correct: 'Programs on a computer',
  },
  {
    question: 'What is hardware?',
    options: ['A program', 'Physical parts of computer', 'A printer', 'A keyboard'],
    correct: 'Physical parts of computer',
  },
  {
    question: 'What is save?',
    options: ['Deleting', 'Keeping our work', 'Moving', 'Copying'],
    correct: 'Keeping our work',
  },
  {
    question: 'What is open?',
    options: ['Closing', 'Starting a file', 'Deleting', 'Moving'],
    correct: 'Starting a file',
  },
  {
    question: 'What is close?',
    options: ['Opening', 'Ending a program', 'Deleting', 'Moving'],
    correct: 'Ending a program',
  },
  {
    question: 'What is undo?',
    options: ['Doing again', 'Taking back an action', 'Deleting', 'Moving'],
    correct: 'Taking back an action',
  },
  {
    question: 'What is redo?',
    options: ['Undoing', 'Doing again', 'Deleting', 'Moving'],
    correct: 'Doing again',
  },
  {
    question: 'What is cut?',
    options: ['Copying', 'Moving something', 'Deleting', 'Opening'],
    correct: 'Moving something',
  },
  {
    question: 'What is select?',
    options: ['Deleting', 'Choosing something', 'Moving', 'Copying'],
    correct: 'Choosing something',
  },
  
  // More Simple Questions
  {
    question: 'What is a cursor?',
    options: ['A printer', 'Moving arrow on screen', 'A keyboard', 'A mouse'],
    correct: 'Moving arrow on screen',
  },
  {
    question: 'What is a scroll?',
    options: ['A game', 'Moving up and down', 'Deleting', 'Copying'],
    correct: 'Moving up and down',
  },
  {
    question: 'What is zoom?',
    options: ['A game', 'Making bigger or smaller', 'Deleting', 'Copying'],
    correct: 'Making bigger or smaller',
  },
  {
    question: 'What is a link?',
    options: ['A game', 'Clickable text', 'A printer', 'A keyboard'],
    correct: 'Clickable text',
  },
  {
    question: 'What is download?',
    options: ['Deleting', 'Getting from internet', 'Moving', 'Copying'],
    correct: 'Getting from internet',
  },
  {
    question: 'What is upload?',
    options: ['Deleting', 'Sending to internet', 'Moving', 'Copying'],
    correct: 'Sending to internet',
  },
  {
    question: 'What is a bookmark?',
    options: ['A game', 'Saving a website', 'A printer', 'A keyboard'],
    correct: 'Saving a website',
  },
  {
    question: 'What is a tab?',
    options: ['A game', 'Different pages in browser', 'A printer', 'A keyboard'],
    correct: 'Different pages in browser',
  },
  {
    question: 'What is refresh?',
    options: ['Deleting', 'Reloading a page', 'Moving', 'Copying'],
    correct: 'Reloading a page',
  },
  {
    question: 'What is a search?',
    options: ['A game', 'Finding something', 'A printer', 'A keyboard'],
    correct: 'Finding something',
  },
];

export default function ComputerGames() {
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
                💻
              </Text>
              <Text style={[styles.startScreenTitle, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
                Computer Games
              </Text>
              <Text style={[styles.startScreenDescription, { color: isDark ? '#a0a0b8' : '#6b7280' }]}>
                Test your computer knowledge with random questions!
              </Text>
              
              <View style={styles.gameRules}>
                <Text style={[styles.rulesTitle, { color: isDark ? '#ffffff' : '#1a1a2e' }]}>
                  Game Rules:
                </Text>
                <View style={styles.rulesList}>
                  <View style={styles.ruleItem}>
                    <Text style={styles.ruleIcon}>💻</Text>
                    <Text style={[styles.ruleText, { color: isDark ? '#cbd5e1' : '#4b5563' }]}>
                      Answer questions about computers and technology
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
                    backgroundColor: '#10b981',
                    ...Platform.select({
                      ios: {
                        shadowColor: '#10b981',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      },
                      android: {
                        elevation: 6,
                      },
                      web: {
                        boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)',
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
            Loading questions... 💻
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
              💻 Computer Games
            </Text>
            <Text style={[
              styles.gameSubtitle,
              { color: isDark ? '#a0a0b8' : '#6b7280' }
            ]}>
              Test your computer knowledge!
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={[
              styles.statCard,
              {
                backgroundColor: isDark 
                  ? 'rgba(16, 185, 129, 0.15)' 
                  : 'rgba(16, 185, 129, 0.08)',
                borderColor: isDark 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : 'rgba(16, 185, 129, 0.2)',
              }
            ]}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={[
                styles.statValue,
                { color: isDark ? '#10b981' : '#10b981' }
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
                { width: `${progress}%`, backgroundColor: '#10b981' }
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
                { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }
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
                      backgroundColor: '#10b981',
                      borderColor: '#10b981',
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
                          <Text style={{ color: '#10b981', fontSize: 16, fontWeight: 'bold' }}>✓</Text>
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
                      backgroundColor: '#10b981',
                      ...Platform.select({
                        ios: {
                          shadowColor: '#10b981',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                        },
                        android: {
                          elevation: 6,
                        },
                        web: {
                          boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)',
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

