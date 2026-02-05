# Конфигурация Claude Code

Эта директория содержит конфигурацию для Claude Code (claude.ai/code) в проекте Умняут.

## Файлы

| Файл | Описание |
|------|----------|
| `project.json` | Основная конфигурация: описание проекта, команды, агенты, скилы |
| `agents.md` | Детальные инструкции для агентов |
| `skills.md` | Документация по скилам (быстрым командам) |

## Быстрый старт

### Команды
```bash
npm run dev       # Dev сервер
npm run build     # Production сборка
npm run lint      # ESLint
npm run format    # Prettier
npm test          # Vitest
```

### Скилы
```
/commit              # Создать коммит
/new-component Name  # Новый компонент
/new-page route      # Новая страница
/add-test file       # Добавить тест
/fix-lint            # Исправить линтер
/check-all           # Полная проверка
```

### Агенты

- **test-runner** - запуск и анализ тестов
- **build-validator** - проверка сборки
- **lint-fixer** - исправление стиля кода
- **api-debugger** - отладка Railway API
- **component-analyzer** - анализ компонентов
- **state-inspector** - анализ состояния

## Структура проекта

```
umnyaut/
├── app/                    # Страницы (App Router)
│   ├── dashboard/          # Главный экран
│   ├── game/               # Игра кроссворд
│   ├── onboarding/         # Онбординг
│   ├── settings/           # Настройки
│   ├── AppContext.tsx      # Глобальное состояние
│   └── layout.tsx          # Корневой layout
├── components/             # React компоненты
├── types.ts                # TypeScript типы
├── crosswordApi.ts         # API клиент
└── .claude/                # Эта директория
```

## Конвенции

- **Компоненты**: 'use client', PascalCase, Tailwind CSS
- **Состояние**: AppContext для глобального, localStorage для персистенции
- **Коммиты**: На русском, формат `тип: описание`
- **API**: Retry с exponential backoff, таймауты 30-45с
