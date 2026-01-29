'use client';


import React, { useState } from 'react';
import { UserProfile, CATEGORIES } from '@/types';
import { BrainCircuit, CheckCircle2, User, Save, ListFilter, Sparkles, Book, History, Palette, Film, Cpu, Globe, Trophy, Music, Leaf, Utensils, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface SettingsProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
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

const Settings: React.FC<SettingsProps> = ({ profile, onSave }) => {
  const [username, setUsername] = useState(profile.username);
  const [selected, setSelected] = useState<string[]>(profile.categories);

  const toggleCategory = (cat: string) => {
    setSelected(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = () => {
    if (username.trim() && selected.length > 0) {
      onSave({
        ...profile,
        username: username.trim(),
        categories: selected
      });
    }
  };

  return (
    <MotionDiv 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-indigo-50 p-3 rounded-2xl">
            <User className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Ваш профиль</h3>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2">Ваше имя</label>
          <div className="relative">
             <input 
               type="text" 
               value={username} 
               onChange={(e) => setUsername(e.target.value)}
               className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:border-indigo-500 transition-all outline-none"
               placeholder="Введите имя..."
             />
             <User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-violet-50 p-3 rounded-2xl">
            <ListFilter className="w-6 h-6 text-violet-600" />
          </div>
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Ваши интересы</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {CATEGORIES.map(cat => {
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
                  p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative
                  ${isSelected 
                    ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                    : 'border-slate-50 bg-slate-50 hover:bg-white hover:border-indigo-100'
                  }
                `}
              >
                {/* Fix: Added missing closing quote and bracket for template literal in className */}
                <div className={`p-3 rounded-2xl transition-colors ${isSelected ? 'bg-indigo-500 text-white' : `${config.bg} ${config.color}`}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`font-black text-[10px] uppercase tracking-wider ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                  {cat}
                </span>
                
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-1 border-2 border-white">
                    <CheckCircle2 className="w-2 h-2 text-white" />
                  </div>
                )}
              </MotionButton>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <MotionButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={!username.trim() || selected.length === 0}
          className={`
            px-12 py-5 rounded-2xl font-black text-lg flex items-center gap-3 shadow-xl transition-all
            ${username.trim() && selected.length > 0 
              ? 'bg-indigo-600 text-white border-b-4 border-indigo-800 hover:bg-indigo-700' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed border-b-4 border-slate-300'
            }
          `}
        >
          <Save className="w-6 h-6" />
          СОХРАНИТЬ ИЗМЕНЕНИЯ
        </MotionButton>
      </div>
    </MotionDiv>
  );
};

export default Settings;
