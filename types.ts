export enum Direction {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

// Age group system
export type AgeGroupKey = 'kids' | 'teens' | 'young' | 'adult' | 'mature' | 'senior';

export interface AgeGroupConfig {
  min: number;
  max: number;
  label: string;
  description: string;
}

export const AGE_GROUPS: Record<AgeGroupKey, AgeGroupConfig> = {
  kids: { min: 0, max: 12, label: 'До 12 лет', description: 'Простой словарь, небольшие сетки' },
  teens: {
    min: 13,
    max: 17,
    label: '13-17 лет',
    description: 'Школьная программа, современные темы',
  },
  young: {
    min: 18,
    max: 25,
    label: '18-25 лет',
    description: 'Полный словарь, актуальный контент',
  },
  adult: {
    min: 26,
    max: 40,
    label: '26-40 лет',
    description: 'Академический уровень, широкий кругозор',
  },
  mature: {
    min: 41,
    max: 60,
    label: '41-60 лет',
    description: 'Классический подход, разнообразие тем',
  },
  senior: { min: 61, max: 120, label: '60+ лет', description: 'Крупный шрифт, классические темы' },
};

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
  grid?: string[][];
  difficulty?: 'easy' | 'medium' | 'hard';
  hintsUsed?: number;
  lettersRevealed?: number;
  wordsWithoutHints?: number;
}

export interface Category {
  name: string;
  word_count: number;
  guessed_count?: number;
  guessed_percent?: number;
  available?: boolean;
  icon?: string;
  description?: string;
  age_groups?: AgeGroupKey[];
}

export interface UserStats {
  points: number;
  level: number;
  streak: number;
  lastPlayed: string | null;
  totalSolved: number;
  averageTime?: number;
  perfectGames?: number;
  maxStreak?: number;
  streakMilestones?: number[];
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
  avatar?: string;
  ageGroup?: AgeGroupKey;
  defaultDifficulty?: 'easy' | 'medium' | 'hard';
  soundEnabled?: boolean;
  createdAt?: string;
}

export interface SavedGameState {
  crosswordData: CrosswordData;
  userGrid: string[][];
  timer: number;
  wordPenalties: [number, { hint: boolean; letters: boolean }][];
  savedAt: string;
}

export const SAVED_GAME_KEY = 'umnyaut_current_game_state';

// Categories available per age group
export const AGE_CATEGORY_MAP: Record<AgeGroupKey, string[]> = {
  kids: ['Животные', 'Цвета и формы', 'Еда', 'Спорт', 'Транспорт', 'Творчество'],
  teens: [
    'Наука',
    'История',
    'География',
    'Литература',
    'Искусство',
    'Спорт',
    'Музыка',
    'Кино и культура',
    'Технологии',
    'Еда',
  ],
  young: [
    'Наука',
    'История',
    'География',
    'Литература',
    'Искусство',
    'Спорт',
    'Музыка',
    'Кино и культура',
    'Технологии',
    'Экономика',
    'Кулинария',
  ],
  adult: [
    'Наука',
    'История',
    'География',
    'Литература',
    'Искусство',
    'Спорт',
    'Музыка',
    'Кино и культура',
    'Технологии',
    'Экономика',
    'Право',
    'Политика',
    'Кулинария',
  ],
  mature: [
    'Наука',
    'История',
    'География',
    'Литература',
    'Искусство',
    'Спорт',
    'Музыка',
    'Кино и культура',
    'Технологии',
    'Экономика',
    'Право',
    'Политика',
    'Кулинария',
    'Природа и садоводство',
  ],
  senior: [
    'Наука',
    'История',
    'География',
    'Искусство',
    'Спорт',
    'Музыка',
    'Кино и культура',
    'Кулинария',
    'Природа и садоводство',
    'Советское кино',
    'Классическая литература',
    'Классическая музыка',
    'История СССР/России',
    'Садоводство и огородничество',
    'Живопись и скульптура',
  ],
};

// Category icon mapping
export const CATEGORY_ICONS: Record<string, string> = {
  Наука: '🧬',
  Искусство: '🎭',
  История: '📜',
  География: '🌍',
  Спорт: '⚽',
  Музыка: '🎵',
  'Кино и культура': '🎬',
  Технологии: '💻',
  Экономика: '💼',
  Литература: '📚',
  Право: '⚖️',
  Политика: '🏛️',
  Кулинария: '🍷',
  Животные: '🐾',
  'Цвета и формы': '🌈',
  Еда: '🍎',
  Транспорт: '🚗',
  Творчество: '🎨',
  'Природа и садоводство': '🌿',
  'Советское кино': '📺',
  'Классическая литература': '📖',
  'Классическая музыка': '🎼',
  'История СССР/России': '🏛️',
  'Садоводство и огородничество': '🌾',
  'Живопись и скульптура': '🎨',
};

export const getLevelTitle = (level: number): string => {
  if (level < 3) return 'Новичок';
  if (level < 5) return 'Эрудит-стажер';
  if (level < 10) return 'Мастер синапсов';
  if (level < 15) return 'Знаток слов';
  if (level < 20) return 'Профессор логики';
  if (level < 30) return 'Архитектор знаний';
  if (level < 50) return 'Гроссмейстер';
  if (level < 75) return 'Нейро-интеллект';
  if (level < 100) return 'Легенда';
  return 'Бессмертный';
};

// Calculate level based on points, speed, and accuracy
export const calculateLevel = (stats: UserStats): number => {
  const { points, totalSolved, averageTime, perfectGames } = stats;

  // Base level from points
  const baseLevel = Math.floor(points / 500);

  // Speed bonus: faster average = higher bonus (max +20%)
  // Assuming 300 seconds (5 min) is "standard", faster gives bonus
  const speedFactor =
    averageTime && averageTime > 0 ? Math.min(1.2, Math.max(1, 300 / averageTime)) : 1;

  // Accuracy bonus: more perfect games = higher bonus (max +30%)
  const accuracyRate = totalSolved > 0 && perfectGames ? perfectGames / totalSolved : 0;
  const accuracyFactor = 1 + accuracyRate * 0.3;

  // Final level calculation
  const level = Math.max(1, Math.floor(baseLevel * speedFactor * accuracyFactor));

  return level;
};

// Streak milestones
export const STREAK_MILESTONES = [7, 30, 100, 365];

export const getStreakMilestone = (streak: number): number | null => {
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
    if (streak >= STREAK_MILESTONES[i]) {
      return STREAK_MILESTONES[i];
    }
  }
  return null;
};

export const getNextStreakMilestone = (streak: number): number | null => {
  for (const milestone of STREAK_MILESTONES) {
    if (streak < milestone) {
      return milestone;
    }
  }
  return null;
};
