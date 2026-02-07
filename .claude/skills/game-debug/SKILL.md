---
name: game-debug
description: Inspect and explain game state data structures (profile, saved game, stats) from localStorage
user_invocable: true
---

# /game-debug [profile|game|stats|all]

Inspect and explain CrossQuest game state data structures.

## Arguments

- `profile` — Explain UserProfile structure and localStorage key
- `game` — Explain SavedGameState structure and auto-save mechanics
- `stats` — Explain UserStats, scoring formula, and level calculation
- `all` (default) — Show all of the above

## Instructions

### For `profile`:

Explain the `UserProfile` interface from `/types.ts`:

```
localStorage key: "umnyaut_profile"

UserProfile {
  username: string              — Display name
  selectedCategories: string[]  — Chosen crossword categories
  stats: UserStats              — Points, level, streak, etc.
  history: GameHistoryEntry[]   — Completed games log
  solvedCrosswordIds: string[]  — IDs of completed crosswords (dedup)
  themeProgress: ThemeProgress  — Per-category word progress
  avatar?: string               — Avatar identifier
  defaultDifficulty?: string    — "easy" | "medium" | "hard"
  soundEnabled?: boolean        — Sound effects toggle
  createdAt?: string            — ISO date of profile creation
}
```

Note the migration logic in `AppContext.tsx`:

- `solvedCrosswordIds` defaults to `[]` if missing
- `themeProgress` defaults to `{}` if missing
- `categories` renamed to `selectedCategories`
- `soundEnabled` defaults to `true`
- `defaultDifficulty` defaults to `"medium"`
- `createdAt` set to current date if missing

### For `game`:

Explain the `SavedGameState` interface:

```
localStorage key: "umnyaut_current_game_state" (SAVED_GAME_KEY)

SavedGameState {
  crosswordData: CrosswordData  — Full crossword (grid, words, clues)
  userGrid: string[][]          — Player's current letter input
  timer: number                 — Elapsed seconds
  wordPenalties: [number, {hint: boolean, letters: boolean}][]
                                — Serialized Map of hint usage per word index
  savedAt: string               — ISO timestamp of last save
}
```

Key points:

- `wordPenalties` is a `Map<number, {...}>` at runtime, serialized as array of tuples
- `userGrid` mirrors `crosswordData.grid` dimensions, empty cells are `""`
- Auto-save triggers on state changes during gameplay
- Cleared from localStorage on game completion

### For `stats`:

Explain `UserStats` and scoring:

```
UserStats {
  points: number         — Total accumulated points
  level: number          — Calculated level (see formula)
  streak: number         — Consecutive days played
  lastPlayed: string     — ISO date of last game
  totalSolved: number    — Total crosswords completed
  averageTime?: number   — Average completion time in seconds
  perfectGames?: number  — Games completed without any hints
  maxStreak?: number     — Highest streak ever achieved
  streakMilestones?: number[]  — Celebrated milestone values
}
```

**Scoring formula:**

```
finalScore = baseScore × (1 - penaltyPercent) × speedBonus × accuracyBonus
Minimum: 50 points
```

**Level formula:**

```
baseLevel = floor(points / 500)
speedFactor = min(1.2, max(1, 300/averageTime))
accuracyFactor = 1 + (perfectGames/totalSolved × 0.3)
level = max(1, floor(baseLevel × speedFactor × accuracyFactor))
```

**Streak milestones:** 7, 30, 100, 365 days

### Common Issues to Watch For

1. **Corrupted profile** — JSON parse fails in AppContext, profile becomes null
2. **Missing migration fields** — Old profiles missing `solvedCrosswordIds`, `themeProgress`, etc.
3. **wordPenalties deserialization** — Must convert `[key, value][]` back to `Map`
4. **Stale saved game** — `savedAt` too old, crossword data may not match current API
5. **NaN in stats** — Division by zero in level calc when `totalSolved` is 0
