'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../AppContext';
import Sidebar from '@/components/Sidebar';
import Layout from '@/components/Layout';
import Header from '@/components/Header';

export default function PolicyPage() {
  const { profile } = useAppContext();
  const router = useRouter();

  const content = (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-game font-bold text-stone-800 mb-6">
        Политика конфиденциальности
      </h1>

      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 space-y-6 text-stone-700">
        <section>
          <p className="text-sm text-stone-500 mb-4">
            Дата последнего обновления: 7 февраля 2026 года
          </p>
          <p className="leading-relaxed">
            Добро пожаловать на платформу <strong>Умняут</strong> — веб-платформу для любителей
            головоломок и интеллектуальных игр на русском языке. Мы серьёзно относимся к защите
            вашей конфиденциальности и стремимся обеспечить прозрачность в отношении того, какие
            данные мы собираем и как их используем.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">1. Собираемые данные</h2>

          <h3 className="text-xl font-semibold text-stone-800 mb-2 mt-4">
            1.1. Данные при использовании без регистрации
          </h3>
          <p className="leading-relaxed mb-3">
            Если вы используете платформу без создания аккаунта, мы сохраняем следующую информацию
            локально в вашем браузере (localStorage):
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Имя пользователя (по вашему выбору)</li>
            <li>Игровой прогресс (решённые кроссворды, заработанные очки)</li>
            <li>Статистика игр (время решения, точность, серия ударного режима)</li>
            <li>Игровые настройки (выбранные темы, уровень сложности, звуковые эффекты)</li>
            <li>История игр</li>
          </ul>
          <p className="leading-relaxed mt-3 text-sm text-stone-600">
            ⚠️ <strong>Важно:</strong> Эти данные хранятся только на вашем устройстве и могут быть
            утеряны при очистке кэша браузера. Они не синхронизируются между устройствами.
          </p>

          <h3 className="text-xl font-semibold text-stone-800 mb-2 mt-4">
            1.2. Данные при регистрации через Google
          </h3>
          <p className="leading-relaxed mb-3">
            При регистрации через Google OAuth мы получаем и храним:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Имя пользователя (из профиля Google)</li>
            <li>Адрес электронной почты</li>
            <li>Аватар/фото профиля</li>
            <li>Уникальный идентификатор пользователя Google</li>
          </ul>
          <p className="leading-relaxed mt-3">
            Дополнительно мы сохраняем в облачном хранилище (Firebase):
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Весь игровой прогресс</li>
            <li>Статистику и достижения</li>
            <li>Настройки аккаунта</li>
            <li>Полную историю игр с детальной информацией</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">
            2. Как мы используем ваши данные
          </h2>
          <p className="leading-relaxed mb-3">
            Собранные данные используются исключительно для следующих целей:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Обеспечение функционала игры:</strong> Сохранение прогресса, отображение
              статистики, персонализация игрового опыта
            </li>
            <li>
              <strong>Синхронизация между устройствами:</strong> Для зарегистрированных
              пользователей — доступ к прогрессу с любого устройства
            </li>
            <li>
              <strong>Улучшение платформы:</strong> Анализ анонимных данных об использовании для
              оптимизации игрового процесса
            </li>
            <li>
              <strong>Коммуникация:</strong> Отправка уведомлений о ударном режиме (при включённой
              настройке) и важных обновлениях платформы
            </li>
            <li>
              <strong>Техническая поддержка:</strong> Помощь в решении проблем и ответы на запросы
              пользователей
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">3. Реклама</h2>
          <p className="leading-relaxed mb-3">
            Платформа <strong>Умняут</strong> использует рекламу для поддержания бесплатного доступа
            к играм. Мы придерживаемся следующих принципов:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Ненавязчивое размещение:</strong> Реклама не отображается во время активной
              игры
            </li>
            <li>
              <strong>Нативная интеграция:</strong> Рекламные блоки органично вписаны в дизайн
            </li>
            <li>
              <strong>Возможность вознаграждённой рекламы:</strong> Просмотр рекламы за бесплатные
              подсказки (опционально)
            </li>
          </ul>
          <p className="leading-relaxed mt-3">
            Рекламные партнёры могут использовать cookies и похожие технологии для показа
            релевантной рекламы. Мы не передаём рекламным партнёрам вашу личную информацию (имя,
            email).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">
            4. Третьи стороны и внешние сервисы
          </h2>
          <p className="leading-relaxed mb-3">
            Для работы платформы мы используем следующие сторонние сервисы:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Google OAuth:</strong> Для аутентификации пользователей (
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                политика конфиденциальности Google
              </a>
              )
            </li>
            <li>
              <strong>Firebase:</strong> Для облачного хранения данных зарегистрированных
              пользователей (
              <a
                href="https://firebase.google.com/support/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                политика конфиденциальности Firebase
              </a>
              )
            </li>
            <li>
              <strong>Рекламные сети:</strong> Для показа рекламных объявлений (политики
              конфиденциальности зависят от конкретных партнёров)
            </li>
          </ul>
          <p className="leading-relaxed mt-3">
            Мы рекомендуем ознакомиться с политиками конфиденциальности этих сервисов, так как они
            действуют независимо от нашей платформы.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">5. Безопасность данных</h2>
          <p className="leading-relaxed">
            Мы применяем разумные технические и организационные меры для защиты ваших данных от
            несанкционированного доступа, изменения, раскрытия или уничтожения. Это включает:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li>Шифрование передачи данных (HTTPS)</li>
            <li>Безопасное хранение данных в облаке (Firebase Security Rules)</li>
            <li>Регулярные проверки безопасности</li>
            <li>Ограниченный доступ к личным данным пользователей</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">6. Ваши права</h2>
          <p className="leading-relaxed mb-3">
            Вы имеете следующие права в отношении ваших данных:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Доступ к данным:</strong> Запросить копию всех данных, которые мы храним о вас
            </li>
            <li>
              <strong>Исправление данных:</strong> Изменить неточную или неполную информацию в
              настройках аккаунта
            </li>
            <li>
              <strong>Удаление данных:</strong> Запросить полное удаление вашего аккаунта и всех
              связанных данных через настройки аккаунта
            </li>
            <li>
              <strong>Экспорт данных:</strong> Получить копию ваших данных в машиночитаемом формате
              (функция доступна в настройках)
            </li>
            <li>
              <strong>Отзыв согласия:</strong> Отключить уведомления и прекратить использование
              платформы в любое время
            </li>
          </ul>
          <p className="leading-relaxed mt-3">
            Для реализации своих прав обратитесь к нам по адресу:
            <a href="mailto:privacy@umnyaut.ru" className="text-blue-600 hover:underline ml-1">
              privacy@umnyaut.ru
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">
            7. Cookies и локальное хранилище
          </h2>
          <p className="leading-relaxed">
            Мы используем localStorage (локальное хранилище браузера) для сохранения игрового
            прогресса у незарегистрированных пользователей и некоторых настроек интерфейса. Вы
            можете очистить эти данные через настройки браузера в любое время.
          </p>
          <p className="leading-relaxed mt-3">
            Рекламные партнёры могут использовать cookies для персонализации рекламы. Вы можете
            управлять cookies через настройки браузера.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">8. Дети</h2>
          <p className="leading-relaxed">
            Платформа <strong>Умняут</strong> предназначена для пользователей всех возрастов,
            включая детей. Мы не собираем личную информацию детей целенаправленно. Если вы родитель
            или опекун и считаете, что ваш ребёнок предоставил нам личную информацию, пожалуйста,
            свяжитесь с нами, и мы удалим такую информацию.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">
            9. Изменения в политике конфиденциальности
          </h2>
          <p className="leading-relaxed">
            Мы можем периодически обновлять эту политику конфиденциальности. О существенных
            изменениях мы уведомим вас через:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li>Уведомление на сайте</li>
            <li>Email (для зарегистрированных пользователей)</li>
            <li>Обновлённую дату в верхней части этого документа</li>
          </ul>
          <p className="leading-relaxed mt-3">
            Продолжая использовать платформу после изменений, вы соглашаетесь с обновлённой
            политикой.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">10. Контактная информация</h2>
          <p className="leading-relaxed mb-3">
            Если у вас есть вопросы, замечания или запросы относительно этой политики
            конфиденциальности или обработки ваших данных, свяжитесь с нами:
          </p>
          <div className="bg-stone-50 rounded-lg p-4 space-y-2">
            <p className="flex items-center gap-2">
              <strong>Email:</strong>
              <a href="mailto:privacy@umnyaut.ru" className="text-blue-600 hover:underline">
                privacy@umnyaut.ru
              </a>
            </p>
            <p className="flex items-center gap-2">
              <strong>Общие вопросы:</strong>
              <a href="mailto:info@umnyaut.ru" className="text-blue-600 hover:underline">
                info@umnyaut.ru
              </a>
            </p>
          </div>
        </section>

        <section className="border-t border-stone-200 pt-6">
          <p className="text-sm text-stone-500 italic">
            Используя платформу «Умняут», вы подтверждаете, что прочитали и поняли эту политику
            конфиденциальности и соглашаетесь с условиями сбора и использования ваших данных,
            описанными выше.
          </p>
        </section>
      </div>
    </div>
  );

  // If user is logged in, show with sidebar
  if (profile) {
    return (
      <>
        <Sidebar
          activeView="DASHBOARD"
          onViewChange={(view) => {
            if (view === 'SETTINGS') router.push('/settings');
            if (view === 'DASHBOARD') router.push('/dashboard');
            if (view === 'ABOUT') router.push('/about');
            if (view === 'STATISTICS') router.push('/statistics');
            if (view === 'GAME') router.push('/game');
          }}
          onLogoClick={() => router.push('/')}
          onAccountClick={() => router.push('/settings')}
          avatar={profile.avatar}
          username={profile.username}
        />
        <Layout stats={profile.stats}>{content}</Layout>
      </>
    );
  }

  // For non-logged-in users, show without sidebar
  return (
    <div className="min-h-screen bg-orange-50 text-stone-800">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">{content}</main>
    </div>
  );
}
