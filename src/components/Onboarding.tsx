'use client';


import React, { useState } from 'react';
import { CATEGORIES } from '@/types';
import { BrainCircuit, CheckCircle2, Sparkles, Book, History, Palette, Film, Cpu, Globe, Trophy, Music, Leaf, Utensils, FlaskConical, User, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface OnboardingProps {
  onComplete: (data: { username: string; categories: string[] }) => void;
  onCancel: () => void;
}

const CATEGORY_CONFIG: Record<string, { icon: any, color: string, bg: string }> = {
  'Наука': { icon: FlaskConical, color: 'text-blue-600', bg: 'bg-blue-100' },
  'История': { icon: History, color: 'text-amber-700', bg: 'bg-amber-100' },
  'Искусство': { icon: Palette, color: 'text-pink-600', bg: 'bg-pink-100' },
  'Кино': { icon: Film, color: 'text-slate-700', bg: 'bg-slate-200' },
  'Технологии': { icon: Cpu, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  'География': { icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  'Спорт': { icon: Trophy, color: 'text-orange-600', bg: 'bg-orange-100' },
  'Литература': { icon: Book, color: 'text-violet-600', bg: 'bg-violet-100' },
  'Музыка': { icon: Music, color: 'text-rose-600', bg: 'bg-rose-100' },
  'Еда': { icon: Utensils, color: 'text-red-600', bg: 'bg-red-100' },
  'Природа': { icon: Leaf, color: 'text-green-600', bg: 'bg-green-100' }
};

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setSelected(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleNext = () => {
    if (step === 1 && username.trim()) {
      setStep(2);
    } else if (step === 2 && selected.length > 0) {
      onComplete({ username, categories: selected });
    }
  };

  return (
    <div className="min-h-screen bg-indigo-700 flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-indigo-700 to-indigo-900 overflow-y-auto">
      <MotionDiv 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-4xl w-full bg-white rounded-[3rem] shadow-[0_32px_64px_rgba(0,0,0,0.4)] overflow-hidden p-8 sm:p-12 text-center relative border-b-[12px] border-indigo-200/50 my-8"
      >
        <button 
          onClick={step === 2 ? () => setStep(1) : onCancel}
          className="absolute top-8 left-8 p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex justify-center mb-6">
          <MotionDiv 
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ repeat: Infinity, duration: 5 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[2rem] shadow-2xl"
          >
            <BrainCircuit className="w-12 h-12 text-white" />
          </MotionDiv>
        </div>
        
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <MotionDiv 
              key="step1"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-game font-bold text-slate-800 mb-2">Добро пожаловать!</h1>
                <p className="text-slate-500 font-medium">Как нам тебя называть?</p>
              </div>

              <div className="relative max-w-sm mx-auto">
                <input 
                  autoFocus
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  placeholder="Твое имя..."
                  className="w-full bg-slate-50 border-4 border-slate-100 rounded-3xl px-8 py-6 text-2xl font-black text-slate-800 outline-none focus:border-indigo-400 transition-all text-center"
                />
              </div>
            </MotionDiv>
          ) : (
            <MotionDiv 
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-game font-bold text-slate-800 mb-2">Отлично, {username}!</h1>
                <p className="text-slate-500 font-medium">Выбери темы для своих кроссвордов</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {CATEGORIES.map((cat) => {
                  const isSelected = selected.includes(cat);
                  const config = CATEGORY_CONFIG[cat] || { icon: Sparkles, color: 'text-indigo-500', bg: 'bg-indigo-50' };
                  const Icon = config.icon;
                  
                  return (
                    <MotionButton
                      key={cat}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggleCategory(cat)}
                      className={`
                        p-4 rounded-[2rem] border-4 transition-all flex flex-col items-center justify-center gap-2 relative
                        ${isSelected 
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg' 
                          : 'border-slate-50 bg-slate-50 hover:bg-white hover:border-indigo-100'
                        }
                      `}
                    >
                      <div className={`p-3 rounded-2xl transition-colors ${isSelected ? 'bg-indigo-500 text-white' : `${config.bg} ${config.color}`}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`font-black text-[10px] uppercase tracking-wider ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                        {cat}
                      </span>
                    </MotionButton>
                  );
                })}
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>

        <div className="mt-12">
          <MotionButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            disabled={step === 1 ? !username.trim() : selected.length === 0}
            className={`
              w-full sm:w-auto px-16 py-6 rounded-3xl font-black text-xl transition-all shadow-xl uppercase tracking-widest
              ${(step === 1 ? username.trim() : selected.length > 0)
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-b-8 border-indigo-800' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border-b-8 border-slate-300'
              }
            `}
          >
            {step === 1 ? 'Далее' : 'Начать игру'}
          </MotionButton>
        </div>
      </MotionDiv>
    </div>
  );
};

export default Onboarding;
