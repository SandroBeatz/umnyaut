'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Игры', href: '/game' },
  { label: 'О проекте', href: '/about' },
  { label: 'Блог', href: '/blog' },
  { label: 'Контакты', href: '/contact' },
];

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Умняут" className="w-9 h-9 object-contain" />
          <span className="text-xl font-game font-bold text-stone-800">Умняут</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Главная навигация">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-stone-600 hover:text-orange-500 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Login button (desktop) */}
        <a
          href="/onboarding"
          className="hidden md:inline-flex px-5 py-2 bg-stone-800 text-white rounded-xl text-sm font-bold hover:bg-stone-700 transition-colors"
        >
          Войти
        </a>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-stone-600 hover:text-orange-500 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden border-t border-slate-100 bg-white px-4 pb-4"
          aria-label="Мобильная навигация"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-3 text-sm font-semibold text-stone-600 hover:text-orange-500 transition-colors border-b border-slate-50 last:border-0"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/onboarding"
            className="mt-3 block text-center px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-bold hover:bg-stone-700 transition-colors"
          >
            Войти
          </a>
        </nav>
      )}
    </header>
  );
};

export default Header;
