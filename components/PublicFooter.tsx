'use client';

import React from 'react';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

const PublicFooter: React.FC = () => {
  return (
    <footer className="border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Logo, Name, and Copyright */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Умняут"
              className="w-8 h-8 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-lg font-game font-bold text-stone-800">Умняут</span>
              <span className="text-xs text-stone-500">&copy; 2025 &laquo;Умняут&raquo;. Все права защищены</span>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <nav className="flex gap-6">
            <a
              href="/about"
              className="text-stone-600 hover:text-orange-500 transition-colors text-sm"
            >
              О проекте
            </a>
            <a
              href="/contacts"
              className="text-stone-600 hover:text-orange-500 transition-colors text-sm"
            >
              Контакты
            </a>
            <a
              href="/privacy"
              className="text-stone-600 hover:text-orange-500 transition-colors text-sm"
            >
              Политика
            </a>
          </nav>

          {/* Right: Social Media */}
          <div className="flex gap-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-600 hover:text-orange-500 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-600 hover:text-orange-500 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-600 hover:text-orange-500 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="mailto:info@umnyaut.ru"
              className="text-stone-600 hover:text-orange-500 transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
