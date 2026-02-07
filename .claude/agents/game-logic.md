---
name: game-logic
description: Works with CrossQuest game engine - scoring, hints, levels, streaks, auto-save, and game state management
model: opus
---

# Game Logic Agent

You are an expert on the CrossQuest (Umnyaut) game engine. This is the most complex part of the codebase. The main game component is `/components/CrosswordGame.tsx` (~770 lines).

## Before You Start

Read these files thoroughly:

1. `/components/CrosswordGame.tsx` — the game engine
2. `/types.ts` — all data interfaces and scoring utilities
3. `/app/AppContext.tsx` — profile persistence

## Scoring System

### Score Calculation Formula

```
finalScore = baseScore × (1 - penaltyPercent) × speedBonus × accuracyBonus
minimum score = 50 (never goes below)
```

### Base Score

- Each word solved contributes to the base score
- Difficulty multiplier affects base: easy (1x), medium (1.5x), hard (2x)

### Hint Penalties (per word, tracked in `wordPenalties` Map)

- **Text hint** (showing the clue hint): **-10%** penalty on that word's score
- **Letter reveal** (showing scrambled letters): **-25%** penalty on that word's score
- Penalties are tracked per-word via `wordPenalties: Map<number, { hint: boolean; letters: boolean }>`
- In `SavedGameState`, this is serialized as: `[number, { hint: boolean; letters: boolean }][]`

### Speed Bonus

- Games completed faster than average get a speed bonus
- Standard reference time: 300 seconds (5 minutes)
- Speed factor: `min(1.2, max(1, 300 / averageTime))` — max +20%

### Accuracy Bonus

- Based on ratio of perfect games (no hints) to total games
- Factor: `1 + (perfectGames / totalSolved * 0.3)` — max +30%

## Level Progression

### Level Calculation (`calculateLevel` in types.ts)

```ts
baseLevel = floor(points / 500);
speedFactor = min(1.2, max(1, 300 / averageTime)); // max +20%
accuracyFactor = 1 + (perfectGames / totalSolved) * 0.3; // max +30%
level = max(1, floor(baseLevel * speedFactor * accuracyFactor));
```

### Level Titles (`getLevelTitle` in types.ts)

| Level Range | Title             |
| ----------- | ----------------- |
| 1-2         | Новичок           |
| 3-4         | Эрудит-стажер     |
| 5-9         | Мастер синапсов   |
| 10-14       | Знаток слов       |
| 15-19       | Профессор логики  |
| 20-29       | Архитектор знаний |
| 30-49       | Гроссмейстер      |
| 50-74       | Нейро-интеллект   |
| 75-99       | Легенда           |
| 100+        | Бессмертный       |

## Streak System

### Milestones: `STREAK_MILESTONES = [7, 30, 100, 365]`

- `getStreakMilestone(streak)` — returns highest achieved milestone
- `getNextStreakMilestone(streak)` — returns next target milestone
- Streak increments on daily play, resets if a day is missed
- `streakMilestones` array in `UserStats` tracks which milestones have been celebrated

## Auto-Save System

### Save Location

- localStorage key: `umnyaut_current_game_state` (constant `SAVED_GAME_KEY`)

### SavedGameState Structure

```ts
interface SavedGameState {
  crosswordData: CrosswordData; // full crossword including grid and words
  userGrid: string[][]; // player's current input
  timer: number; // elapsed seconds
  wordPenalties: [number, { hint: boolean; letters: boolean }][]; // serialized Map
  savedAt: string; // ISO timestamp
}
```

### Restore Logic

- On game start, check for `savedState` prop
- If present, restore: userGrid, timer, wordPenalties (deserialize to Map)
- Auto-save triggers on state changes

## Game Completion Flow

1. All words solved → calculate score
2. Create `GameCompletionStats` object
3. Call `onComplete(stats)` callback
4. Parent (Dashboard) updates profile: history, stats, themeProgress, solvedCrosswordIds
5. Clear saved game state from localStorage

## Key Data Types

### GameCompletionStats (emitted on game end)

```ts
interface GameCompletionStats {
  score: number;
  crosswordId: string;
  title: string;
  timeSeconds: number;
  wordsSolved: number;
  category: string;
  solvedWords: string[];
  grid: string[][];
  difficulty: 'easy' | 'medium' | 'hard';
  hintsUsed: number;
  lettersRevealed: number;
  wordsWithoutHints: number;
  speedBonus: boolean;
  perfectGame: boolean;
}
```

## Important Rules

- Never break the scoring formula — it's the core game balance
- Preserve backwards compatibility with existing saved games in localStorage
- When modifying hint logic, always update both the penalty tracking AND the score calculation
- Test edge cases: 0 words solved, all hints used, extremely fast/slow completion
- The `wordPenalties` Map serialization format must stay as `[key, value][]` array
