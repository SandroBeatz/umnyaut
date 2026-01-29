import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CrosswordData, Direction, UserProfile } from '../types';
import { ListFilter, ArrowDown, ArrowRight, Sparkles, Clock, HelpCircle, X, BrainCircuit, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

interface CrosswordGameProps {
  profile: UserProfile;
  onComplete: (score: number, crosswordId: string, title: string, timeSeconds: number, wordsSolved: number, category: string, solvedWords: string[]) => void;
  onCancel: () => void;
}

const HintPopup: React.FC<{ hint: string; onClose: () => void }> = ({ hint, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <MotionDiv initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lightbulb className="w-8 h-8 text-amber-600" />
      </div>
      <h3 className="text-xl font-black mb-4 uppercase">Подсказка</h3>
      <p className="text-slate-600 font-medium leading-relaxed mb-8">{hint}</p>
      <button onClick={onClose} className="w-full py-4 bg-amber-500 text-white rounded-xl font-black shadow-lg">ПОНЯТНО</button>
    </MotionDiv>
  </motion.div>
);

const CrosswordGame: React.FC<CrosswordGameProps> = ({ profile, onComplete, onCancel }) => {
  const [data, setData] = useState<CrosswordData | null>((window as any).currentCrossword || null);
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [focusedCell, setFocusedCell] = useState<{ r: number, c: number } | null>(null);
  const [activeDirection, setActiveDirection] = useState<Direction>(Direction.HORIZONTAL);
  const [solved, setSolved] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showHint, setShowHint] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);

  useEffect(() => {
    if (data) {
      setUserGrid(Array(data.grid.length).fill(null).map(() => Array(data.grid[0].length).fill('')));
    }
  }, [data]);

  useEffect(() => {
    if (!solved) {
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [solved]);

  const solvedWordIds = useMemo(() => {
    if (!data || userGrid.length === 0) return new Set<string>();
    const solvedIds = new Set<string>();
    data.words.forEach((word, idx) => {
      const { word: answer, startRow, startCol, direction } = word;
      let correct = true;
      for (let i = 0; i < answer.length; i++) {
        const r = direction === Direction.HORIZONTAL ? startRow : startRow + i;
        const c = direction === Direction.HORIZONTAL ? startCol + i : startCol;
        if (userGrid[r]?.[c]?.toUpperCase() !== answer[i].toUpperCase()) {
          correct = false;
          break;
        }
      }
      if (correct) solvedIds.add(idx.toString());
    });
    return solvedIds;
  }, [data, userGrid]);

  const checkSolution = useCallback(() => {
    if (!data) return;
    if (solvedWordIds.size === data.words.length && !solved) {
      setSolved(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      const score = Math.max(100, 500 - (hintsUsed * 25));
      setTimeout(() => onComplete(
        score,
        data.id,
        `Кроссворд: ${data.category}`,
        timer,
        data.words.length,
        data.category,
        data.words.map(w => w.word)
      ), 2000);
    }
  }, [data, solvedWordIds, solved, onComplete, timer, hintsUsed]);

  useEffect(() => { if (userGrid.length > 0) checkSolution(); }, [userGrid, checkSolution]);

  const getWordsForCell = (r: number, c: number) => {
    if (!data) return [];
    return data.words.map((w, idx) => ({ ...w, idx })).filter(w => {
      if (w.direction === Direction.HORIZONTAL) {
        return r === w.startRow && c >= w.startCol && c < w.startCol + w.length;
      }
      return c === w.startCol && r >= w.startRow && r < w.startRow + w.length;
    });
  };

  const getActiveWord = () => {
    if (!focusedCell) return null;
    const words = getWordsForCell(focusedCell.r, focusedCell.c);
    return words.find(w => w.direction === activeDirection) || words[0];
  };

  const handleCellClick = (r: number, c: number) => {
    const words = getWordsForCell(r, c);
    if (words.length === 0) return;
    if (focusedCell?.r === r && focusedCell?.c === c) {
      if (words.length > 1) setActiveDirection(d => d === Direction.HORIZONTAL ? Direction.VERTICAL : Direction.HORIZONTAL);
    } else {
      setFocusedCell({ r, c });
      if (words.length === 1) setActiveDirection(words[0].direction);
      else if (!words.some(w => w.direction === activeDirection)) setActiveDirection(words[0].direction);
    }
  };

  const handleCellKeyDown = (r: number, c: number, e: React.KeyboardEvent) => {
    if (solved || !data) return;
    const current = getActiveWord();
    if (!current) return;

    if (e.key === 'Backspace') {
      const newGrid = [...userGrid];
      newGrid[r][c] = '';
      setUserGrid(newGrid);
      const nr = current.direction === Direction.HORIZONTAL ? r : r - 1;
      const nc = current.direction === Direction.HORIZONTAL ? c - 1 : c;
      if (nr >= 0 && nc >= 0) setFocusedCell({ r: nr, c: nc });
    } else if (/^[а-яА-ЯёЁa-zA-Z]$/.test(e.key)) {
      const newGrid = [...userGrid];
      newGrid[r][c] = e.key.toUpperCase();
      setUserGrid(newGrid);
      const nr = current.direction === Direction.HORIZONTAL ? r : r + 1;
      const nc = current.direction === Direction.HORIZONTAL ? c + 1 : c;
      if (nr < data.grid.length && nc < data.grid[0].length) setFocusedCell({ r: nr, c: nc });
    }
  };

  const activeWord = getActiveWord();
  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2, '0')}`;

  if (!data) return <div className="p-20 text-center font-bold">Загрузка данных кроссворда...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center -mt-4">
        <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-lg border border-slate-100 divide-x divide-slate-100 gap-6">
          <div className="flex items-center gap-2.5 text-indigo-600 font-bold text-xl">
            <Clock className="w-5 h-5" />
            <span>{formatTime(timer)}</span>
          </div>
          <div className="pl-6 text-slate-800 font-bold text-xs uppercase tracking-widest">
            {data.category} • {data.difficulty}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        <div className="xl:flex-1 w-full bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-200/50 flex flex-col items-center">
          <div className="bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-xl grid gap-1.5 sm:gap-2 transition-all"
            style={{ 
              gridTemplateColumns: `repeat(${data.grid[0].length}, 1fr)`,
              width: '100%',
              maxWidth: '600px',
              aspectRatio: `${data.grid[0].length} / ${data.grid.length}`
            }}>
            {data.grid.map((row, r) => row.map((cell, c) => {
              const isActive = cell !== null;
              const isFocused = focusedCell?.r === r && focusedCell?.c === c;
              const val = userGrid[r]?.[c];
              const isCorrect = val === cell?.toUpperCase();
              
              if (!isActive) return <div key={`${r}-${c}`} className="aspect-square bg-white/[0.03] rounded-md" />;
              
              return (
                <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)}
                  className={`relative aspect-square flex items-center justify-center rounded-lg cursor-pointer transition-all border-b-2
                    ${isFocused ? 'bg-indigo-500 border-indigo-700 z-10 shadow-lg scale-105' : 
                      val ? (isCorrect ? 'bg-emerald-500 border-emerald-700' : 'bg-slate-700 border-slate-800') : 'bg-white border-slate-200'}
                  `}>
                  <span className={`text-sm sm:text-lg md:text-xl font-black uppercase ${isFocused || val ? 'text-white' : 'text-slate-900'}`}>
                    {val}
                  </span>
                  {isFocused && <input autoFocus className="absolute inset-0 opacity-0 cursor-none" onKeyDown={(e) => handleCellKeyDown(r, c, e)} />}
                </div>
              );
            }))}
          </div>
        </div>

        <div className="xl:w-[380px] w-full space-y-6">
          <AnimatePresence mode="wait">
            {activeWord ? (
              <MotionDiv key={activeWord.idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{activeWord.direction}</span>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase">{activeWord.length} букв</span>
                  </div>
                  <button onClick={() => { setShowHint(activeWord.hint); setHintsUsed(h => h + 1); }} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-bold text-[9px]">
                    <Lightbulb className="w-3.5 h-3.5" /> ПОДСКАЗКА
                  </button>
                </div>
                <p className="text-xl font-bold text-slate-900 leading-snug">{activeWord.clue}</p>
              </MotionDiv>
            ) : (
              <div className="bg-slate-50 p-12 rounded-2xl text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-200">Выберите слово</div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
               <ListFilter className="w-4 h-4 text-indigo-500" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Список Вопросов</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
              {[Direction.HORIZONTAL, Direction.VERTICAL].map(dir => (
                <section key={dir}>
                  <h4 className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                    {dir === Direction.HORIZONTAL ? <ArrowRight className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />} {dir === Direction.HORIZONTAL ? 'По горизонтали' : 'По вертикали'}
                  </h4>
                  <div className="space-y-1.5">
                    {data.words.map((w, idx) => ({...w, idx})).filter(w => w.direction === dir).map(w => (
                      <div key={w.idx} onClick={() => { setFocusedCell({ r: w.startRow, c: w.startCol }); setActiveDirection(dir); }}
                        className={`p-3 rounded-xl cursor-pointer transition-all border flex items-start gap-3 ${
                          activeWord?.idx === w.idx && activeDirection === dir ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' : 
                          solvedWordIds.has(w.idx.toString()) ? 'bg-emerald-50 border-emerald-100 text-emerald-900 opacity-60' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
                        }`}>
                        <span className="text-[11px] font-medium leading-normal line-clamp-2">{w.clue}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showHint && <HintPopup hint={showHint} onClose={() => setShowHint(null)} />}
    </div>
  );
};

export default CrosswordGame;
