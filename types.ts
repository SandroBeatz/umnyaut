export enum Direction {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

export interface Word {
  word: string;
  clue: string;
  hint: string;
  startRow: number;
  startCol: number;
  direction: Direction;
  length: number;
}

export interface CrosswordMetadata {
  word_count: number;
  grid_size: { rows: number; cols: number };
  generation_time_ms: number;
  attempts: number;
}

export interface CrosswordData {
  id: string;
  grid: string[][];
  words: Word[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  metadata?: CrosswordMetadata;
}

export interface GameHistoryEntry {
  id: string;
  crosswordId: string;
  date: string;
  title: string;
  score: number;
  timeSeconds: number;
  wordsSolved: number;
  category: string;
}

export interface Category {
  name: string;
  word_count: number;
  guessed_count?: number;
  guessed_percent?: number;
  available?: boolean;
}

export interface UserStats {
  points: number;
  level: number;
  streak: number;
  lastPlayed: string | null;
  totalSolved: number;
}

export interface ThemeProgress {
  [categoryName: string]: {
    completedWords: string[];
    totalWords: number;
  };
}

export interface UserProfile {
  username: string;
  selectedCategories: string[];
  stats: UserStats;
  history: GameHistoryEntry[];
  solvedCrosswordIds: string[];
  themeProgress: ThemeProgress;
}

export const getLevelTitle = (level: number): string => {
  if (level < 5) return 'Эрудит-стажер';
  if (level < 10) return 'Мастер синапсов';
  if (level < 20) return 'Профессор логики';
  if (level < 50) return 'Архитектор знаний';
  return 'Нейро-интеллект';
};
