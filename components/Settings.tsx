'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, Category } from '../types';
import { fetchCategories } from '../crosswordApi';
import { User, Save, ListFilter, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface SettingsProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  Наука: Sparkles,
  История: Sparkles,
};

const Settings: React.FC<SettingsProps> = ({ profile, onSave }) => {
  const [username, setUsername] = useState(profile.username);
  const [selected, setSelected] = useState<string[]>(profile.selectedCategories);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      // Формируем guessedWords из themeProgress
      const guessedWords: Record<string, string[]> = {};
      Object.entries(profile.themeProgress).forEach(([category, progress]) => {
        if (progress.completedWords.length > 0) {
          guessedWords[category] = progress.completedWords;
        }
      });
      const cats = await fetchCategories(guessedWords);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const toggleCategory = (cat: string) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : prev.length < 5 ? [...prev, cat] : prev
    );
  };

  const handleSave = () => {
    if (username.trim() && selected.length > 0) {
      onSave({
        ...profile,
        username: username.trim(),
        selectedCategories: selected,
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
          <div className="bg-orange-50 p-3 rounded-2xl">
            <User className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">
            Ваш профиль
          </h3>
        </div>
        <div className="space-y-4">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2">
            Ваше имя
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-sky-50 p-3 rounded-2xl">
              <ListFilter className="w-6 h-6 text-sky-600" />
            </div>
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">
              Ваши интересы (макс. 5)
            </h3>
          </div>
          <button
            onClick={loadCategories}
            className="p-2 text-slate-400 hover:text-orange-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const isSelected = selected.includes(cat.name);
            return (
              <MotionButton
                key={cat.name}
                whileHover={{ scale: 1.05 }}
                onClick={() => toggleCategory(cat.name)}
                className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative
                  ${isSelected ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-slate-50 bg-slate-50 hover:border-orange-100'}
                `}
              >
                <span
                  className={`font-black text-[10px] uppercase tracking-wider ${isSelected ? 'text-orange-700' : 'text-slate-500'}`}
                >
                  {cat.name}
                </span>
                <div className="w-full mt-1">
                  <div className="flex justify-between text-[8px] font-bold mb-1">
                    <span className={isSelected ? 'text-orange-400' : 'text-slate-400'}>
                      {cat.guessed_percent || 0}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isSelected ? 'bg-orange-500' : 'bg-slate-300'}`}
                      style={{ width: `${cat.guessed_percent || 0}%` }}
                    />
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-orange-500 rounded-full p-1 border-2 border-white">
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
          onClick={handleSave}
          disabled={!username.trim() || selected.length === 0}
          className={`px-12 py-5 rounded-2xl font-black text-lg flex items-center gap-3 shadow-xl
            ${username.trim() && selected.length > 0 ? 'bg-orange-500 text-white border-b-4 border-orange-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <Save className="w-6 h-6" /> СОХРАНИТЬ ИЗМЕНЕНИЯ
        </MotionButton>
      </div>
    </MotionDiv>
  );
};

export default Settings;
