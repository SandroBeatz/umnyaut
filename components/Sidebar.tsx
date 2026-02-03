'use client';

import React from 'react';
import { Home, Settings as SettingsIcon, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

interface SidebarProps {
  activeView: 'DASHBOARD' | 'GAME' | 'SETTINGS';
  onViewChange: (view: 'DASHBOARD' | 'GAME' | 'SETTINGS') => void;
  onLogoClick: () => void;
  onAccountClick: () => void;
  avatar?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  onLogoClick,
  onAccountClick,
  avatar,
}) => {
  const menuItems = [
    { id: 'DASHBOARD' as const, icon: Home, label: 'Главная' },
    { id: 'SETTINGS' as const, icon: SettingsIcon, label: 'Настройки' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-20 bg-white border-r border-slate-100 flex flex-col z-50 shadow-sm">
      {/* Logo */}
      <button
        onClick={onLogoClick}
        className="p-4 flex flex-col items-center justify-center gap-1 border-b border-slate-100 hover:bg-orange-50 transition-colors"
      >
        <MotionDiv
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-orange-200/50"
        >
          <img src="/logo.png" alt="Умняут" className="w-full h-full object-cover" />
        </MotionDiv>
        <div className="flex items-center gap-0.5 mt-1">
          <span className="text-[8px] font-black text-slate-700 tracking-tight">УМНЯУТ</span>
          <Zap className="w-2.5 h-2.5 text-orange-500 fill-orange-400" />
        </div>
      </button>

      {/* Menu */}
      <nav className="flex-1 flex flex-col items-center py-6 gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-orange-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[8px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onAccountClick}
          className="w-12 h-12 mx-auto rounded-xl bg-slate-900 flex items-center justify-center text-white border-2 border-white shadow-md hover:scale-105 transition-transform overflow-hidden"
        >
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
