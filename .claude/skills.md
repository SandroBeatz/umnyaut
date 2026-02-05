# Скилы Claude Code для Умняут

Скилы - это быстрые команды для типовых задач. Вызываются через `/skill-name`.

---

## /commit

**Описание:** Создать git коммит с описательным сообщением

**Использование:**
```
/commit
/commit -m "сообщение"
```

**Процесс:**
1. Проверить `git status`
2. Проанализировать изменённые файлы
3. Сформировать сообщение на русском по формату:
   - `feat:` - новая функциональность
   - `fix:` - исправление бага
   - `refactor:` - рефакторинг
   - `test:` - добавление/изменение тестов
   - `docs:` - документация
   - `style:` - форматирование, стили

**Пример:**
```bash
git add .
git commit -m "feat: Добавить автосохранение игры в localStorage"
```

---

## /new-component

**Описание:** Создать новый React компонент

**Использование:**
```
/new-component GameTimer
/new-component modals/HintModal
```

**Шаблон:**
```tsx
'use client';

import React from 'react';

interface ComponentNameProps {
  // props
}

export default function ComponentName({ }: ComponentNameProps) {
  return (
    <div className="">
      {/* content */}
    </div>
  );
}
```

**Правила:**
- Файл создаётся в `components/`
- PascalCase для имени
- 'use client' для интерактивных компонентов
- Tailwind для стилей

---

## /new-page

**Описание:** Создать новую страницу App Router

**Использование:**
```
/new-page profile
/new-page leaderboard
```

**Создаёт:**
- `app/<route>/page.tsx`

**Шаблон:**
```tsx
'use client';

import { useContext } from 'react';
import { AppContext } from '../AppContext';
import Layout from '@/components/Layout';

export default function PageName() {
  const { profile, loading } = useContext(AppContext);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <Layout>
      <div className="p-6">
        {/* content */}
      </div>
    </Layout>
  );
}
```

---

## /add-test

**Описание:** Добавить Vitest тест

**Использование:**
```
/add-test types.ts
/add-test components/Dashboard
```

**Шаблон:**
```typescript
import { describe, it, expect } from 'vitest';
// imports...

describe('ModuleName', () => {
  describe('functionName', () => {
    it('should do something', () => {
      // arrange
      const input = ...;

      // act
      const result = functionName(input);

      // assert
      expect(result).toBe(expected);
    });
  });
});
```

**Для React компонентов:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

---

## /fix-lint

**Описание:** Исправить все ошибки линтера

**Использование:**
```
/fix-lint
```

**Выполняет:**
```bash
npm run lint -- --fix
npm run format
```

**Автоматически исправляет:**
- Отступы и пробелы
- Порядок импортов
- Неиспользуемые переменные (предупреждения)
- Стиль кавычек
- Точки с запятой

---

## /check-all

**Описание:** Полная проверка проекта

**Использование:**
```
/check-all
```

**Последовательность:**
1. `npm run lint` - ESLint проверка
2. `npx tsc --noEmit` - TypeScript проверка типов
3. `npm test` - Vitest тесты
4. `npm run build` - Production сборка

**Успешно если:** Все 4 шага прошли без ошибок

---

## /analyze-component

**Описание:** Детальный анализ компонента

**Использование:**
```
/analyze-component CrosswordGame
/analyze-component Dashboard
```

**Анализирует:**
1. **Структура**
   - Размер файла (строки кода)
   - Импорты и зависимости
   - Экспорты

2. **Props и State**
   - Интерфейсы пропсов
   - Использование useState/useContext
   - Управление формами

3. **Побочные эффекты**
   - useEffect хуки
   - Вызовы API
   - localStorage операции

4. **Рендеринг**
   - Условный рендеринг
   - Списки и ключи
   - Модальные окна

5. **Рекомендации**
   - Возможные оптимизации
   - Проблемы accessibility
   - Нарушения конвенций

---

## /dev

**Описание:** Запустить dev сервер

**Использование:**
```
/dev
```

**Выполняет:**
```bash
npm run dev
```

Сервер запускается на `http://localhost:3000`

---

## /api-status

**Описание:** Проверить статус внешнего API

**Использование:**
```
/api-status
```

**Проверяет:**
- Доступность Railway сервера
- Время ответа (cold start)
- Эндпоинты `/categories` и `/crossword`
