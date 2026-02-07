'use client';

import React from 'react';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-800 text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="Умняут"
                className="w-10 h-10 md:w-12 md:h-12 object-contain"
              />
              <span className="text-xl md:text-2xl font-game font-bold">Умняут</span>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed">
              Интеллектуальные головоломки с умным котиком
            </p>
          </div>

          {/* Navigation Links */}
          <div className="col-span-1">
            <h3 className="font-black text-sm uppercase tracking-wider mb-4">Навигация</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/about"
                  className="text-stone-400 hover:text-orange-400 transition-colors text-sm"
                >
                  О проекте
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="text-stone-400 hover:text-orange-400 transition-colors text-sm"
                >
                  Блог
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-stone-400 hover:text-orange-400 transition-colors text-sm"
                >
                  Контакты
                </a>
              </li>
              <li>
                <a
                  href="/policy"
                  className="text-stone-400 hover:text-orange-400 transition-colors text-sm"
                >
                  Политика
                </a>
              </li>
            </ul>
          </div>

          {/* Empty column for spacing */}
          <div className="hidden md:block col-span-1"></div>

          {/* Social Media */}
          <div className="col-span-1">
            <h3 className="font-black text-sm uppercase tracking-wider mb-4">Соц. сети</h3>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-stone-700 hover:bg-orange-500 p-2.5 rounded-xl transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-stone-700 hover:bg-orange-500 p-2.5 rounded-xl transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-stone-700 hover:bg-orange-500 p-2.5 rounded-xl transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:info@umnyaut.ru"
                className="bg-stone-700 hover:bg-orange-500 p-2.5 rounded-xl transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-stone-700 pt-6">
          <p className="text-stone-400 text-sm text-center">© 2025 «Умняут». Все права защищены</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
