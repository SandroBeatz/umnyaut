'use client';

import React, { useState } from 'react';
import {
  Home,
  Settings as SettingsIcon,
  User,
  BarChart3,
  Gamepad2,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface SidebarProps {
  activeView: 'DASHBOARD' | 'GAME' | 'SETTINGS' | 'ABOUT' | 'STATISTICS';
  onViewChange: (view: 'DASHBOARD' | 'GAME' | 'SETTINGS' | 'ABOUT' | 'STATISTICS') => void;
  onLogoClick: () => void;
  onAccountClick: () => void;
  avatar?: string;
  username?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  onLogoClick,
  onAccountClick,
  avatar,
  username = 'Игрок',
}) => {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    { id: 'DASHBOARD' as const, icon: Home, label: 'Дашборд' },
    { id: 'STATISTICS' as const, icon: BarChart3, label: 'Статистика' },
    { id: 'GAME' as const, icon: Gamepad2, label: 'Игры' },
  ];

  return (
    <aside className="fixed left-4 top-4 bottom-4 w-20 z-50">
      {/* Unified Sidebar Wrapper */}
      <div className="h-full bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-orange-100/50 p-4 flex flex-col">
        {/* Logo Section */}
        <button
          onClick={onLogoClick}
          className="hover:opacity-80 transition-opacity"
          aria-label="Умняут - На главную"
        >
          <MotionDiv
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-orange-200/50"
          >
            <img src="/logo.png" alt="Умняут" className="w-full h-full object-cover" />
          </MotionDiv>
        </button>

        {/* Menu Section */}
        <nav className="flex-1 py-6 flex flex-col items-center justify-center gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <div key={item.id} className="relative">
                <MotionButton
                  onClick={() => onViewChange(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-orange-500'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </MotionButton>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredItem === item.id && (
                    <MotionDiv
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50"
                    >
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Account Section */}
        <div className="pt-4 border-t border-slate-100 relative">
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="w-12 h-12 mx-auto rounded-xl bg-slate-900 flex items-center justify-center text-white border-2 border-white shadow-md hover:scale-105 transition-transform overflow-hidden relative"
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </button>

          {/* Account Dropdown */}
          <AnimatePresence>
            {showAccountDropdown && (
              <MotionDiv
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                className="absolute left-full ml-3 bottom-0 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
              >
                {/* User Info */}
                <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white border-2 border-white shadow-md overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{username}</p>
                      <p className="text-xs text-slate-500">Активный игрок</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      onAccountClick();
                      setShowAccountDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <SettingsIcon className="w-5 h-5 text-slate-500" />
                    <span className="font-medium text-slate-700">Настройки</span>
                  </button>
                  {/* Future: Logout option will go here */}
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
