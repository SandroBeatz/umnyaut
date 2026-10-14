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
    /** The estimate button (spec «Шапка и футер»); the sum is added after mount. */
    estimate: "Смета",
    methodology: "Методика",
  },
  close: "Закрыть",
  breadcrumbs: { label: "Навигация", home: "Главная", back: "Назад" },
  footer: {
    categories: "Калькуляторы",
    about: "О сервисе",
    country: "Страна",
    note: "Расчёты в целых упаковках. Цены — ориентир, проверяйте в магазине.",
    cookies: "Настройки cookie",
  },
  /** Strict consent (business spec §12): Metrika loads only after «Принять». */
  consent: {
    label: "Cookie",
    text: "Метрика и cookie — только с согласия.",
    more: "Подробнее",
    accept: "Принять",
    decline: "Отклонить",
  },
  country: {
    title: "Страна",
    description: "От страны зависят валюта и типовые цены",
  },
  roomBar: {
    edit: "Изменить",
    /** Sizes typed right in the row while the page has no room yet (spec «Калькулятор»). */
    sizes: {
      lengthMm: { label: "Длина комнаты", caption: "Длина, {unit}" },
      widthMm: { label: "Ширина комнаты", caption: "Ширина, {unit}" },
      heightMm: { label: "Высота потолка", caption: "Высота, {unit}" },
    },
    /** Opens the room editor from the size fields. */
    editor: "Форма, окна и двери",
    /** Room picker: the estimate's rooms (spec «Калькулятор», P17.7). */
    noSizes: "Размеры не заданы",
    pickTitle: "Комнаты",
    pickDescription: "Калькулятор считает одну комнату. Размеры подставятся сами",
    pickLabel: "{room}, {dimensions}. Выбрать другую комнату",
    newRoom: "Новая комната",
    /** The tool is already counted in that room: «плитка есть». */
    counted: "{tool} есть",
  },
  form: {
    /** The form card's heading (with the м/см switch beside it). */
    title: "Размеры и материал",
    titleSizes: "Размеры",
    units: "Единицы",
    unitLabels: { m: "м", cm: "см" },
    more: "Ещё параметры",
    less: "Свернуть параметры",
    range: "От {min} до {max} {unit}",
    required: "Введите значение",
    fromRoom: "Из «Моей комнаты»",
    /** Hint under a price field from the country's typical prices. */
    typicalPrice: "Обычно около {price}, проверено {date}",
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
    /** Closed card summary: «80 × 200 см · 1 шт.». */
    size: "{width} × {height} {unit} · {count} шт.",
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
    /** Running-metre goods (linoleum): the roll width and the bought area. */
    running: "ширина {width} · {area}",
    width: "ширина {size}",
    total: "Итого {total}",
    perM2: "{price} за м²",
    /** A main item priced per m² or litre: «21,75 м² по 350 сом». */
    unitPrice: "{amount} по {price}",
    missing: "без {count} {positions}",
    positions: { one: "позиции", few: "позиций", many: "позиций" },
    related: "Ещё понадобится",
    /** Shared consumables with the estimate (spec «Калькулятор»): quantities for the whole estimate. */
    relatedEstimate: "Ещё понадобится · на всю смету",
    /** «Нужно купить · Ванная». */
    buyIn: "{buy} · {room}",
    /** This calc's share of a shared consumable: «Ванная: 104,6 кг». */
    share: "{room}: {need}",
    saving: "{item} на всю смету: {total} вместо {instead}",
    savingWith: "{item} на всю смету: {total} вместо {instead} — общий с «{rooms}»",
  },
  /** Names the estimate gives itself and its rooms until the user renames them (spec «Комнаты и смета»). */
  estimate: {
    name: "Ремонт квартиры",
    room: "Комната {n}",
  },
  /** Room editor (spec «Редактор комнаты», P17.8): popup from 1024 px, bottom sheet on the phone. */
  roomEditor: {
    title: "Комната",
    newTitle: "Новая комната",
    description: "Размеры, окна и двери вводятся один раз для всех расчётов этой комнаты",
    name: "Название",
    type: "Тип — подскажет нужные расчёты",
    types: {
      living: "Зал",
      bedroom: "Спальня",
      kitchen: "Кухня",
      bathroom: "Ванная",
      hall: "Прихожая",
      other: "Другое",
    },
    sizes: "Форма и размеры",
    shape: "Форма комнаты",
    shapes: { rect: "Прямоугольная", l: "Г-образная" },
    length: "Длина",
    width: "Ширина",
    height: "Высота потолка",
    cutLength: "Вырез по длине",
    cutWidth: "Вырез по ширине",
    cutCorner: "Где вырез на плане",
    corners: { ne: "Справа вверху", se: "Справа внизу", sw: "Слева внизу", nw: "Слева вверху" },
    openings: "Окна и двери",
    /** Closed card summary: «80 × 200 см · стена 1, от угла 30 см». */
    openingAt: "{size} · {place}",
    plan: "План комнаты",
    needSizes: "Введите длину и ширину — появится план",
    floor: "Пол",
    perimeter: "Периметр",
    walls: "Стены без проёмов",
    ceiling: "Потолок",
    recalc: "Пересчитаем расчёты этой комнаты: {tools}",
    /** A wall-bound parameter reset because the walls are numbered anew (Р10). */
    reset: "{tool}: сбросим {what}",
    cancel: "Отмена",
    save: "Сохранить комнату",
    remove: "Удалить комнату",
    removeConfirm: "Удалить комнату вместе с расчётами: {tools}?",
    removeYes: "Да, удалить комнату",
  },
  /** Calcs of one tool in a room (spec «Несколько расчётов», P17.9). */
  calcs: {
    /** Row label: «Плитка в комнате:». */
    title: "{tool}:",
    /** A chip without a label or a surface: «Расчёт 2». */
    unnamed: "Расчёт {n}",
    more: "Ещё",
    moreLabel: "Ещё расчёт: {tool}",
    open: "Открыть расчёт «{calc}»",
    remove: "Убрать расчёт «{calc}»",
    removed: "Расчёт убран",
    undo: "Вернуть",
    label: "Метка",
    labelHint: "Например, «белая глянцевая» — видна в смете",
    parts: { floor: "Пол", walls: "Стены", ceiling: "Потолок" },
    /** «Пол уже в расчёте «Плитка: Пол и стены».» */
    overlap: "{parts} уже в расчёте «{calc}».",
    split: "Разделить на два расчёта?",
    splitButton: "Разделить",
  },
  /** «Добавить в смету» → «В смете»; after edits «Обновить в смете» (spec Р4: only by the button). */
  toEstimate: {
    add: "Добавить в смету",
    added: "В смете",
    addedToast: "Добавлено в смету",
    update: "Обновить в смете",
    updatedToast: "Смета обновлена",
  },
  /** Room plan editor (popup): doors and windows on walls, docs/ui/room-plan-and-layout-guides.md. */
  plan: {
    open: "Отметить на плане",
    edit: "Изменить план",
    title: "План комнаты",
    description: "Укажите, на какой стене дверь и окна. Стены пронумерованы по часовой стрелке",
    wall: "Стена {n}",
    wallLabel: "Стена",
    offset: "От левого угла",
    offsetHint: "Если смотреть на стену из комнаты",
    unplaced: "Не отмечено на плане",
    /** Closed card summary: «Стена 2 · 120 см от угла». */
    placedAt: "{wall} · {offset} от угла",
    none: "Сначала добавьте дверь или окно",
    done: "Готово",
    summary: "Отмечено: {placed} из {total}",
    sill: "Высота от пола",
    sillHint: "До низа окна, обычно 80–90 см",
    /** Closed window card summary with the sill: «Стена 4 · 155 см от угла · 90 см от пола». */
    sillAt: "{sill} от пола",
    bareBelow: "Под окном не клеим",
    bareBelowAt: "под окном без обоев",
    zones: "Зоны без обоев",
    zonesHint: "За шкафом, у кондиционера — только то, что точно не клеите",
    zone: "Зона без обоев",
    zoneAt: "{wall} · {offset} от угла · {width} × {height}",
    addZone: "Зона без обоев",
    removeZone: "Убрать зону",
    zoneWidth: "Ширина",
    zoneHeight: "Высота",
    zoneFromFloor: "От пола",
    planLabel: "План комнаты {length} × {width} {unit}",
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
  sticky: { toResult: "К результату", toEstimate: "К смете" },
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
    steps: "Порядок работ",
    step: "Шаг {n}",
    or: "или",
  },
  faq: "Вопросы и ответы",
  notFound: {
    title: "Такой страницы нет",
    lead: "Возможно, ссылка устарела или в адресе опечатка. Вот что считают чаще всего:",
    home: "На главную",
    mascotAlt: "Кот Умняут растерянно разводит лапами",
    metaTitle: "Страница не найдена",
  },
  info: {
    updated: "Обновлено {date}",
    mascotAlt: "Кот Умняут в рабочем комбинезоне машет лапой",
  },
} as const;

/** Header and footer navigation. Planner and «Мои расчёты» join once their routes exist. */
export const navigation = {
  infoPages: [
    { href: "/metodika/", label: "Методика" },
    { href: "/o-proekte/", label: "О проекте" },
    { href: "/kontakty/", label: "Контакты" },
    { href: "/partneram/", label: "Партнёрам" },
    { href: "/politika/", label: "Политика конфиденциальности" },
  ] as readonly { href: string; label: string }[],
} as const;

/** «Методика»: the norm table built from catalog norms (sources and dates are data, not text). */
export const methodology = {
  norms: "Нормы и источники",
  normsLead:
    "Каждое число, которое не следует из геометрии, взято из паспорта материала, ГОСТа или инструкции производителя.",
  norm: "Норма",
  value: "Значение",
  source: "Источник",
  checked: "Проверено",
  unconfirmed: "Типовое значение — проверьте по этикетке",
  other: "Другие нормы",
} as const;
