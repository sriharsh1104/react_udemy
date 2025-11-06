import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import Sidebar from '@/components/sidebar';
import QuizGame from '@/components/games/QuizGame';
import BalloonGame from '@/components/games/BalloonGame';
import RocketGame from '@/components/games/RocketGame';
import { useGameMode, GameType } from '@/contexts/GameModeContext';

export default function MathsGames() {
  const { gameMode, setGameMode } = useGameMode();
  const [activeGame, setActiveGame] = useState<GameType>('quiz');

  // Initialize game mode when component mounts
  useEffect(() => {
    if (gameMode === 'quiz' || gameMode === 'balloon' || gameMode === 'rocket') {
      setActiveGame(gameMode);
    } else {
      // Set default to quiz if gameMode is not a maths game type
      setGameMode('quiz');
      setActiveGame('quiz');
    }
  }, []);

  // Sync local state with global game mode changes
  useEffect(() => {
    if (gameMode === 'quiz' || gameMode === 'balloon' || gameMode === 'rocket') {
      setActiveGame(gameMode);
    }
  }, [gameMode]);

  const renderGame = () => {
    switch (activeGame) {
      case 'quiz':
        return <QuizGame />;
      case 'balloon':
        return <BalloonGame />;
      case 'rocket':
        return <RocketGame />;
      default:
        return <QuizGame />;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.layout}>
        <Sidebar />
        <View style={styles.mainContent}>
          <View style={styles.gameContent}>
            {renderGame()}
          </View>
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
  gameContent: {
    flex: 1,
  },
});
