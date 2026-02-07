'use client';

import React from 'react';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

const DashboardFooter: React.FC = () => {
  return (
    <footer className="border-t border-stone-200 mt-auto pt-8 pb-4">
      <div className="px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <span>&copy; 2025 &laquo;Умняут&raquo;. Все права защищены</span>

        <nav className="flex gap-4">
          <a href="/about" className="hover:text-orange-500 transition-colors">
            О нас
          </a>
          <a href="/contacts" className="hover:text-orange-500 transition-colors">
            Контакты
          </a>
          <a href="/privacy" className="hover:text-orange-500 transition-colors">
            Политика конфиденциальности
          </a>
        </nav>

        <div className="flex gap-3">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-500 transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-4 h-4" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-500 transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-500 transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-4 h-4" />
          </a>
          <a
            href="mailto:info@umnyaut.ru"
            className="hover:text-orange-500 transition-colors"
            aria-label="Email"
          >
            <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
