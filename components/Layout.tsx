'use client';

import React from 'react';
import { UserStats } from '../types';
import { Flame, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionMain = motion.main as any;
const MotionDiv = motion.div as any;

interface LayoutProps {
  children: React.ReactNode;
  stats?: UserStats;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, stats, showHeader = true }) => {
  return (
    <div className="min-h-screen bg-orange-50 text-stone-800 pl-28">
      {showHeader && stats && (
        <div className="fixed top-4 right-4 z-40">
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 px-5 py-3 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-orange-100/50"
          >
            <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 rounded-xl border border-orange-100/50">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              <div className="flex flex-col">
                <span className="font-black text-slate-900 text-base leading-none">
                  {stats.streak}
                </span>
                <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest mt-0.5">
                  Ударный режим
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100/50">
              <Trophy className="w-5 h-5 text-amber-500 fill-amber-500" />
              <div className="flex flex-col">
                <span className="font-black text-slate-900 text-base leading-none">
                  {stats.points}
                </span>
                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-0.5">
                  Очки
                </span>
              </div>
            </div>
          </MotionDiv>
        </div>
      )}
      <MotionMain
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="max-w-7xl mx-auto px-6 py-6 md:py-12 pt-24"
      >
        {children}
      </MotionMain>
    </div>
  );
};

export default Layout;
