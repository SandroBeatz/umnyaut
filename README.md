<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Умняут - Умный Кроссворд

Интеллектуальная игра в кроссворды, построенная на Next.js 16 с использованием App Router.

## 🚀 Технологический Стек

- **Framework**: Next.js 16.1 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3
- **Language**: TypeScript
- **Testing**: Vitest + Testing Library
- **Code Quality**: ESLint + Prettier
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn

## 🛠️ Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/SandroBeatz/Umnyaut.git
   cd Umnyaut
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key (if needed)

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 🧪 Testing

Run tests:

```bash
npm test
```

Run tests with UI:

```bash
npm run test:ui
```

## 🎨 Code Quality

Format code with Prettier:

```bash
npm run format
```

Lint code with ESLint:

```bash
npm run lint
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── game/              # Game page
│   ├── onboarding/        # Onboarding page
│   ├── settings/          # Settings page
│   ├── AppContext.tsx     # Global state management
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
├── public/                # Static assets
├── crosswordApi.ts        # API integration
├── types.ts               # TypeScript types
└── vitest.config.ts       # Test configuration
```

## 🎮 Features

- **User Profiles**: Create and manage your gaming profile
- **Multiple Categories**: Choose from various word categories
- **Difficulty Levels**: Play crosswords at different difficulty levels
- **Progress Tracking**: Track your points, level, and streak
- **History**: View your game history and statistics
- **Responsive Design**: Works on desktop and mobile devices

## 🔧 Migration from Vite to Next.js

This project was successfully migrated from Vite to Next.js 16 with the following improvements:

✅ **App Router**: Modern file-based routing system  
✅ **Server Components**: Optimized performance with server-side rendering  
✅ **TypeScript**: Full type safety across the application  
✅ **Testing**: Vitest setup with example tests  
✅ **Code Quality**: ESLint and Prettier configured  
✅ **Maintained Logic**: All business logic and user flows preserved

## 📝 License

This project is private and not licensed for public use.

## 👥 Contributors

- SandroBeatz - Original Author

## 🔗 Links

View the app in AI Studio: https://ai.studio/apps/drive/1Ji0iSJaTqGGgfWbYPHkOj7_L6FkddtXl
