# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CrossQuest (Интеллект) is an AI-powered Russian crossword game built with Next.js 15 and React 19. It uses Google's Gemini API to generate crossword puzzles based on user-selected categories, with gamification features including points, levels, streaks, and achievements.

## Development Commands

```bash
npm install           # Install dependencies
npm run dev           # Start dev server (http://localhost:3000)
npm run build         # Production build
npm start             # Start production server
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## Environment Setup

Create `.env.local` with:
```
NEXT_PUBLIC_GEMINI_API_KEY=<your-gemini-api-key>
```

## Architecture

**Tech Stack:** Next.js 15 (App Router with Turbopack) + React 19 + TypeScript + Tailwind CSS + Framer Motion

**Project Structure:**
```
src/
├── app/
│   ├── layout.tsx      # Root layout with fonts
│   ├── page.tsx        # Main page with view state routing
│   └── globals.css     # Global styles
├── components/         # All React components
├── lib/
│   └── geminiService.ts  # Gemini API integration
└── types/
    └── index.ts        # TypeScript types and constants
```

**Key Files:**
- `src/app/page.tsx` - Root component with view state (LANDING/ONBOARDING/DASHBOARD/GAME/SETTINGS) and localStorage persistence
- `src/components/CrosswordGame.tsx` - Main game logic: grid rendering, keyboard navigation, cell validation, confetti on completion
- `src/components/Dashboard.tsx` - Home view with stats cards, 7-day activity chart (Recharts), game history
- `src/lib/geminiService.ts` - Gemini API integration (gemini-3-flash-preview model) with structured JSON schema output

## Key Patterns

- **Rendering:** All components are client-side (`'use client'`) due to localStorage and browser API usage
- **State Management:** useState/useEffect with props drilling from page.tsx
- **Persistence:** localStorage with key `intellect_crossword_profile`
- **Styling:** Tailwind utilities + custom CSS classes in globals.css
- **Imports:** Use `@/` path alias (e.g., `@/components`, `@/lib`, `@/types`)
- **Gemini Service:** Lazy initialization to avoid SSR issues with API key

## Game Mechanics

- 300 points per completed crossword
- Level up every 500 points (5 tiers from "Эрудит-стажер" to "Нейро-интеллект")
- Daily streak tracking with reset on missed days
- History limited to 20 most recent games
- 11 Russian categories: Наука, История, Искусство, Кино, Технологии, География, Спорт, Литература, Музыка, Еда, Природа
