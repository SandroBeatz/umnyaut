'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, User, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { useAppContext } from '@/app/AppContext';

const navLinks = [
  { label: 'Игры', href: '/games' },
  { label: 'О проекте', href: '/about' },
  { label: 'Контакты', href: '/contacts' },
];

const PublicHeader: React.FC = () => {
  const { profile } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        {/* Desktop: Auth section */}
        <div className="hidden md:block">
          {profile ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-white border-2 border-white shadow-md hover:scale-105 transition-transform overflow-hidden"
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-slate-200">
                    <p className="font-bold text-slate-900 text-sm">{profile.username}</p>
                  </div>
                  <div className="p-1.5">
                    <a
                      href="/p/dashboard"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-500" />
                      Дашборд
                    </a>
                    <a
                      href="/p/settings"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      Настройки
                    </a>
                    <a
                      href="/auth/logout"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      Выйти
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/auth/onboarding"
              className="inline-flex px-5 py-2 bg-stone-800 text-white rounded-xl text-sm font-bold hover:bg-stone-700 transition-colors"
            >
              Войти
            </a>
          )}
        </div>

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
          {profile ? (
            <div className="mt-3 space-y-1">
              <a
                href="/p/dashboard"
                className="block text-center px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-bold hover:bg-stone-700 transition-colors"
              >
                Дашборд
              </a>
              <a
                href="/auth/logout"
                className="block text-center px-5 py-2.5 text-red-600 text-sm font-bold hover:bg-red-50 rounded-xl transition-colors"
              >
                Выйти
              </a>
            </div>
          ) : (
            <a
              href="/auth/onboarding"
              className="mt-3 block text-center px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-bold hover:bg-stone-700 transition-colors"
            >
              Войти
            </a>
          )}
        </nav>
      )}
    </header>
  );
};

export default PublicHeader;
