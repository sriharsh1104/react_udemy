import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import Sidebar from '@/components/sidebar';
import MathsGamesMenu from '@/components/MathsGamesMenu';
import QuizGame from '@/components/games/QuizGame';
import BalloonGame from '@/components/games/BalloonGame';
import RocketGame from '@/components/games/RocketGame';

type GameType = 'quiz' | 'balloon' | 'rocket';

export default function MathsGames() {
  const [activeGame, setActiveGame] = useState<GameType>('quiz');

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
          <MathsGamesMenu activeGame={activeGame} onGameChange={setActiveGame} />
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
