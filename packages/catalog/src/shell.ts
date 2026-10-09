/**
 * Russian strings of the site frame and CalculatorShell (design spec §11–16). `{name}` placeholders are
 * replaced by the UI with formatted values.
 */
export const shell = {
  header: {
    home: "Умняут — на главную",
    menu: "Меню",
    menuTitle: "Разделы",
    calculators: "Калькуляторы",
    country: "Страна и валюта",
  },
  close: "Закрыть",
  breadcrumbs: { label: "Навигация", home: "Главная", back: "Назад" },
  footer: {
    categories: "Калькуляторы",
    country: "Страна",
    note: "Расчёты в целых упаковках. Цены — ориентир, проверяйте в магазине.",
  },
  country: {
    title: "Страна",
    description: "От страны зависят валюта и типовые цены",
  },
  roomBar: {
    label: "Моя комната",
    empty: "Ввести размеры один раз",
    edit: "Изменить",
    sheetTitle: "Моя комната",
    sheetDescription: "Размеры подставятся во все калькуляторы на этом устройстве",
    length: "Длина",
    width: "Ширина",
    height: "Высота потолка",
    save: "Сохранить комнату",
    clear: "Другая комната",
  },
  form: {
    units: "Единицы",
    unitLabels: { m: "м", cm: "см" },
    more: "Ещё параметры",
    less: "Свернуть параметры",
    range: "От {min} до {max} {unit}",
    required: "Введите значение",
    fromRoom: "Из «Моей комнаты»",
    decrement: "Меньше",
    increment: "Больше",
  },
  openings: {
    door: "Дверь",
    window: "Окно",
    addDoor: "Дверь",
    addWindow: "Окно",
    width: "Ширина",
    height: "Высота",
    count: "Количество",
    remove: "Убрать",
    empty: "Окон и дверей нет",
    /** Size limits and row cap of the calc schema, mm. */
    limits: { minMm: 100, maxMm: 10_000, rows: 20 },
    /** Typical sizes the add buttons insert, mm. */
    defaults: {
      door: { widthMm: 800, heightMm: 2000 },
      window: { widthMm: 1200, heightMm: 1400 },
    },
  },
  result: {
    region: "Результат расчёта",
    buy: "Нужно купить",
    measure: "Получилось",
    example: "Это пример. Введите свои размеры",
    stale: "По прошлым значениям — исправьте поле с ошибкой",
    need: "{need} · останется {leftover}",
    /** Packs sold by volume or weight: which sizes to take instead of the need («1 × 9 л + 1 × 2,7 л»). */
    set: "{set} · останется {leftover}",
    each: "по {size}",
    total: "Итого {total}",
    perM2: "{price} за м²",
    missing: "без {count} {positions}",
    positions: { one: "позиции", few: "позиций", many: "позиций" },
    related: "Ещё понадобится",
  },
  warningsTitle: "Обратите внимание",
  disclaimer: "Расчёт ориентировочный. Монтаж выполняет специалист с допуском, по проекту и нормам.",
  howCalculated: {
    title: "Как посчитано",
    sources: "Источники норм",
    geometry: "Только геометрия: формулы площади и периметра, без норм расхода",
    checked: "Проверено {date}",
    report: "Сообщить об ошибке",
  },
  actions: {
    save: "Сохранить",
    saveSoon: "Сохранение появится скоро",
    share: "Отправить",
    copy: "Скопировать",
    print: "Печать",
    copied: "Расчёт скопирован",
    linkCopied: "Ссылка скопирована",
    copyFailed: "Не получилось скопировать",
  },
  share: {
    title: "{tool} — расчёт",
    link: "Открыть расчёт: {url}",
  },
  nextSteps: {
    title: "Дальше по ремонту",
    carried: "Размеры уже подставлены",
  },
  reportError: {
    title: "Сообщить об ошибке",
    description: "К сообщению приложим введённые размеры и версию формулы",
    label: "Что не так",
    placeholder: "Например: в магазине сказали, что нужно больше",
    send: "Отправить",
    soon: "Отправка заработает в ближайшем обновлении. Спасибо, что заметили",
  },
  sticky: { toResult: "К результату" },
  print: {
    heading: "Список покупок",
    item: "Позиция",
    pack: "Фасовка",
    quantity: "Количество",
    price: "Цена",
    sum: "Сумма",
    room: "Комната",
    date: "Дата расчёта",
    link: "Расчёт онлайн",
  },
  category: {
    tools: "Калькуляторы раздела",
  },
  faq: "Вопросы и ответы",
} as const;

/** Header and footer navigation. Planner, «Мои расчёты» and info pages join once their routes exist. */
export const navigation = {
  infoPages: [] as readonly { href: string; label: string }[],
} as const;
