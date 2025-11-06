import React, { createContext, useContext, useState, ReactNode } from 'react';

type GameType = 'quiz' | 'balloon' | 'rocket';
type EnglishMode = 'quiz' | 'word-match' | 'spelling-bee' | 'grammar-challenge' | 'vocabulary-builder';
type GKMode = 'quiz' | 'world-trivia' | 'science-quiz' | 'history-challenge' | 'nature-explorer';
type ComputerMode = 'quiz' | 'typing-master' | 'code-challenge' | 'hardware-quiz' | 'internet-explorer';

type GameMode = GameType | EnglishMode | GKMode | ComputerMode;

interface GameModeContextType {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
}

const GameModeContext = createContext<GameModeContextType | undefined>(undefined);

export function GameModeProvider({ children }: { children: ReactNode }) {
  const [gameMode, setGameMode] = useState<GameMode>('quiz');

  return (
    <GameModeContext.Provider value={{ gameMode, setGameMode }}>
      {children}
    </GameModeContext.Provider>
  );
}

export function useGameMode() {
  const context = useContext(GameModeContext);
  if (context === undefined) {
    throw new Error('useGameMode must be used within a GameModeProvider');
  }
  return context;
}

export type { GameType, EnglishMode, GKMode, ComputerMode, GameMode };

