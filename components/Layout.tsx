'use client';

import React from 'react';
import { UserStats } from '../types';
import { Flame, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionMain = motion.main as any;

interface LayoutProps {
  children: React.ReactNode;
  stats?: UserStats;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, stats, showHeader = true }) => {
  return (
    <div className="min-h-screen bg-orange-50 text-stone-800 pl-20">
      {showHeader && (
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-orange-100/50">
          <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-end">
            {stats && (
              <div className="flex items-center gap-3 md:gap-6">
                <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 rounded-xl border border-orange-100/50">
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

                <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100/50">
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
              </div>
            )}
          </div>
        </header>
      )}
      <MotionMain
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="max-w-7xl mx-auto px-6 py-6 md:py-12"
      >
        {children}
      </MotionMain>
    </div>
  );
};

export default Layout;
