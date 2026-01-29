import React, { useState } from 'react';
import { UserProfile, GameHistoryEntry, CrosswordData } from '../types';
import { generateCrossword } from '../crosswordApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Play, History, Trophy, Brain, Cpu, Sparkles, Clock, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface DashboardProps {
  profile: UserProfile;
  onStartGame: (data: CrosswordData) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, onStartGame }) => {
  const { stats, history, themeProgress } = profile;
  const [selectedHistory, setSelectedHistory] = useState<GameHistoryEntry | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartData = history.slice(0, 7).reverse().map(entry => ({
    name: entry.date.split('-').slice(2).join('.'),
    score: entry.score
  }));

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

  const calculateDifficulty = (level: number): 'easy' | 'medium' | 'hard' => {
    if (level === 1) return 'easy';
    if (level <= 3) return 'medium';
    return 'hard';
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const category = profile.selectedCategories[Math.floor(Math.random() * profile.selectedCategories.length)];
      const difficulty = calculateDifficulty(stats.level);
      const excludedIds = profile.solvedCrosswordIds;

      const crosswordData = await generateCrossword(category, difficulty, excludedIds);
      onStartGame(crosswordData);
    } catch (err: any) {
      if (err.message === 'CATEGORY_NOT_FOUND') {
        setError("Категория временно недоступна. Попробуйте другую.");
      } else if (err.message === 'GENERATION_TIMEOUT') {
        setError("Генерация заняла слишком много времени. Попробуйте еще раз.");
      } else {
        setError("Не удалось подключиться к серверу");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Action */}
      <MotionDiv 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl"
      >
        <div className="relative z-10 max-w-xl">
          <MotionDiv className="flex items-center gap-2 mb-4 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
            <Cpu className="w-4 h-4 text-indigo-200" />
            <span className="uppercase tracking-widest text-[8px] font-black text-indigo-100">Нейро-инициализация</span>
          </MotionDiv>
          
          <h2 className="text-3xl md:text-5xl font-game font-bold mb-4 leading-tight tracking-tight">
            Готовы к новому <br/> испытанию?
          </h2>
          
          <p className="text-indigo-100 mb-8 text-sm md:text-base opacity-80 font-medium">
            ИИ готов синтезировать персональную головоломку на основе ваших интересов.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <MotionButton
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={isGenerating}
              className="group bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-4 shadow-lg disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  ГЕНЕРАЦИЯ...
                </div>
              ) : (
                <>
                  <div className="bg-indigo-600 p-1.5 rounded-full group-hover:rotate-90 transition-transform">
                    <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                  </div>
                  СГЕНЕРИРОВАТЬ
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">IQ Очки</span>
                <span className="text-2xl font-black text-slate-800">{stats.points}</span>
              </div>
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Решено игр</span>
                <span className="text-2xl font-black text-slate-800">{stats.totalSolved}</span>
              </div>
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl text-white">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">Стрик</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black">{stats.streak}</span>
                <span className="text-indigo-300 font-bold uppercase text-[9px]">Дней</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6">Ваша активность</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', fontSize: '12px'}} />
                    <Bar dataKey="score" radius={[6, 6, 6, 6]} barSize={24}>
                      {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6">Прогресс тем</h3>
              <div className="space-y-5">
                {profile.selectedCategories.map(cat => {
                  const progress = themeProgress[cat] || { completedWords: [], totalWords: 100 };
                  const percent = Math.min(100, Math.round((progress.completedWords.length / progress.totalWords) * 100));
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">{cat}</span>
                        <span className="text-[9px] font-black text-indigo-600">{percent}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <MotionDiv 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
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
              <History className="w-4 h-4 text-indigo-500" />
              История
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {history.map(entry => (
                <div 
                  key={entry.id} 
                  onClick={() => setSelectedHistory(entry)}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-800 text-xs truncate max-w-[100px]">{entry.title}</span>
                    <span className="text-indigo-600 font-black text-[10px]">+{entry.score}</span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 flex items-center gap-2">
                    <Calendar className="w-2.5 h-2.5"/> {entry.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedHistory && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <MotionDiv 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-8 relative shadow-2xl text-center"
            >
              <button onClick={() => setSelectedHistory(null)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5"/></button>
              <h3 className="text-xl font-black mb-4 uppercase">Отчет игры</h3>
              <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-100">
                <div>
                  <div className="text-[8px] font-black text-slate-400 uppercase">Очки</div>
                  <div className="text-lg font-black text-indigo-600">+{selectedHistory.score}</div>
                </div>
                <div>
                  <div className="text-[8px] font-black text-slate-400 uppercase">Время</div>
                  <div className="text-lg font-black text-slate-800">{Math.floor(selectedHistory.timeSeconds / 60)}м</div>
                </div>
              </div>
              <button onClick={() => setSelectedHistory(null)} className="w-full py-4 mt-6 bg-slate-900 text-white rounded-xl font-black">Закрыть</button>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Calendar = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);

export default Dashboard;
