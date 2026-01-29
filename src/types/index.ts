
export enum Direction {
  HORIZONTAL = 'H',
  VERTICAL = 'V'
}

export interface CrosswordItem {
  id: string;
  clue: string;
  answer: string;
  row: number;
  col: number;
  direction: Direction;
}

export interface CrosswordData {
  title: string;
  gridSize: number;
  items: CrosswordItem[];
}

export interface GameHistoryEntry {
  id: string;
  date: string;
  title: string;
  score: number;
  categories: string[];
}

export interface UserStats {
  points: number;
  level: number;
  streak: number;
  lastPlayed: string | null;
  totalSolved: number;
}

export interface UserProfile {
  username: string;
  categories: string[];
  stats: UserStats;
  history: GameHistoryEntry[];
}

export const CATEGORIES = [
  'Наука', 'История', 'Искусство', 'Кино', 'Технологии', 
  'География', 'Спорт', 'Литература', 'Музыка', 'Еда', 'Природа'
];

export const getLevelTitle = (level: number): string => {
  if (level < 5) return 'Эрудит-стажер';
  if (level < 10) return 'Мастер синапсов';
  if (level < 20) return 'Профессор логики';
  if (level < 50) return 'Архитектор знаний';
  return 'Нейро-интеллект';
};
