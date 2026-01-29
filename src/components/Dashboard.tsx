'use client';


import React from 'react';
import { UserProfile, getLevelTitle } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Play, History, TrendingUp, Award, Calendar, ChevronRight, Trophy, Star, Target, Brain, Cpu, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface DashboardProps {
  profile: UserProfile;
  onStartGame: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, onStartGame }) => {
  const { stats, history } = profile;
  const levelTitle = getLevelTitle(stats.level);

  const chartData = history.slice(0, 7).reverse().map(entry => ({
    name: entry.date.split('-').slice(1).join('.'),
    score: entry.score
  }));

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

  return (
    <div className="space-y-12">
      {/* Hero Action */}
      <MotionDiv 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-800 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 border-b-[12px] border-indigo-900/30"
      >
        <div className="relative z-10 max-w-2xl">
          <MotionDiv 
             initial={{ x: -20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="flex items-center gap-3 mb-6 bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-md"
          >
            <Cpu className="w-5 h-5 text-indigo-200" />
            <span className="uppercase tracking-[0.2em] text-[10px] font-black text-indigo-100">Инициализация Нейромодуля</span>
          </MotionDiv>
          
          <h2 className="text-4xl md:text-6xl font-game font-bold mb-6 leading-[1.1] tracking-tight">
            Синтезируй <br/> Свои Знания
          </h2>
          
          <p className="text-indigo-100 mb-10 text-lg md:text-xl opacity-90 font-medium leading-relaxed max-w-xl">
            Искусственный интеллект готов сгенерировать уникальный когнитивный вызов специально для вашего уровня <span className="text-white font-black">{levelTitle}</span>.
          </p>

          <MotionButton
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartGame}
            className="group bg-white text-indigo-700 px-12 py-6 rounded-[2rem] font-black text-2xl flex items-center gap-6 transition-all shadow-2xl hover:shadow-white/20"
          >
            <div className="bg-indigo-600 p-2 rounded-full group-hover:rotate-90 transition-transform">
              <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
            </div>
            АКТИВИРОВАТЬ СИНАПСЫ
          </MotionButton>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 right-20 -translate-y-1/2 opacity-10 hidden xl:block">
           <Brain className="w-96 h-96 text-white rotate-6" />
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute left-1/2 bottom-0 w-96 h-40 bg-violet-400/10 rounded-full blur-3xl"></div>
      </MotionDiv>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Stats Summary */}
        <MotionDiv 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1 space-y-4"
        >
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Решено</span>
              <span className="text-4xl font-black text-slate-800">{stats.totalSolved}</span>
            </div>
            <div className="bg-emerald-50 p-4 rounded-3xl">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Твое Звание</span>
              <div className="text-2xl font-black mb-2">{levelTitle}</div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-4">
                <div className="bg-indigo-500 h-full w-[65%]" />
              </div>
              <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest">Следующий уровень: {stats.level + 1}</p>
            </div>
            <Target className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
          </div>
        </MotionDiv>

        {/* Analytics Card */}
        <MotionDiv 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <div className="bg-indigo-50 p-3 rounded-2xl">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
               </div>
               <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Активность</h3>
            </div>
          </div>
          <div className="h-56 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9', radius: 12}}
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}}
                  />
                  <Bar dataKey="score" radius={[12, 12, 12, 12]} barSize={32}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Target className="w-12 h-12 opacity-20" />
                <p className="italic text-sm">Нет данных для анализа</p>
              </div>
            )}
          </div>
        </MotionDiv>

        {/* History Card */}
        <MotionDiv 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
               <div className="bg-violet-50 p-3 rounded-2xl">
                  <History className="w-6 h-6 text-violet-600" />
               </div>
               <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Протокол Побед</h3>
            </div>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[224px] pr-2 custom-scrollbar">
            {history.length > 0 ? (
              history.map((entry, idx) => (
                <MotionDiv 
                  key={entry.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                       <ChevronRight className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm truncate max-w-[140px]">{entry.title}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="bg-indigo-600 px-4 py-2 rounded-xl text-white font-black text-xs shadow-md shadow-indigo-100">
                    +{entry.score}
                  </div>
                </MotionDiv>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4 py-10">
                <History className="w-12 h-12 opacity-20" />
                <p className="text-sm italic">Архив пуст. Начните сессию.</p>
              </div>
            )}
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default Dashboard;
