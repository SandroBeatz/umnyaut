# Агенты Claude Code для Умняут

Этот файл содержит детальные инструкции для специализированных агентов проекта.

## test-runner

**Назначение:** Запуск и анализ тестов Vitest

**Когда использовать:**
- После написания нового кода
- При изменении существующей логики
- Перед созданием коммита

**Инструкции:**
```bash
npm test
```

**Действия при ошибках:**
1. Прочитать вывод упавших тестов
2. Найти соответствующий файл теста (*.test.ts)
3. Проанализировать причину падения
4. Исправить код или тест
5. Перезапустить тесты

**Ключевые файлы:**
- `vitest.config.ts` - конфигурация
- `vitest.setup.ts` - настройка окружения
- `types.test.ts` - пример тестов

---

## build-validator

**Назначение:** Проверка production сборки

**Когда использовать:**
- Перед созданием PR
- После крупных изменений
- При проблемах с типами

**Инструкции:**
```bash
npm run build
```

**Типичные проблемы и решения:**

| Ошибка | Решение |
|--------|---------|
| Type error | Проверить types.ts, добавить типы |
| Module not found | Проверить импорты и пути |
| 'use client' missing | Добавить директиву к клиентским компонентам |
| Build timeout | Проверить бесконечные циклы |

---

## lint-fixer

**Назначение:** Проверка и исправление стиля кода

**Инструкции:**
```bash
# Проверка
npm run lint

# Форматирование
npm run format
```

**Конфигурации:**
- `eslint.config.mjs` - правила ESLint
- `.prettierrc` - настройки Prettier

**Автоисправление:**
Большинство ошибок форматирования исправляются автоматически через Prettier.

---

## api-debugger

**Назначение:** Отладка интеграции с Railway API

**Ключевой файл:** `crosswordApi.ts`

**Особенности API:**
- Cold start delays до 30-45 секунд
- Retry логика с exponential backoff
- Обработка таймаутов через AbortController

**Эндпоинты:**
- `POST /categories` - получение категорий (timeout: 30s)
- `POST /crossword` - генерация кроссворда (timeout: 45s)

**Коды ошибок:**
- `CATEGORY_NOT_FOUND` - категория не найдена
- `TOO_MANY_REQUESTS` - превышен лимит запросов
- `SERVER_UNREACHABLE` - сервер недоступен
- `GENERATION_TIMEOUT` - таймаут генерации

---

## component-analyzer

**Назначение:** Анализ React компонентов

**Чек-лист проверки:**

1. **Директивы**
   - [ ] 'use client' для интерактивных компонентов
   - [ ] Правильный экспорт (default/named)

2. **Состояние**
   - [ ] Использование AppContext для глобальных данных
   - [ ] useState для локального состояния
   - [ ] Правильная обработка loading состояний

3. **Производительность**
   - [ ] Мемоизация тяжёлых вычислений
   - [ ] Избегание лишних ре-рендеров
   - [ ] Ленивая загрузка где нужно

4. **Accessibility**
   - [ ] ARIA атрибуты для интерактивных элементов
   - [ ] Семантические HTML теги
   - [ ] Поддержка клавиатуры

5. **Стили**
   - [ ] Tailwind классы вместо inline styles
   - [ ] Mobile-first responsive дизайн
   - [ ] Использование CSS переменных для цветов

---

## state-inspector

**Назначение:** Анализ управления состоянием

**Архитектура состояния:**

```
AppContext (глобальный)
├── profile: UserProfile | null
├── setProfile()
├── saveProfile() → localStorage
└── loading: boolean

localStorage
├── umnyaut_profile (профиль)
└── umnyaut_current_game_state (сохранённая игра)

sessionStorage
└── currentCrossword (текущий кроссворд)
```

**Структура UserProfile:**
```typescript
{
  username: string
  selectedCategories: string[]
  stats: {
    points: number
    level: number
    streak: number
    lastPlayed: string
    totalSolved: number
  }
  history: GameHistoryEntry[]
  solvedCrosswordIds: string[]
  themeProgress: Record<string, {...}>
}
```

**Миграции:**
При загрузке профиля автоматически добавляются недостающие поля для обратной совместимости.
