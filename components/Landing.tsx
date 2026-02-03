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
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center">
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl"
        >
          {/* Logo */}
          <MotionDiv
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-8"
          >
            <img
              src="/logo.png"
              alt="Умняут"
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </MotionDiv>

          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-orange-50 rounded-full text-orange-600 font-black text-[10px] uppercase tracking-widest mb-8 border border-orange-200">
            <Sparkles className="w-3.5 h-3.5" />
            Познавай мир с Умняутом
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-game font-bold text-stone-800 leading-[1.1] mb-8 tracking-tight">
            Интеллектуальные <br /> головоломки с{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
              умным котиком
            </span>
          </h1>
          <p className="text-lg md:text-xl text-stone-500 font-medium leading-relaxed mb-12 max-w-2xl mx-auto">
            Умняут — твой любознательный помощник в мире головоломок. Он создаёт уникальные
            кроссворды, адаптируясь под твои интересы и уровень знаний.
          </p>
          <MotionButton
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="px-10 py-5 bg-stone-800 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-200 uppercase tracking-widest flex items-center gap-4 mx-auto group"
          >
            {isLoggedIn ? 'Вернуться в игру' : 'Начать играть'}
            <div className="bg-orange-500 p-1.5 rounded-full group-hover:rotate-45 transition-transform">
              <Zap className="w-4 h-4 fill-white text-white" />
            </div>
          </MotionButton>
        </MotionDiv>

        {/* Decorative Grid */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full opacity-[0.03] pointer-events-none -z-10">
          <div className="w-full h-full bg-[radial-gradient(#f97316_1.5px,transparent_1.5px)] [background-size:40px_40px]" />
        </div>
      </section>

      {/* Why Crosswords? Section - Scaled Down */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
        <MotionDiv
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="text-3xl md:text-5xl font-game font-bold text-stone-800 leading-tight">
            Почему с Умняутом <br /> <span className="text-orange-500">интереснее?</span>
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-amber-50 p-4 rounded-2xl shrink-0 border border-amber-100">
                <Lightbulb className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h4 className="text-lg font-black text-stone-700 mb-1 uppercase tracking-tight">
                  Тренировка ума
                </h4>
                <p className="text-sm text-stone-500 font-medium leading-relaxed">
                  Решение кроссвордов создаёт новые нейронные связи и поддерживает мозг в тонусе.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-sky-50 p-4 rounded-2xl shrink-0 border border-sky-100">
                <ShieldCheck className="w-6 h-6 text-sky-500" />
              </div>
              <div>
                <h4 className="text-lg font-black text-stone-700 mb-1 uppercase tracking-tight">
                  Релакс и удовольствие
                </h4>
                <p className="text-sm text-stone-500 font-medium leading-relaxed">
                  Погружение в головоломки снимает стресс и дарит чувство достижения.
                </p>
              </div>
            </div>
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-10 aspect-video flex items-center justify-center shadow-2xl">
            <Brain className="w-full h-full text-white/10 absolute rotate-12" />
            <div className="relative z-10 text-center text-white">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-amber-200" />
              <h3 className="text-xl font-game font-bold mb-2 uppercase">Доказано наукой</h3>
              <p className="text-orange-100 text-sm font-medium opacity-90">
                15 минут в день повышают когнитивный тонус на 30%.
              </p>
            </div>
          </div>
        </MotionDiv>
      </section>

      {/* Final CTA */}
      <section className="bg-stone-800 rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-game font-bold mb-6">Готовы к приключениям?</h2>
          <p className="text-lg text-stone-400 mb-10 max-w-lg mx-auto">
            Умняут уже ждёт тебя! Начни своё путешествие в мир знаний прямо сейчас.
          </p>
          <MotionButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="px-10 py-4 bg-white text-stone-800 rounded-xl font-black text-base uppercase tracking-widest shadow-lg hover:bg-orange-50 transition-colors"
          >
            Начать путешествие
          </MotionButton>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-orange-500 rounded-full blur-[80px]" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-amber-500 rounded-full blur-[100px]" />
        </div>
      </section>
    </div>
  );
};

export default Landing;
