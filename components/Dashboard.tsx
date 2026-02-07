'use client';

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  GameHistoryEntry,
  CrosswordData,
  SavedGameState,
  SAVED_GAME_KEY,
} from '../types';
import { generateCrossword } from '../crosswordApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Play,
  History,
  Trophy,
  Brain,
  Cpu,
  Sparkles,
  Clock,
  X,
  AlertCircle,
  Settings,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_OPTIONS: {
  value: Difficulty;
  label: string;
  description: string;
  color: string;
}[] = [
  { value: 'easy', label: 'Легкий', description: '5×5, простые слова', color: 'emerald' },
  { value: 'medium', label: 'Средний', description: '7×7, средняя сложность', color: 'amber' },
  { value: 'hard', label: 'Сложный', description: '10×10, сложная лексика', color: 'red' },
];

interface DashboardProps {
  profile: UserProfile;
  onStartGame: (data: CrosswordData) => void;
  onContinueGame?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, onStartGame, onContinueGame }) => {
  const { stats, history, themeProgress } = profile;
  const [selectedHistory, setSelectedHistory] = useState<GameHistoryEntry | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedGame, setSavedGame] = useState<SavedGameState | null>(null);

  // Check for saved game on mount
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_GAME_KEY);
    if (saved) {
      try {
        setSavedGame(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem(SAVED_GAME_KEY);
      }
    }
  }, []);

  // Game settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    profile.selectedCategories[0] || ''
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');

  const chartData = history
    .slice(0, 7)
    .reverse()
    .map((entry) => ({
      name: entry.date.split('-').slice(2).join('.'),
      score: entry.score,
    }));

  const COLORS = ['#f97316', '#fb923c', '#fbbf24', '#facc15', '#38bdf8'];

  const handleOpenSettings = () => {
    setError(null);
    setIsSettingsOpen(true);
  };

  const handleGenerate = async () => {
    setIsSettingsOpen(false);
    setIsGenerating(true);
    setError(null);
    try {
      const categoryProgress = themeProgress[selectedCategory];
      const excludedWords = categoryProgress?.completedWords || [];

      const crosswordData = await generateCrossword(
        selectedCategory,
        selectedDifficulty,
        excludedWords
      );
      onStartGame(crosswordData);
    } catch (err: any) {
      if (err.message === 'CATEGORY_NOT_FOUND') {
        setError('Категория временно недоступна. Попробуйте другую.');
      } else if (err.message === 'GENERATION_TIMEOUT') {
        setError('Генерация заняла слишком много времени. Попробуйте еще раз.');
      } else {
        setError('Не удалось подключиться к серверу');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getCategoryProgress = (cat: string) => {
    const progress = themeProgress[cat] || { completedWords: [], totalWords: 100 };
    return Math.min(100, Math.round((progress.completedWords.length / progress.totalWords) * 100));
  };

  return (
    <div className="space-y-8">
      {/* Hero Action */}
      <MotionDiv
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl"
      >
        <div className="relative z-10 max-w-xl">
          <MotionDiv className="flex items-center gap-2 mb-4 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
            <Cpu className="w-4 h-4 text-orange-200" />
            <span className="uppercase tracking-widest text-[8px] font-black text-orange-100">
              Умняут думает...
            </span>
          </MotionDiv>

          <h2 className="text-3xl md:text-5xl font-game font-bold mb-4 leading-tight tracking-tight">
            Готовы к новому <br /> испытанию?
          </h2>

          <p className="text-orange-100 mb-8 text-sm md:text-base opacity-80 font-medium">
            Умняут готов создать персональную головоломку на основе ваших интересов.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            {savedGame && onContinueGame && (
              <MotionButton
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onContinueGame}
                className="group bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-4 shadow-lg border-2 border-emerald-400"
              >
                <div className="bg-white/20 p-1.5 rounded-full">
                  <RotateCcw className="w-4 h-4" />
                </div>
                ПРОДОЛЖИТЬ
              </MotionButton>
            )}

            <MotionButton
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenSettings}
              disabled={isGenerating}
              className="group bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-4 shadow-lg disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                  ГЕНЕРАЦИЯ...
                </div>
              ) : (
                <>
                  <div className="bg-orange-500 p-1.5 rounded-full group-hover:rotate-90 transition-transform">
                    <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                  </div>
                  {savedGame ? 'НОВАЯ ИГРА' : 'ИГРАТЬ'}
                </>
              )}
            </MotionButton>

            {error && (
              <div className="flex items-center gap-2 text-red-200 text-xs font-bold bg-red-900/30 p-3 rounded-xl backdrop-blur-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-5 hidden xl:block">
          <Brain className="w-80 h-80 text-white rotate-6" />
        </div>
      </MotionDiv>

      {/* Stats and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                  IQ Очки
                </span>
                <span className="text-xl md:text-2xl font-black text-slate-800">
                  {stats.points}
                </span>
              </div>
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
            </div>
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                  Решено игр
                </span>
                <span className="text-xl md:text-2xl font-black text-slate-800">
                  {stats.totalSolved}
                </span>
              </div>
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
            </div>
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                  Среднее время
                </span>
                <span className="text-xl md:text-2xl font-black text-slate-800">
                  {stats.averageTime
                    ? `${Math.floor(stats.averageTime / 60)}:${(stats.averageTime % 60).toString().padStart(2, '0')}`
                    : '—'}
                </span>
              </div>
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-sky-400" />
            </div>
            <div className="bg-slate-900 p-4 md:p-6 rounded-2xl text-white">
              <span className="text-[8px] md:text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1 block">
                Стрик
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl font-black">{stats.streak}</span>
                <span className="text-orange-300 font-bold uppercase text-[8px] md:text-[9px]">
                  Дней
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6">
                Ваша активность
              </h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 9 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }}
                    />
                    <Bar dataKey="score" radius={[6, 6, 6, 6]} barSize={24}>
                      {chartData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6">
                Прогресс тем
              </h3>
              <div className="space-y-5">
                {profile.selectedCategories.map((cat) => {
                  const progress = themeProgress[cat] || { completedWords: [], totalWords: 100 };
                  const percent = Math.min(
                    100,
                    Math.round((progress.completedWords.length / progress.totalWords) * 100)
                  );
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
                          {cat}
                        </span>
                        <span className="text-[9px] font-black text-orange-600">{percent}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <MotionDiv
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[420px] flex flex-col">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-5 flex items-center gap-2">
              <History className="w-4 h-4 text-orange-500" />
              История
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => setSelectedHistory(entry)}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-orange-200 cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-800 text-xs truncate max-w-[100px]">
                      {entry.title}
                    </span>
                    <span className="text-orange-600 font-black text-[10px]">+{entry.score}</span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 flex items-center gap-2">
                    <Calendar className="w-2.5 h-2.5" /> {entry.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {selectedHistory && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedHistory(null)}
          >
            <MotionDiv
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedHistory(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-xl font-black uppercase">{selectedHistory.title}</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  {selectedHistory.date} • {selectedHistory.difficulty || 'medium'}
                </p>
              </div>

              {/* Mini Grid Visualization */}
              {selectedHistory.grid && selectedHistory.grid.length > 0 && (
                <div className="flex justify-center mb-6">
                  <div
                    className="bg-slate-900 p-2 rounded-xl inline-grid gap-0.5"
                    style={{
                      gridTemplateColumns: `repeat(${selectedHistory.grid[0]?.length || 5}, 1fr)`,
                    }}
                  >
                    {selectedHistory.grid.map((row, r) =>
                      row.map((cell, c) => (
                        <div
                          key={`${r}-${c}`}
                          className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded text-[8px] md:text-[10px] font-bold ${
                            cell ? 'bg-emerald-500 text-white' : 'bg-white/5'
                          }`}
                        >
                          {cell}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-orange-500" />
                    <span className="text-[9px] font-black text-orange-400 uppercase">Очки</span>
                  </div>
                  <div className="text-2xl font-black text-orange-600">
                    +{selectedHistory.score}
                  </div>
                </div>

                <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-sky-500" />
                    <span className="text-[9px] font-black text-sky-400 uppercase">Время</span>
                  </div>
                  <div className="text-2xl font-black text-sky-600">
                    {Math.floor(selectedHistory.timeSeconds / 60)}:
                    {(selectedHistory.timeSeconds % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-amber-500" />
                    <span className="text-[9px] font-black text-amber-400 uppercase">
                      Подсказки
                    </span>
                  </div>
                  <div className="text-2xl font-black text-amber-600">
                    {(selectedHistory.hintsUsed || 0) + (selectedHistory.lettersRevealed || 0)}
                  </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase">
                      Без подсказок
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {selectedHistory.wordsWithoutHints !== undefined
                      ? `${Math.round((selectedHistory.wordsWithoutHints / selectedHistory.wordsSolved) * 100)}%`
                      : '100%'}
                  </div>
                </div>
              </div>

              {/* Detailed breakdown */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-500">Слов решено</span>
                  <span className="text-sm font-black text-slate-800">
                    {selectedHistory.wordsSolved}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-500">Категория</span>
                  <span className="text-sm font-black text-slate-800">
                    {selectedHistory.category}
                  </span>
                </div>
                {selectedHistory.hintsUsed !== undefined && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-500">Текстовых подсказок</span>
                    <span className="text-sm font-black text-amber-600">
                      {selectedHistory.hintsUsed}
                    </span>
                  </div>
                )}
                {selectedHistory.lettersRevealed !== undefined && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-bold text-slate-500">Показано букв</span>
                    <span className="text-sm font-black text-amber-600">
                      {selectedHistory.lettersRevealed}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedHistory(null)}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-colors"
              >
                Закрыть
              </button>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* Game Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          >
            <MotionDiv
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full p-8 relative shadow-2xl"
            >
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-2.5 rounded-xl">
                  <Settings className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Настройки игры</h3>
              </div>

              {/* Category Selection */}
              <div className="mb-6">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                  Выберите категорию
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {profile.selectedCategories.map((cat) => {
                    const progress = getCategoryProgress(cat);
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`p-3 rounded-xl border-2 transition-all text-left relative ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-slate-100 bg-slate-50 hover:border-orange-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className={`font-bold text-xs ${isSelected ? 'text-orange-700' : 'text-slate-700'}`}
                          >
                            {cat}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-orange-500" />}
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isSelected ? 'bg-orange-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span
                          className={`text-[8px] font-bold mt-1 block ${
                            isSelected ? 'text-orange-500' : 'text-slate-400'
                          }`}
                        >
                          {progress}% пройдено
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div className="mb-8">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                  Уровень сложности
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTY_OPTIONS.map((opt) => {
                    const isSelected = selectedDifficulty === opt.value;
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
                        onClick={() => setSelectedDifficulty(opt.value)}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${colorClasses[opt.color as keyof typeof colorClasses]}`}
                      >
                        <span className="font-black text-xs block mb-0.5">{opt.label}</span>
                        <span className="text-[8px] font-medium text-slate-400 block">
                          {opt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Button */}
              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={!selectedCategory}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-black text-lg flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 fill-white" />
                НАЧАТЬ ИГРУ
              </MotionButton>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Calendar = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

export default Dashboard;
