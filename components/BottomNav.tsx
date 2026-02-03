'use client';

import React from 'react';
import { Home, Plus, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

interface BottomNavProps {
  activeView: 'DASHBOARD' | 'GAME' | 'SETTINGS';
  onViewChange: (view: 'DASHBOARD' | 'GAME' | 'SETTINGS') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 flex justify-center pointer-events-none">
      <MotionDiv
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_20px_40px_rgba(0,0,0,0.1)] px-8 py-3 rounded-full flex items-center gap-8 pointer-events-auto"
      >
        <button
          onClick={() => onViewChange('DASHBOARD')}
          className={`p-3 rounded-full transition-all ${activeView === 'DASHBOARD' ? 'bg-orange-500 text-white scale-110 shadow-lg shadow-orange-200' : 'text-slate-400 hover:text-orange-500'}`}
        >
          <Home className="w-6 h-6" />
        </button>

        <button
          onClick={() => onViewChange('GAME')}
          className={`p-4 rounded-full transition-all -mt-8 ${activeView === 'GAME' ? 'bg-orange-500 text-white scale-110 shadow-xl shadow-orange-300' : 'bg-white border-2 border-orange-100 text-orange-500 shadow-lg'}`}
        >
          <Plus className="w-8 h-8" />
        </button>

        <button
          onClick={() => onViewChange('SETTINGS')}
          className={`p-3 rounded-full transition-all ${activeView === 'SETTINGS' ? 'bg-orange-500 text-white scale-110 shadow-lg shadow-orange-200' : 'text-slate-400 hover:text-orange-500'}`}
        >
          <SettingsIcon className="w-6 h-6" />
        </button>
      </MotionDiv>
    </div>
  );
};

export default BottomNav;
