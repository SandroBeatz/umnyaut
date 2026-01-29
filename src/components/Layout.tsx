'use client';


import React from 'react';
import { UserStats, getLevelTitle } from '@/types';
import { BrainCircuit, Flame, Trophy, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

interface LayoutProps {
  children: React.ReactNode;
  stats?: UserStats;
  username?: string;
  onLogoClick: () => void;
  onAccountClick: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, stats, username, onLogoClick, onAccountClick }) => {
  const levelTitle = stats ? getLevelTitle(stats.level) : '';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200/60 transition-all">
        <div className="max-w-[1600px] mx-auto px-6 h-16 md:h-28 flex items-center justify-between">
          <button 
            onClick={onLogoClick}
            className="flex items-center gap-4 md:gap-8 hover:opacity-80 transition-opacity"
          >
            <MotionDiv 
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 md:p-5 rounded-2xl md:rounded-[2rem] shadow-xl shadow-indigo-200/50 relative group"
            >
              <BrainCircuit className="w-5 h-5 md:w-10 md:h-10 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-2xl md:rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity blur-lg" />
            </MotionDiv>
            <div className="hidden sm:block text-left">
              <h1 className="text-base md:text-3xl font-game font-bold text-slate-900 tracking-tight leading-none flex items-center gap-2">
                ИНТЕЛЛЕКТ
                <Zap className="w-4 h-4 md:w-6 md:h-6 text-amber-500 fill-amber-400" />
              </h1>
              <span className="text-[8px] md:text-xs font-extrabold text-indigo-500 uppercase tracking-[0.4em] mt-1.5 block opacity-70">
                AI Crossword Engine
              </span>
            </div>
          </button>

          <div className="flex items-center gap-3 md:gap-8">
            {stats && (
              <>
                <div className="hidden md:flex items-center gap-4 px-6 py-4 bg-orange-50/50 rounded-2xl border border-orange-100/50 group">
                  <Flame className="w-7 h-7 text-orange-500 fill-orange-500" />
                  <div className="flex flex-col">
                    <span className="font-extrabold text-slate-900 text-2xl leading-none">{stats.streak}</span>
                    <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest mt-1">Стрик</span>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-4 px-6 py-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 group">
                  <Trophy className="w-7 h-7 text-amber-500 fill-amber-500" />
                  <div className="flex flex-col">
                    <span className="font-extrabold text-slate-900 text-2xl leading-none">{stats.points}</span>
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-1">IQ Очки</span>
                  </div>
                </div>

                <button 
                  onClick={onAccountClick}
                  className="flex items-center gap-4 md:gap-6 pl-4 md:pl-10 border-l border-slate-200/60 hover:opacity-70 transition-all"
                >
                  <div className="hidden md:flex flex-col items-end">
                    <div className="text-xl text-slate-900 font-extrabold truncate max-w-[200px]">{username}</div>
                    <div className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">
                      Lvl {stats.level} • {levelTitle}
                    </div>
                  </div>
                  <MotionDiv 
                    whileHover={{ scale: 1.1 }}
                    className="w-10 h-10 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200 overflow-hidden border-2 border-white"
                  >
                    <User className="w-5 h-5 md:w-8 md:h-8" />
                  </MotionDiv>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 md:py-16">
        {children}
      </main>
    </div>
  );
};

export default Layout;
