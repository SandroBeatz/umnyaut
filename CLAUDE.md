# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Умняут (Umnyaut) is a Russian-language crossword puzzle game built with Next.js 16 (App Router) and React 19. The app fetches crossword data from an external Railway-hosted Python API and stores user progress in localStorage.

## Commands

```bash
npm run dev       # Start development server at localhost:3000
npm run build     # Build for production
npm run lint      # Run ESLint
npm run format    # Format code with Prettier
npm test          # Run Vitest tests
npm run test:ui   # Run tests with Vitest UI
```

## Architecture

### App Router Structure

- `app/` - Next.js App Router pages (each folder = route)
  - `layout.tsx` - Root layout, wraps app in `AppProvider`
  - `page.tsx` - Landing page
  - `AppContext.tsx` - Global state via React Context (profile, stats, localStorage persistence)

### Key Files

- `types.ts` - All TypeScript interfaces (`CrosswordData`, `UserProfile`, `Word`, etc.)
- `crosswordApi.ts` - API client for external crossword backend with retry logic
- `components/` - React components (all client-side with `'use client'`)

### State Management

User profile and game state are managed through `AppContext` and persisted to localStorage under key `umnyaut_profile`. The context provides `profile`, `setProfile`, `saveProfile`, and `loading`.

### External API

Backend at `https://cross-questpython-production.up.railway.app/api`:

- `POST /categories` - Get categories with progress
- `POST /crossword` - Generate crossword by category/difficulty

API may have cold start delays (30-45 second timeouts configured).

### Testing

Uses Vitest with jsdom environment. Config in `vitest.config.ts` with path alias `@/*` mapped to root.

## Environment Variables

Set `GEMINI_API_KEY` in `.env.local` if using Gemini features.

## Beads (bd) Workflow Cheat Sheet

GETTING STARTED
bd init Initialize bd in your project
Creates .beads/ directory with project-specific database
Auto-detects prefix from directory name (e.g., myapp-1, myapp-2)

bd init --prefix api Initialize with custom prefix
Issues will be named: api-<hash> (e.g., api-a3f2dd)

CREATING ISSUES
bd create "Fix login bug"
bd create "Add auth" -p 0 -t feature
bd create "Write tests" -d "Unit tests for auth" --assignee alice

VIEWING ISSUES
bd list List all issues
bd list --status open List by status
bd list --priority 0 List by priority (0-4, 0=highest)
bd show bd-1 Show issue details

MANAGING DEPENDENCIES
bd dep add bd-1 bd-2 Add dependency (bd-2 blocks bd-1)
bd dep tree bd-1 Visualize dependency tree
bd dep cycles Detect circular dependencies

DEPENDENCY TYPES
blocks Task B must complete before task A
related Soft connection, doesn't block progress
parent-child Epic/subtask hierarchical relationship
discovered-from Auto-created when AI discovers related work

READY WORK
bd ready Show issues ready to work on
Ready = status is 'open' AND no blocking dependencies
Perfect for agents to claim next work!

UPDATING ISSUES
bd update bd-1 --status in_progress
bd update bd-1 --priority 0
bd update bd-1 --assignee bob

CLOSING ISSUES
bd close bd-1
bd close bd-2 bd-3 --reason "Fixed in PR #42"
