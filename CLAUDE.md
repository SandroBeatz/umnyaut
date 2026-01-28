# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CrossQuest (Интеллект) is an AI-powered Russian crossword game built with React 19 and Vite. It uses Google's Gemini API to generate crossword puzzles based on user-selected categories, with gamification features including points, levels, streaks, and achievements.

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run preview  # Preview production build
```

## Environment Setup

Create `.env.local` with:
```
GEMINI_API_KEY=<your-gemini-api-key>
```

## Architecture

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS (CDN) + Framer Motion

**Entry Points:**
- `index.html` - HTML with Tailwind CDN, Google Fonts, ES module import maps
- `index.tsx` - React DOM render
- `App.tsx` - Root component with view state (DASHBOARD/GAME/SETTINGS) and localStorage persistence

**Core Components:**
- `components/CrosswordGame.tsx` - Main game logic: grid rendering, keyboard navigation, cell validation, answer checking, confetti on completion
- `components/Dashboard.tsx` - Home view with stats cards, 7-day activity chart (Recharts), game history
- `components/Onboarding.tsx` - First-time user setup (username + category selection)
- `components/Settings.tsx` - Profile editing
- `components/Layout.tsx` - Header with user stats
- `components/BottomNav.tsx` - Mobile navigation

**Services:**
- `geminiService.ts` - Gemini API integration (gemini-3-pro-preview model) with structured JSON output for crossword generation

**Types:**
- `types.ts` - All TypeScript interfaces (CrosswordData, UserProfile, GameHistoryEntry, etc.) and constants (CATEGORIES array with 11 Russian categories)

## Key Patterns

- **State Management:** useState/useEffect with props drilling from App.tsx
- **Persistence:** localStorage with key `intellect_crossword_profile`
- **Styling:** Tailwind utilities + custom CSS classes (.font-game, .glass-card, .custom-scrollbar)
- **Animations:** Framer Motion for view transitions
- **Grid Logic:** 10x10 crossword grid with auto-cropping to minimum size (6x6 min), directional tracking (H/V), solved word locking

## Game Mechanics

- 300 points per completed crossword
- Level up every 500 points (5 tiers from "Эрудит-стажер" to "Нейро-интеллект")
- Daily streak tracking with reset on missed days
- History limited to 20 most recent games
