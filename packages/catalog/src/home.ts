/** Home page strings. Until the first tools go live the home page is a "coming soon" stub. */
export const comingSoon = {
  badge: "Скоро открытие",
  titleLead: "Одна комната —",
  titleAccent: "весь список покупок",
  lead: "Введите размеры один раз — получите проверенный список покупок для всего ремонта: в пачках, рулонах и мешках.",
  mascotAlt: "Кот Умняут в рабочем комбинезоне машет лапой и держит чертёж",
  bubble: "Готовлю калькуляторы. Скоро всё посчитаем",
  features: [
    {
      icon: "package",
      title: "Сразу в упаковках",
      text: "Не «22,14 м²», а «10 пачек» — с запасом, подложкой и плинтусом.",
    },
    {
      icon: "ruler",
      title: "Размеры один раз",
      text: "Комната вводится один раз и подходит к полу, стенам и потолку.",
    },
    {
      icon: "check",
      title: "Проверенные формулы",
      text: "Каждый расчёт с объяснением, источником нормы и примерами.",
    },
  ],
  markets: "Россия · Казахстан · Беларусь · Кыргызстан",
} as const;

export type FeatureIcon = (typeof comingSoon.features)[number]["icon"];
