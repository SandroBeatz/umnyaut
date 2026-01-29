# Next.js Migration Guide

## Overview

This document describes the migration from **Vite + React** to **Next.js 15** with the App Router.

## Migration Summary

### What Changed

#### Framework & Build System
- **Before**: Vite 6.2 with React 19
- **After**: Next.js 15 (Turbopack) with React 19

#### Project Structure
```
Before (Vite):
├── index.html
├── index.tsx
├── App.tsx
├── components/
├── types.ts
└── geminiService.ts

After (Next.js):
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Main page (was App.tsx)
│   │   └── globals.css
│   ├── components/          # All React components
│   ├── lib/
│   │   └── geminiService.ts
│   └── types/
│       └── index.ts
├── next.config.ts
├── tailwind.config.ts
└── postcss.config.mjs
```

#### Routing
- **Before**: Client-side state-based routing (view state in App.tsx)
- **After**: Same client-side state-based routing preserved in `src/app/page.tsx`
- **Note**: All routing logic remains identical to maintain exact same behavior

#### Styling
- **Before**: Tailwind CDN in `index.html`
- **After**: Proper Tailwind CSS integration with `@tailwindcss/postcss`

#### Fonts
- **Before**: Google Fonts via `<link>` tag
- **After**: Google Fonts via `<link>` tag in layout (simpler than next/font for this use case)

#### Environment Variables
- **Before**: `process.env.API_KEY` (Vite)
- **After**: `process.env.NEXT_PUBLIC_GEMINI_API_KEY` (Next.js)
- Create `.env.local` with your API key

### What Stayed the Same

✅ **All business logic** - No changes to game mechanics, points, levels, streaks
✅ **All components** - Exact same component code with only import path updates
✅ **User flows** - Identical user experience and navigation
✅ **localStorage persistence** - Same profile storage mechanism
✅ **State management** - Same useState/useEffect patterns
✅ **Dependencies** - React 19, Framer Motion, Recharts, etc.

## Key Technical Decisions

### 1. App Router vs Pages Router
**Decision**: App Router
**Reasoning**: 
- Modern Next.js recommendation
- Better for future SSR/RSC adoption
- Cleaner file-based routing structure

### 2. Rendering Strategy
**Decision**: Client-side rendering for entire app
**Reasoning**:
- Game requires browser APIs (localStorage, canvas-confetti)
- Heavy client-side state and interactions
- All components marked with `'use client'`

### 3. Component Migration
**Decision**: Minimal changes, preserve all logic
**Approach**:
- Added `'use client'` directive to all components
- Updated imports to use `@/` alias
- No logic changes whatsoever

### 4. Gemini Service
**Decision**: Lazy initialization
**Reasoning**:
- Avoid SSR issues with API key
- Initialize GoogleGenAI only when needed on client

## Setup Instructions

### Install Dependencies
```bash
npm install
```

### Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local and add your Gemini API key
```

### Development
```bash
npm run dev
# Opens at http://localhost:3000
```

### Build
```bash
npm run build
```

### Lint & Format
```bash
npm run lint
npm run format
```

### Test
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Code Quality & Tooling

### ESLint
- Configured with `next/core-web-vitals` and `next/typescript`
- Automatic linting on build
- Run manually: `npm run lint`

### Prettier
- Consistent code formatting
- Configuration: `.prettierrc.json`
- Run manually: `npm run format`

### Testing
- Jest + React Testing Library
- Example test: `src/components/__tests__/BottomNav.test.tsx`
- Documentation: `TESTING.md`

## Verification Checklist

✅ Build completes successfully (`npm run build`)
✅ Dev server runs without errors (`npm run dev`)
✅ Landing page renders correctly
✅ Onboarding flow works
✅ Dashboard displays user stats
✅ Game generation and play works
✅ Settings page functional
✅ Navigation between views works
✅ localStorage persistence works
✅ Points/levels/streaks calculation correct
✅ All animations and interactions work
✅ Tests pass (`npm test`)

## Potential Issues & Solutions

### Issue: Google Fonts not loading in build
**Solution**: Using `<link>` tag in layout.tsx instead of next/font for simplicity

### Issue: localStorage not defined during SSR
**Solution**: All components using localStorage are client components with `'use client'`

### Issue: Gemini API initialization during build
**Solution**: Lazy initialization in `getAI()` function, called only on client

### Issue: Tailwind classes not applying
**Solution**: Using `@tailwindcss/postcss` plugin instead of legacy tailwindcss package

## Performance Considerations

- **Turbopack**: Fast builds and hot reloading
- **React 19**: Latest React features and optimizations
- **CSS**: Tailwind with PostCSS for optimal production builds
- **Code Splitting**: Next.js automatic code splitting

## Future Improvements

1. **Server Components**: Migrate static components to RSC
2. **Route Groups**: Organize routes with (dashboard), (game), etc.
3. **API Routes**: Move Gemini service to API route for key security
4. **Metadata**: Add dynamic metadata per route
5. **Image Optimization**: Use next/image for any future images
6. **Incremental Static Regeneration**: For any static content

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS with Next.js](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)
- [Testing Next.js](https://nextjs.org/docs/app/building-your-application/testing/jest)
