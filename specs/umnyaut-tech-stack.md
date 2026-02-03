# Технический стек Умняут

## Обзор архитектуры

**Умняут** построен на современном технологическом стеке с акцентом на производительность, масштабируемость и простоту разработки. Архитектура разделена на три основных слоя: Frontend, Backend API и Storage.

---

## Frontend Stack

### Основной фреймворк

**Next.js**
- Версия: Latest (App Router)
- Рендеринг: Server-Side Rendering (SSR) + Client-Side Rendering (CSR)
- Роутинг: App Router (app directory)
- API Routes: Для легких операций и проксирования

**Преимущества:**
- SEO-оптимизация из коробки
- Быстрая загрузка страниц
- Встроенная оптимизация изображений
- Простой деплой на Vercel

---

### Стилизация

**Tailwind CSS**
- Версия: Latest
- Конфигурация: Кастомная палитра из `umnyaut-color-palette.md`
- Плагины:
  - `@tailwindcss/forms` - для стилизации форм
  - `@tailwindcss/typography` - для текстового контента
  - `tailwindcss-animate` - для анимаций

**Структура:**
```
styles/
├── globals.css          # Глобальные стили и CSS переменные
├── tailwind.config.js   # Конфигурация Tailwind
└── themes/
    ├── light.css        # Светлая тема
    └── dark.css         # Темная тема (будущая реализация)
```

---

### UI Компоненты

**shadcn/ui**
- Подход: Copy-paste компоненты (не NPM пакет)
- Кастомизация: Полный контроль над кодом
- Базовые компоненты:
  - Button, Card, Dialog, Dropdown
  - Input, Textarea, Select
  - Toast, Alert, Badge
  - Progress, Tabs, Accordion
  - Sheet (для mobile меню)

**Структура компонентов:**
```
components/
├── ui/                  # shadcn компоненты
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/              # Компоненты макета
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── Footer.tsx
├── games/               # Игровые компоненты
│   ├── crossword/       # Независимый модуль кроссворда
│   │   ├── CrosswordGrid.tsx
│   │   ├── QuestionList.tsx
│   │   ├── HintModal.tsx
│   │   └── index.tsx
│   └── [future-games]/  # Будущие игры
└── shared/              # Общие компоненты
    ├── StatCard.tsx
    ├── ProgressBar.tsx
    └── GameCard.tsx
```

---

### Дополнительные библиотеки

**Анимации:**
- `framer-motion` - для сложных анимаций и переходов
- `react-confetti` - для celebration эффектов

**Иконки:**
- `lucide-react` - современные SVG иконки
- Кастомные SVG для игровых элементов

**Утилиты:**
- `clsx` / `cn` - для условных классов
- `date-fns` - для работы с датами
- `zustand` - state management (легковесная альтернатива Redux)

**Графики и визуализация:**
- `recharts` - для статистики и графиков активности

---

## Backend Stack

### Python API

**Фреймворк:**
- **FastAPI** (рекомендуется) или **Flask**
- Асинхронная обработка запросов
- Автоматическая генерация документации (Swagger UI)
- Валидация данных через Pydantic

**Структура API:**
```
api/
├── main.py                 # Точка входа
├── config.py               # Конфигурация
├── requirements.txt        # Зависимости
├── games/
│   ├── crossword/
│   │   ├── generator.py    # Алгоритм генерации
│   │   ├── dictionary.py   # Работа со словарями
│   │   ├── models.py       # Pydantic модели
│   │   └── routes.py       # API endpoints
│   └── [future-games]/     # Будущие игры
├── utils/
│   ├── validators.py
│   └── helpers.py
└── data/
    └── dictionaries/       # Словари для игр
        ├── crossword_ru.json
        └── categories/
```

---

### API Endpoints (Кроссворд)

**Генерация кроссворда:**
```
POST /api/crossword/generate
Body: {
  "difficulty": "medium",  // easy | medium | hard
  "category": "science",
  "excludeIds": [1, 5, 8]  // ID решенных кроссвордов
}
Response: {
  "id": "uuid",
  "grid": [...],           // Сетка с буквами
  "questions": {
    "across": [...],       // Вопросы по горизонтали
    "down": [...]          // Вопросы по вертикали
  },
  "answers": {...},        // Ответы (зашифровано)
  "difficulty": "medium",
  "category": "science"
}
```

**Получение категорий:**
```
GET /api/crossword/categories
Response: {
  "categories": [
    {
      "id": "science",
      "name": "Наука",
      "totalWords": 100,
      "icon": "🧬"
    },
    ...
  ]
}
```

**Валидация ответа:**
```
POST /api/crossword/validate
Body: {
  "crosswordId": "uuid",
  "answers": {
    "1-across": "ПАРИЖ",
    "2-down": "ФРАНЦИЯ"
  }
}
Response: {
  "correct": true/false,
  "mistakes": ["2-down"],
  "score": 250
}
```

**Health check:**
```
GET /api/health
Response: {
  "status": "ok",
  "version": "1.0.0"
}
```

---

## Storage (Хранение данных)

### Текущая реализация: LocalStorage

**Структура данных в LocalStorage:**

```typescript
// Профиль пользователя
interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  createdAt: string;
  preferences: {
    difficulty: 'easy' | 'medium' | 'hard';
    soundEnabled: boolean;
    notificationsEnabled: boolean;
  };
}

// Статистика
interface UserStats {
  totalGames: number;
  totalPoints: number;
  level: number;
  streak: number;
  lastPlayedDate: string;
  averageTime: number;
  accuracy: number;
}

// История игр
interface GameHistory {
  games: Array<{
    id: string;
    type: 'crossword';
    category: string;
    difficulty: string;
    score: number;
    time: number;
    hintsUsed: number;
    completedAt: string;
    gridState: any; // Для просмотра решенного кроссворда
  }>;
}

// Прогресс по темам
interface ThemeProgress {
  themes: Array<{
    id: string;
    name: string;
    wordsCompleted: number;
    totalWords: 100;
    progress: number; // 0-100%
  }>;
}

// Решенные кроссворды (для предотвращения дубликатов)
interface SolvedCrosswords {
  ids: string[];
}
```

**Ключи LocalStorage:**
```
umnyaut_user_profile
umnyaut_user_stats
umnyaut_game_history
umnyaut_theme_progress
umnyaut_solved_crosswords
umnyaut_current_game_state  // Для возобновления незавершенной игры
```

**Утилиты для работы с LocalStorage:**
```typescript
// lib/storage.ts
export const storage = {
  get: <T>(key: string): T | null => { /* ... */ },
  set: <T>(key: string, value: T): void => { /* ... */ },
  remove: (key: string): void => { /* ... */ },
  clear: (): void => { /* ... */ }
};
```

---

### Будущая реализация: Supabase

**Сервисы Supabase:**

1. **Authentication**
   - Email/Password
   - Google OAuth
   - Автоматическое создание профиля

2. **Database (PostgreSQL)**
   - Таблицы:
     ```sql
     users (
       id uuid primary key,
       email text,
       name text,
       avatar_url text,
       created_at timestamp
     )
     
     user_stats (
       user_id uuid references users,
       total_games int,
       total_points int,
       level int,
       streak int,
       last_played_date date
     )
     
     game_history (
       id uuid primary key,
       user_id uuid references users,
       game_type text,
       category text,
       difficulty text,
       score int,
       time_seconds int,
       hints_used int,
       completed_at timestamp,
       grid_state jsonb
     )
     
     theme_progress (
       user_id uuid references users,
       theme_id text,
       words_completed int,
       total_words int,
       primary key (user_id, theme_id)
     )
     
     solved_crosswords (
       user_id uuid references users,
       crossword_id text,
       solved_at timestamp
     )
     ```

3. **Storage**
   - Аватары пользователей
   - Словари для игр
   - Статические ресурсы

4. **Realtime (будущее)**
   - Мультиплеерные челленджи
   - Таблица лидеров в реальном времени

**Миграция с LocalStorage на Supabase:**
```typescript
// lib/migrate.ts
async function migrateToSupabase(userId: string) {
  const localData = {
    profile: storage.get('umnyaut_user_profile'),
    stats: storage.get('umnyaut_user_stats'),
    history: storage.get('umnyaut_game_history'),
    progress: storage.get('umnyaut_theme_progress'),
  };
  
  // Отправка данных в Supabase
  await supabase.from('users').insert(localData.profile);
  await supabase.from('user_stats').insert(localData.stats);
  // ... и т.д.
}
```

---

## Архитектура игровых модулей

### Принцип модульности

Каждая игра - **независимый модуль** с собственными:
- Компонентами UI
- Бизнес-логикой
- API endpoints
- Типами данных
- Стейт-менеджментом

**Структура игрового модуля:**
```
components/games/crossword/
├── index.tsx                  # Точка входа модуля
├── CrosswordGame.tsx          # Главный компонент игры
├── components/
│   ├── Grid.tsx              # Сетка кроссворда
│   ├── QuestionPanel.tsx     # Панель вопросов
│   ├── Timer.tsx             # Таймер
│   └── HintModal.tsx         # Модальное окно подсказок
├── hooks/
│   ├── useCrossword.ts       # Логика игры
│   ├── useTimer.ts           # Логика таймера
│   └── useHints.ts           # Логика подсказок
├── types/
│   └── crossword.types.ts    # TypeScript типы
├── utils/
│   ├── validators.ts         # Валидация ответов
│   └── scoring.ts            # Подсчет очков
└── constants/
    └── settings.ts           # Настройки игры
```

**Интерфейс для всех игр:**
```typescript
// types/game.types.ts
interface Game {
  id: string;
  type: 'crossword' | 'sudoku' | 'anagram'; // и т.д.
  name: string;
  icon: string;
  available: boolean;
}

interface GameSession {
  gameId: string;
  startedAt: Date;
  endedAt?: Date;
  score: number;
  completed: boolean;
}

interface GameModule {
  Game: React.ComponentType<GameProps>;
  Settings: React.ComponentType<SettingsProps>;
  Results: React.ComponentType<ResultsProps>;
}
```

**Регистрация игр:**
```typescript
// lib/games/registry.ts
export const gameRegistry: Record<string, GameModule> = {
  crossword: {
    Game: CrosswordGame,
    Settings: CrosswordSettings,
    Results: CrosswordResults,
  },
  // Будущие игры добавляются здесь
  // sudoku: { ... },
  // anagram: { ... },
};
```

---

## State Management

### Zustand для глобального стейта

**Сторы:**

```typescript
// stores/userStore.ts
interface UserStore {
  profile: UserProfile | null;
  stats: UserStats;
  setProfile: (profile: UserProfile) => void;
  updateStats: (stats: Partial<UserStats>) => void;
}

// stores/gameStore.ts
interface GameStore {
  currentGame: GameSession | null;
  isPlaying: boolean;
  startGame: (gameType: string) => void;
  endGame: (score: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
}

// stores/themeStore.ts
interface ThemeStore {
  themes: Theme[];
  activeThemes: Theme[];
  progress: ThemeProgress;
  addTheme: (themeId: string) => void;
  updateProgress: (themeId: string, words: number) => void;
}
```

---

## Структура проекта

```
umnyaut/
├── app/                        # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx               # Landing page
│   ├── onboarding/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── game/
│   │   └── [gameType]/
│   │       └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── api/                   # API routes (прокси для Python API)
│       └── proxy/
│           └── [...path]/
│               └── route.ts
├── components/
│   ├── ui/                    # shadcn компоненты
│   ├── layout/
│   ├── games/                 # Игровые модули
│   │   ├── crossword/
│   │   └── [future-games]/
│   └── shared/
├── lib/
│   ├── storage.ts             # LocalStorage утилиты
│   ├── api.ts                 # API клиент
│   ├── games/
│   │   └── registry.ts
│   └── utils.ts
├── stores/
│   ├── userStore.ts
│   ├── gameStore.ts
│   └── themeStore.ts
├── types/
│   ├── user.types.ts
│   ├── game.types.ts
│   └── api.types.ts
├── hooks/
│   ├── useLocalStorage.ts
│   ├── useTimer.ts
│   └── useGameSession.ts
├── styles/
│   ├── globals.css
│   └── themes/
├── public/
│   ├── images/
│   └── icons/
├── python-api/                # Python backend
│   ├── main.py
│   ├── games/
│   └── data/
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Деплой

### Frontend (Next.js)

**Vercel** (рекомендуется)
- Автоматический деплой из Git
- Serverless functions для API routes
- CDN для статических файлов
- Автоматический SSL

**Альтернативы:**
- Netlify
- Railway
- Cloudflare Pages

---

### Backend (Python API)

**Railway** (рекомендуется)
- Простой деплой Python приложений
- Автоматический SSL
- Легкая интеграция с GitHub

**Альтернативы:**
- Render
- Fly.io
- DigitalOcean App Platform
- AWS Lambda (для serverless)

---

### База данных (Supabase)

**Supabase Cloud**
- Бесплатный tier для старта
- Автоматические бэкапы
- Встроенный Auth и Storage
- Web интерфейс для управления

---

## Переменные окружения

```bash
# .env.local

# API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=your_api_key

# Supabase (будущее)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Analytics (опционально)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Environment
NODE_ENV=development
```

---

## Скрипты разработки

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    
    "api:dev": "cd python-api && uvicorn main:app --reload",
    "api:test": "cd python-api && pytest",
    
    "dev:all": "concurrently \"npm run dev\" \"npm run api:dev\""
  }
}
```

---

## Зависимости

### Frontend (package.json)

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "typescript": "^5.x",
    
    "tailwindcss": "^3.x",
    "@tailwindcss/forms": "^0.5.x",
    "@tailwindcss/typography": "^0.5.x",
    "tailwindcss-animate": "^1.x",
    
    "framer-motion": "^10.x",
    "lucide-react": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    
    "zustand": "^4.x",
    "date-fns": "^3.x",
    "recharts": "^2.x",
    "react-confetti": "^6.x",
    
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^2.x",
    "@radix-ui/react-tabs": "^1.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "eslint": "^8.x",
    "eslint-config-next": "^14.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x"
  }
}
```

---

### Backend (requirements.txt)

```txt
fastapi==0.104.0
uvicorn[standard]==0.24.0
pydantic==2.4.0
python-dotenv==1.0.0
httpx==0.25.0

# Для кроссвордов
numpy==1.26.0
python-constraint==1.4.0

# Тестирование
pytest==7.4.0
pytest-asyncio==0.21.0
```

---

## Безопасность

### Frontend
- XSS защита через React
- CSRF токены для форм
- Content Security Policy (CSP)
- Валидация на клиенте + сервере

### Backend
- CORS настройки
- Rate limiting
- Input validation (Pydantic)
- API key authentication

### LocalStorage
- Шифрование чувствительных данных
- Проверка целостности данных
- Очистка при logout

---

## Мониторинг и аналитика

### Текущий MVP
- Google Analytics 4
- Vercel Analytics
- Console logs для отладки

### Будущее
- Sentry для error tracking
- PostHog для product analytics
- Custom dashboard для метрик игр

---

## Тестирование

### Frontend
- **Jest** + **React Testing Library** для unit тестов
- **Playwright** для E2E тестов
- **Storybook** для UI компонентов (опционально)

### Backend
- **pytest** для unit и integration тестов
- Тестовое покрытие > 80%

---

## Производительность

### Оптимизация
- Next.js Image Optimization
- Code splitting по роутам
- Lazy loading для игровых модулей
- Memoization для тяжелых вычислений
- Service Worker для offline режима (PWA)

### Метрики
- Lighthouse Score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s

---

## Roadmap технологий

### MVP (v1.0) - Текущее
- ✅ Next.js + Tailwind + shadcn
- ✅ LocalStorage для данных
- ✅ Python API для кроссвордов

### v1.1
- 🔄 Supabase интеграция
- 🔄 Google OAuth
- 🔄 Миграция данных из LocalStorage

### v2.0
- 📋 Новые игровые модули
- 📋 Realtime features
- 📋 PWA с offline режимом
- 📋 Mobile приложения (React Native / Flutter)

---

Документ создан: 03.02.2026
Версия: 1.0.0
