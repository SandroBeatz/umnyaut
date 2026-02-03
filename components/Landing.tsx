'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Target, Cpu, Sparkles, Trophy, Lightbulb, ShieldCheck, Users, Star, Grid3X3 } from 'lucide-react';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface LandingProps {
  onStart: () => void;
  isLoggedIn: boolean;
}

const Landing: React.FC<LandingProps> = ({ onStart, isLoggedIn }) => {
  return (
    <div className="space-y-12 md:space-y-24 pb-12 md:pb-20">
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
            className="w-24 h-24 md:w-40 md:h-40 mx-auto mb-6 md:mb-8"
          >
            <img
              src="/logo.png"
              alt="Умняут"
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </MotionDiv>

          <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1 md:py-1.5 bg-orange-50 rounded-full text-orange-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-6 md:mb-8 border border-orange-200">
            <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />
            Познавай мир с Умняутом
          </div>
          <h1 className="text-3xl md:text-6xl lg:text-7xl font-game font-bold text-stone-800 leading-[1.1] mb-6 md:mb-8 tracking-tight">
            Интеллектуальные <br /> головоломки с{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
              умным котиком
            </span>
          </h1>
          <p className="text-base md:text-xl text-stone-500 font-medium leading-relaxed mb-8 md:mb-12 max-w-2xl mx-auto px-4">
            Умняут — твой любознательный помощник в мире головоломок. Он создаёт уникальные
            кроссворды, адаптируясь под твои интересы и уровень знаний.
          </p>
          <MotionButton
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="px-8 md:px-10 py-4 md:py-5 bg-stone-800 text-white rounded-2xl font-black text-base md:text-lg shadow-xl shadow-orange-200 uppercase tracking-widest flex items-center gap-3 md:gap-4 mx-auto group"
          >
            <span className="text-sm md:text-base">{isLoggedIn ? 'Вернуться в игру' : 'Начать играть'}</span>
            <div className="bg-orange-500 p-1.5 rounded-full group-hover:rotate-45 transition-transform">
              <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 fill-white text-white" />
            </div>
          </MotionButton>
        </MotionDiv>

        {/* Decorative Grid */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full opacity-[0.03] pointer-events-none -z-10">
          <div className="w-full h-full bg-[radial-gradient(#f97316_1.5px,transparent_1.5px)] [background-size:40px_40px]" />
        </div>
      </section>

      {/* Why Crosswords? Section - Scaled Down */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-20 items-center px-4">
        <MotionDiv
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6 md:space-y-8"
        >
          <h2 className="text-2xl md:text-5xl font-game font-bold text-stone-800 leading-tight">
            Почему с Умняутом <br /> <span className="text-orange-500">интереснее?</span>
          </h2>
          <div className="space-y-4 md:space-y-6">
            <div className="flex gap-3 md:gap-4">
              <div className="bg-amber-50 p-3 md:p-4 rounded-2xl shrink-0 border border-amber-100">
                <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
              </div>
              <div>
                <h4 className="text-base md:text-lg font-black text-stone-700 mb-1 uppercase tracking-tight">
                  Тренировка ума
                </h4>
                <p className="text-xs md:text-sm text-stone-500 font-medium leading-relaxed">
                  Решение кроссвордов создаёт новые нейронные связи и поддерживает мозг в тонусе.
                </p>
              </div>
            </div>
            <div className="flex gap-3 md:gap-4">
              <div className="bg-sky-50 p-3 md:p-4 rounded-2xl shrink-0 border border-sky-100">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-sky-500" />
              </div>
              <div>
                <h4 className="text-base md:text-lg font-black text-stone-700 mb-1 uppercase tracking-tight">
                  Релакс и удовольствие
                </h4>
                <p className="text-xs md:text-sm text-stone-500 font-medium leading-relaxed">
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
          className="relative px-4"
        >
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-8 md:p-10 aspect-video flex items-center justify-center shadow-2xl">
            <Brain className="w-full h-full text-white/10 absolute rotate-12" />
            <div className="relative z-10 text-center text-white">
              <Trophy className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-amber-200" />
              <h3 className="text-lg md:text-xl font-game font-bold mb-2 uppercase">Доказано наукой</h3>
              <p className="text-orange-100 text-xs md:text-sm font-medium opacity-90">
                15 минут в день повышают когнитивный тонус на 30%.
              </p>
            </div>
          </div>
        </MotionDiv>
      </section>

      {/* Social Proof Section */}
      <section className="text-center px-4">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8 md:space-y-12"
        >
          <div>
            <h2 className="text-2xl md:text-4xl font-game font-bold text-stone-800 mb-3 md:mb-4">
              Присоединяйся к <span className="text-orange-500">умникам</span>
            </h2>
            <p className="text-sm md:text-base text-stone-500 font-medium max-w-lg mx-auto px-4">
              Тысячи игроков уже тренируют свой мозг вместе с Умняутом
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-slate-100">
              <div className="bg-orange-100 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Users className="w-6 h-6 md:w-7 md:h-7 text-orange-600" />
              </div>
              <div className="text-3xl md:text-4xl font-black text-stone-800 mb-1">1,200+</div>
              <div className="text-xs md:text-sm font-bold text-stone-400 uppercase tracking-wider">Игроков</div>
            </div>
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-slate-100">
              <div className="bg-amber-100 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Grid3X3 className="w-6 h-6 md:w-7 md:h-7 text-amber-600" />
              </div>
              <div className="text-3xl md:text-4xl font-black text-stone-800 mb-1">5,000+</div>
              <div className="text-xs md:text-sm font-bold text-stone-400 uppercase tracking-wider">Кроссвордов решено</div>
            </div>
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-slate-100">
              <div className="bg-emerald-100 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Star className="w-6 h-6 md:w-7 md:h-7 text-emerald-600" />
              </div>
              <div className="text-3xl md:text-4xl font-black text-stone-800 mb-1">4.9</div>
              <div className="text-xs md:text-sm font-bold text-stone-400 uppercase tracking-wider">Средняя оценка</div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-slate-50 to-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-1 justify-center mb-3 md:mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 md:w-5 md:h-5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-base md:text-lg text-stone-600 font-medium italic mb-4 md:mb-6">
              "Умняут — отличный способ провести время с пользой. Каждый день решаю по кроссворду, и чувствую как мозг работает лучше!"
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-sm md:text-base">
                А
              </div>
              <div className="text-left">
                <div className="font-bold text-sm md:text-base text-stone-800">Анна К.</div>
                <div className="text-xs text-stone-400">Играет 3 месяца</div>
              </div>
            </div>
          </div>
        </MotionDiv>
      </section>

      {/* Final CTA */}
      <section className="bg-stone-800 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden mx-4">
        <div className="relative z-10">
          <h2 className="text-2xl md:text-5xl font-game font-bold mb-4 md:mb-6">Готовы к приключениям?</h2>
          <p className="text-base md:text-lg text-stone-400 mb-8 md:mb-10 max-w-lg mx-auto">
            Умняут уже ждёт тебя! Начни своё путешествие в мир знаний прямо сейчас.
          </p>
          <MotionButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="px-8 md:px-10 py-3 md:py-4 bg-white text-stone-800 rounded-xl font-black text-sm md:text-base uppercase tracking-widest shadow-lg hover:bg-orange-50 transition-colors"
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
