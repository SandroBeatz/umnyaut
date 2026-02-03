'use client';

import React from 'react';
import { UserStats, getLevelTitle } from '../types';
import { Flame, Trophy, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

interface LayoutProps {
  children: React.ReactNode;
  stats?: UserStats;
  username?: string;
  onLogoClick: () => void;
  onAccountClick: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  stats,
  username,
  onLogoClick,
  onAccountClick,
}) => {
  const levelTitle = stats ? getLevelTitle(stats.level) : '';

  return (
    <div className="min-h-screen bg-orange-50 text-stone-800">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-orange-100/50">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <button
            onClick={onLogoClick}
            className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity"
          >
            <MotionDiv
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden shadow-lg shadow-orange-200/50"
            >
              <img src="/logo.png" alt="Умняут" className="w-full h-full object-cover" />
            </MotionDiv>
            <div className="hidden sm:block text-left">
              <h1 className="text-sm md:text-xl font-game font-bold text-stone-800 tracking-tight leading-none flex items-center gap-1.5">
                УМНЯУТ
                <Zap className="w-3 h-3 md:w-4 md:h-4 text-orange-500 fill-orange-400" />
              </h1>
              <span className="text-[7px] md:text-[9px] font-black text-orange-500 uppercase tracking-[0.3em] mt-1 block opacity-70">
                Умный кот знает всё
              </span>
            </div>
          </button>

          <div className="flex items-center gap-3 md:gap-6">
            {stats && (
              <>
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-orange-50 rounded-xl border border-orange-100/50">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-sm leading-none">
                      {stats.streak}
                    </span>
                    <span className="text-[7px] font-black text-orange-400 uppercase tracking-widest mt-0.5">
                      Стрик
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100/50">
                  <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-sm leading-none">
                      {stats.points}
                    </span>
                    <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest mt-0.5">
                      Очки
                    </span>
                  </div>
                </div>

                <button
                  onClick={onAccountClick}
                  className="flex items-center gap-3 md:gap-4 pl-4 md:pl-6 border-l border-slate-200 group"
                >
                  <div className="hidden md:flex flex-col items-end">
                    <div className="text-sm text-slate-900 font-bold truncate max-w-[150px]">
                      {username}
                    </div>
                    <div className="text-[8px] text-orange-500 font-black uppercase tracking-widest">
                      {levelTitle}
                    </div>
                  </div>
                  <MotionDiv
                    whileHover={{ scale: 1.1 }}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white border-2 border-white shadow-md"
                  >
                    <User className="w-4 h-4 md:w-5 md:h-5" />
                  </MotionDiv>
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6 md:py-12">{children}</main>
    </div>
  );
};

export default Layout;
