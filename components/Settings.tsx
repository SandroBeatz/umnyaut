'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Category } from '../types';
import { fetchCategories } from '../crosswordApi';
import {
  User,
  Save,
  ListFilter,
  CheckCircle2,
  RefreshCw,
  Camera,
  Volume2,
  VolumeX,
  Gauge,
  BarChart3,
  Calendar,
  Trophy,
} from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Легкий', color: 'emerald' },
  { value: 'medium', label: 'Средний', color: 'amber' },
  { value: 'hard', label: 'Сложный', color: 'red' },
];

interface SettingsProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ profile, onSave }) => {
  const [username, setUsername] = useState(profile.username);
  const [selected, setSelected] = useState<string[]>(profile.selectedCategories);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(profile.avatar);
  const [defaultDifficulty, setDefaultDifficulty] = useState<Difficulty>(
    profile.defaultDifficulty || 'medium'
  );
  const [soundEnabled, setSoundEnabled] = useState(profile.soundEnabled ?? true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert('Файл слишком большой. Максимум 500KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (username.trim() && selected.length > 0) {
      onSave({
        ...profile,
        username: username.trim(),
        selectedCategories: selected,
        avatar,
        defaultDifficulty,
        soundEnabled,
        createdAt: profile.createdAt || new Date().toISOString(),
      });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Неизвестно';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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

        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-28 h-28 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors overflow-hidden group"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-300" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <span className="text-[9px] font-bold text-slate-400 uppercase">Нажмите для загрузки</span>
          </div>

          {/* Name */}
          <div className="flex-1 space-y-4">
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

      {/* Game Preferences */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-violet-50 p-3 rounded-2xl">
            <Gauge className="w-6 h-6 text-violet-600" />
          </div>
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">
            Игровые настройки
          </h3>
        </div>

        <div className="space-y-6">
          {/* Default Difficulty */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-3">
              Сложность по умолчанию
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const isSelected = defaultDifficulty === opt.value;
                const colorClasses = {
                  emerald: isSelected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-100 bg-slate-50 hover:border-emerald-200',
                  amber: isSelected
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-100 bg-slate-50 hover:border-amber-200',
                  red: isSelected
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-100 bg-slate-50 hover:border-red-200',
                };
                return (
                  <button
                    key={opt.value}
                    onClick={() => setDefaultDifficulty(opt.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${colorClasses[opt.color as keyof typeof colorClasses]}`}
                  >
                    <span className="font-black text-sm">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound Toggle */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-3">
              Звуковые эффекты
            </label>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                soundEnabled
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <span className={`font-bold ${soundEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {soundEnabled ? 'Включены' : 'Выключены'}
                </span>
              </div>
              <div
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  soundEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Account Statistics */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-amber-50 p-3 rounded-2xl">
            <BarChart3 className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">
            Статистика аккаунта
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Дата регистрации</span>
            </div>
            <span className="font-bold text-slate-700 text-sm">{formatDate(profile.createdAt)}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Всего очков</span>
            </div>
            <span className="font-bold text-slate-700 text-sm">{profile.stats.points}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Всего игр</span>
            </div>
            <span className="font-bold text-slate-700 text-sm">{profile.stats.totalSolved}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-violet-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Уровень</span>
            </div>
            <span className="font-bold text-slate-700 text-sm">{profile.stats.level}</span>
          </div>
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
