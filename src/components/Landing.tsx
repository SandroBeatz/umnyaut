'use client';


import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Target, Cpu, Sparkles, Trophy, Lightbulb, ShieldCheck } from 'lucide-react';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface LandingProps {
  onStart: () => void;
  isLoggedIn: boolean;
}

const Landing: React.FC<LandingProps> = ({ onStart, isLoggedIn }) => {
  return (
    <div className="space-y-32 pb-20">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center">
        <MotionDiv 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-50 rounded-full text-indigo-600 font-black text-xs uppercase tracking-widest mb-10 border border-indigo-100">
            <Sparkles className="w-4 h-4" />
            Эволюция вашего интеллекта
          </div>
          <h1 className="text-5xl md:text-8xl font-game font-bold text-slate-900 leading-[1.05] mb-10 tracking-tight">
            Кроссворды нового <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">поколения</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed mb-16 max-w-2xl mx-auto">
            Первая в мире платформа, где искусственный интеллект создает уникальные головоломки, адаптируясь под ваш уровень знаний.
          </p>
          <MotionButton
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="px-16 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-indigo-200 uppercase tracking-widest flex items-center gap-6 mx-auto group"
          >
            {isLoggedIn ? 'Вернуться в игру' : 'Начать играть'}
            <div className="bg-indigo-600 p-2 rounded-full group-hover:rotate-45 transition-transform">
              <Zap className="w-6 h-6 fill-white text-white" />
            </div>
          </MotionButton>
        </MotionDiv>

        {/* Decorative Grid */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full opacity-[0.03] pointer-events-none -z-10">
          <div className="w-full h-full bg-[radial-gradient(#4f46e5_1.5px,transparent_1.5px)] [background-size:40px_40px]" />
        </div>
      </section>

      {/* Why Crosswords? Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        <MotionDiv 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-10"
        >
          <h2 className="text-4xl md:text-6xl font-game font-bold text-slate-900 leading-tight">
            Почему это <br/> <span className="text-indigo-600">полезно?</span>
          </h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="bg-amber-50 p-5 rounded-[2rem] shrink-0 border border-amber-100">
                <Lightbulb className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Нейропластичность</h4>
                <p className="text-slate-500 font-medium leading-relaxed">Регулярное решение кроссвордов создает новые нейронные связи, замедляя процессы старения мозга.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="bg-emerald-50 p-5 rounded-[2rem] shrink-0 border border-emerald-100">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Анти-стресс</h4>
                <p className="text-slate-500 font-medium leading-relaxed">Состояние потока при разгадывании снижает уровень кортизола и дарит чувство глубокого удовлетворения.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="bg-indigo-50 p-5 rounded-[2rem] shrink-0 border border-indigo-100">
                <Target className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Фокус и Концентрация</h4>
                <p className="text-slate-500 font-medium leading-relaxed">В мире бесконечных уведомлений кроссворд — это лучший способ вернуть себе способность глубоко мыслить.</p>
              </div>
            </div>
          </div>
        </MotionDiv>
        
        <MotionDiv 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[4rem] p-12 aspect-square flex items-center justify-center shadow-[0_50px_100px_-20px_rgba(79,70,229,0.3)]">
             <Brain className="w-full h-full text-white/20 absolute rotate-12" />
             <div className="relative z-10 text-center text-white">
                <Trophy className="w-24 h-24 mx-auto mb-8 text-amber-400" />
                <h3 className="text-3xl font-game font-bold mb-4 uppercase">Доказано наукой</h3>
                <p className="text-indigo-100 font-medium opacity-80">15 минут в день повышают когнитивный тонус на 30% уже через месяц.</p>
             </div>
          </div>
          <div className="absolute -bottom-10 -right-10 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 max-w-[240px]">
             <Cpu className="w-12 h-12 text-indigo-600 mb-4" />
             <p className="text-sm font-black text-slate-800 uppercase leading-snug">Ваш личный ИИ-тренер всегда рядом.</p>
          </div>
        </MotionDiv>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-900 rounded-[4rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-game font-bold mb-8">Готовы бросить вызов?</h2>
          <p className="text-xl text-slate-400 mb-16 max-w-xl mx-auto">Присоединяйтесь к сообществу эрудитов и начните свою интеллектуальную историю прямо сейчас.</p>
          <MotionButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="px-12 py-6 bg-white text-slate-900 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-colors"
          >
            Начать путешествие
          </MotionButton>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
           <div className="absolute top-10 left-10 w-40 h-40 bg-indigo-500 rounded-full blur-[80px]" />
           <div className="absolute bottom-10 right-10 w-60 h-60 bg-violet-500 rounded-full blur-[100px]" />
        </div>
      </section>
    </div>
  );
};

export default Landing;
