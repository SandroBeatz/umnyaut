'use client';


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generateCrossword } from '@/lib/geminiService';
import { CrosswordData, Direction } from '@/types';
import { XCircle, ArrowLeft, ListFilter, ArrowDown, ArrowRight, Zap, Eye, EyeOff, Lock, Brain, Cpu, Sparkles, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;
const MotionH2 = motion.h2 as any;

interface CrosswordGameProps {
  categories: string[];
  onComplete: (score: number, title: string) => void;
  onCancel: () => void;
}

const LOADING_MESSAGES = [
  "Калибровка нейронов...",
  "Генерация ассоциаций...",
  "Синтез структуры...",
  "Загрузка базы знаний..."
];

const CrosswordGame: React.FC<CrosswordGameProps> = ({ categories, onComplete, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CrosswordData | null>(null);
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [focusedCell, setFocusedCell] = useState<{ r: number, c: number } | null>(null);
  const [activeDirection, setActiveDirection] = useState<Direction>(Direction.HORIZONTAL);
  const [solved, setSolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);

  const croppedData = useMemo(() => {
    if (!data) return null;
    let minR = 9, maxR = 0, minC = 9, maxC = 0;
    data.items.forEach(item => {
      const { row, col, answer, direction } = item;
      minR = Math.min(minR, row);
      minC = Math.min(minC, col);
      if (direction === Direction.HORIZONTAL) {
        maxR = Math.max(maxR, row);
        maxC = Math.max(maxC, col + answer.length - 1);
      } else {
        maxR = Math.max(maxR, row + answer.length - 1);
        maxC = Math.max(maxC, col);
      }
    });
    const MIN_SIZE = 6;
    let rows = maxR - minR + 1;
    let cols = maxC - minC + 1;
    if (rows < MIN_SIZE) {
      minR = Math.max(0, minR - Math.floor((MIN_SIZE - rows) / 2));
      rows = MIN_SIZE;
    }
    if (cols < MIN_SIZE) {
      minC = Math.max(0, minC - Math.floor((MIN_SIZE - cols) / 2));
      cols = MIN_SIZE;
    }
    return {
      minR, minC, rows, cols,
      items: data.items.map(item => ({
        ...item,
        row: item.row - minR,
        col: item.col - minC
      }))
    };
  }, [data]);

  const solvedWordIds = useMemo(() => {
    if (!data || userGrid.length === 0) return new Set<string>();
    const solvedIds = new Set<string>();
    data.items.forEach(item => {
      const { answer, row, col, direction } = item;
      let correct = true;
      for (let i = 0; i < answer.length; i++) {
        const r = direction === Direction.HORIZONTAL ? row : row + i;
        const c = direction === Direction.HORIZONTAL ? col + i : col;
        if (userGrid[r]?.[c]?.toUpperCase() !== answer[i].toUpperCase()) {
          correct = false;
          break;
        }
      }
      if (correct) solvedIds.add(item.id);
    });
    return solvedIds;
  }, [data, userGrid]);

  const lockedCells = useMemo(() => {
    if (!data || solvedWordIds.size === 0) return new Set<string>();
    const locked = new Set<string>();
    data.items.forEach(item => {
      if (solvedWordIds.has(item.id)) {
        const { answer, row, col, direction } = item;
        for (let i = 0; i < answer.length; i++) {
          const r = direction === Direction.HORIZONTAL ? row : row + i;
          const c = direction === Direction.HORIZONTAL ? col + i : col;
          locked.add(`${r},${c}`);
        }
      }
    });
    return locked;
  }, [data, solvedWordIds]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const initGame = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const crossword = await generateCrossword(categories);
      setData(crossword);
      const grid = Array(crossword.gridSize).fill(null).map(() => Array(crossword.gridSize).fill(''));
      setUserGrid(grid);
    } catch (err: any) {
      setError(err.message || "Ошибка соединения с ядром.");
    } finally {
      setLoading(false);
    }
  }, [categories]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const checkSolution = useCallback(() => {
    if (!data) return;
    if (solvedWordIds.size === data.items.length && !solved) {
      setSolved(true);
      confetti({ 
        particleCount: 200, 
        spread: 90, 
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#10b981']
      });
      setTimeout(() => onComplete(300, data.title), 2500);
    }
  }, [data, solvedWordIds, solved, onComplete]);

  useEffect(() => {
    if (userGrid.length > 0 && !solved) {
      checkSolution();
    }
  }, [userGrid, solved, checkSolution]);

  const getItemsForCell = (r: number, c: number) => {
    if (!croppedData) return [];
    return croppedData.items.filter(item => {
      const { answer, row, col, direction } = item;
      if (direction === Direction.HORIZONTAL) {
        return r === row && c >= col && c < col + answer.length;
      } else {
        return c === col && r >= row && r < row + answer.length;
      }
    });
  };

  const getActiveItem = () => {
    if (!focusedCell || !croppedData) return null;
    const cellItems = getItemsForCell(focusedCell.r, focusedCell.c);
    if (cellItems.length === 0) return null;
    const matching = cellItems.find(i => i.direction === activeDirection);
    return matching || cellItems[0];
  };

  const handleCellClick = (r: number, c: number) => {
    if (solved) return;
    const cellItems = getItemsForCell(r, c);
    if (cellItems.length === 0) return;

    if (focusedCell?.r === r && focusedCell?.c === c) {
      if (cellItems.length > 1) {
        setActiveDirection(prev => prev === Direction.HORIZONTAL ? Direction.VERTICAL : Direction.HORIZONTAL);
      }
    } else {
      setFocusedCell({ r, c });
      if (cellItems.length === 1) {
        setActiveDirection(cellItems[0].direction);
      } else if (!cellItems.some(i => i.direction === activeDirection)) {
        setActiveDirection(cellItems[0].direction);
      }
    }
  };

  const handleCellKeyDown = (r: number, c: number, e: React.KeyboardEvent) => {
    if (solved || !croppedData) return;
    const currentActiveItem = getActiveItem();
    if (!currentActiveItem) return;

    const realR = r + croppedData.minR;
    const realC = c + croppedData.minC;
    const isLocked = lockedCells.has(`${realR},${realC}`);

    if (e.key === 'Backspace') {
      if (isLocked) {
        const idx = currentActiveItem.direction === Direction.HORIZONTAL ? c - currentActiveItem.col : r - currentActiveItem.row;
        if (idx > 0) {
          const nr = currentActiveItem.direction === Direction.HORIZONTAL ? r : r - 1;
          const nc = currentActiveItem.direction === Direction.HORIZONTAL ? c - 1 : c;
          setFocusedCell({ r: nr, c: nc });
        }
        return;
      }

      const newGrid = [...userGrid];
      newGrid[realR] = [...newGrid[realR]];
      const oldVal = newGrid[realR][realC];
      newGrid[realR][realC] = '';
      setUserGrid(newGrid);

      if (!oldVal || oldVal === '') {
        const idx = currentActiveItem.direction === Direction.HORIZONTAL ? c - currentActiveItem.col : r - currentActiveItem.row;
        if (idx > 0) {
          const nr = currentActiveItem.direction === Direction.HORIZONTAL ? r : r - 1;
          const nc = currentActiveItem.direction === Direction.HORIZONTAL ? c - 1 : c;
          setFocusedCell({ r: nr, c: nc });
        }
      }
    } else if (e.key.length === 1 && /^[а-яА-ЯёЁa-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        if (isLocked) {
          const idx = currentActiveItem.direction === Direction.HORIZONTAL ? c - currentActiveItem.col : r - currentActiveItem.row;
          if (idx < currentActiveItem.answer.length - 1) {
            const nr = currentActiveItem.direction === Direction.HORIZONTAL ? r : r + 1;
            const nc = currentActiveItem.direction === Direction.HORIZONTAL ? c + 1 : c;
            setFocusedCell({ r: nr, c: nc });
          }
          return;
        }

        const char = e.key.toUpperCase();
        const newGrid = [...userGrid];
        newGrid[realR] = [...newGrid[realR]];
        newGrid[realR][realC] = char;
        setUserGrid(newGrid);

        const idx = currentActiveItem.direction === Direction.HORIZONTAL ? c - currentActiveItem.col : r - currentActiveItem.row;
        if (idx < currentActiveItem.answer.length - 1) {
          const nr = currentActiveItem.direction === Direction.HORIZONTAL ? r : r + 1;
          const nc = currentActiveItem.direction === Direction.HORIZONTAL ? c + 1 : c;
          setFocusedCell({ r: nr, c: nc });
        }
    } else if (e.key.startsWith('Arrow')) {
        if (e.key === 'ArrowRight' && c < croppedData.cols - 1) setFocusedCell({ r, c: c + 1 });
        if (e.key === 'ArrowLeft' && c > 0) setFocusedCell({ r, c: c - 1 });
        if (e.key === 'ArrowDown' && r < croppedData.rows - 1) setFocusedCell({ r: r + 1, c });
        if (e.key === 'ArrowUp' && r > 0) setFocusedCell({ r: r - 1, c });
    }
  };

  // NEW: Highlight all words passing through the focused cell
  const highlightedCells = useMemo(() => {
    if (!focusedCell || !croppedData) return [];
    const passingWords = getItemsForCell(focusedCell.r, focusedCell.c);
    const cells: {r: number, c: number}[] = [];
    passingWords.forEach(word => {
      for (let i = 0; i < word.answer.length; i++) {
        cells.push({
          r: word.direction === Direction.HORIZONTAL ? word.row : word.row + i,
          c: word.direction === Direction.HORIZONTAL ? word.col + i : word.col
        });
      }
    });
    return cells;
  }, [focusedCell, croppedData]);

  const activeItem = getActiveItem();

  if (loading || !croppedData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-20">
        <MotionDiv 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl mb-10"
        >
          <Brain className="w-16 h-16 text-white" />
        </MotionDiv>
        <AnimatePresence mode="wait">
          <MotionH2 
            key={loadingMsgIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-2xl font-extrabold text-slate-800 uppercase tracking-widest"
          >
            {LOADING_MESSAGES[loadingMsgIdx]}
          </MotionH2>
        </AnimatePresence>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-white rounded-[3rem] border border-red-100 max-w-lg mx-auto shadow-2xl">
        <XCircle className="w-24 h-24 text-red-500 mx-auto mb-8" />
        <h3 className="text-3xl font-extrabold text-slate-900 mb-4 uppercase">Сбой системы</h3>
        <p className="text-slate-500 font-bold mb-10 px-10">{error}</p>
        <button onClick={initGame} className="px-14 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Повторить попытку</button>
      </div>
    );
  }

  const hClues = croppedData.items.filter(i => i.direction === Direction.HORIZONTAL);
  const vClues = croppedData.items.filter(i => i.direction === Direction.VERTICAL);

  return (
    <div className="flex flex-col xl:flex-row gap-12 items-stretch min-h-[70vh] pb-32">
      
      {/* MOBILE FLOATING CLUE */}
      <AnimatePresence>
        {activeItem && (
          <MotionDiv 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-4 right-4 z-[100] md:hidden"
          >
            <div className={`
              ${solvedWordIds.has(activeItem.id) ? 'bg-emerald-600' : 'bg-slate-900/95'} 
              backdrop-blur-xl text-white rounded-[2.5rem] p-6 shadow-2xl flex items-center justify-between gap-5 border-b-8 
              ${solvedWordIds.has(activeItem.id) ? 'border-emerald-800' : 'border-indigo-600'}
            `}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg ${solvedWordIds.has(activeItem.id) ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                  {solvedWordIds.has(activeItem.id) ? <Lock className="w-6 h-6 text-white" /> : activeItem.id}
                </div>
                <p className="font-bold text-lg leading-snug">{activeItem.clue}</p>
              </div>
              <button onClick={() => setFocusedCell(null)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                <XCircle className="w-7 h-7" />
              </button>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: GAME FIELD */}
      <div className="xl:flex-1 bg-white p-6 md:p-14 rounded-[4rem] border border-slate-200/50 shadow-2xl shadow-slate-200/50 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-12">
          <div className="flex items-center gap-5">
             <div className="p-4 bg-indigo-50 rounded-2xl">
                <Sparkles className="w-7 h-7 text-indigo-600" />
             </div>
             <h2 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">{data?.title}</h2>
          </div>
          <button onClick={onCancel} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all"><ArrowLeft className="w-6 h-6"/></button>
        </div>

        <div className="w-full max-w-lg">
          <div 
            className="bg-slate-900 p-5 md:p-8 rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] grid gap-2 md:gap-3 border-b-[12px] border-slate-950/80 transition-all"
            style={{ gridTemplateColumns: `repeat(${croppedData.cols}, 1fr)` }}
          >
            {Array.from({ length: croppedData.rows }).map((_, r) => 
              Array.from({ length: croppedData.cols }).map((_, c) => {
                const isActive = getItemsForCell(r, c).length > 0;
                const isFocused = focusedCell?.r === r && focusedCell?.c === c;
                const isHighlighted = highlightedCells.some(cell => cell.r === r && cell.c === c);
                
                // NEW: Handle multiple labels in one cell
                const cellLabels = croppedData.items.filter(i => i.row === r && i.col === c).map(i => i.id);
                const label = cellLabels.length > 1 ? cellLabels.join('/') : cellLabels[0];

                const realR = r + croppedData.minR;
                const realC = c + croppedData.minC;
                const isLocked = lockedCells.has(`${realR},${realC}`);
                const val = userGrid[realR]?.[realC] || '';
                
                if (!isActive) return <div key={`${r}-${c}`} className="aspect-square bg-white/[0.03] rounded-xl" />;

                return (
                  <div 
                    key={`${r}-${c}`} 
                    onClick={() => handleCellClick(r, c)}
                    className={`
                      relative aspect-square flex items-center justify-center rounded-xl md:rounded-2xl cursor-pointer transition-all border-b-[3px] md:border-b-[5px]
                      ${isFocused ? 'bg-indigo-500 border-indigo-700 z-10 scale-110 shadow-indigo-500/50 pulse-active' : 
                        isLocked ? 'bg-emerald-500 border-emerald-700 shadow-emerald-500/30' :
                        val !== '' ? 'bg-slate-700 border-slate-800' :
                        isHighlighted ? 'bg-indigo-600/30 border-indigo-500/40' : 'bg-white border-slate-300 shadow-sm'}
                    `}
                  >
                    {label && <span className={`absolute top-0.5 left-1.5 text-[8px] md:text-[10px] leading-none font-black ${isFocused || isLocked || val !== '' ? 'text-white/40' : 'text-slate-400'}`}>{label}</span>}
                    <span className={`text-xl md:text-3xl font-extrabold uppercase ${isFocused || isLocked || val !== '' || solved ? 'text-white' : 'text-slate-800'}`}>
                      {val}
                    </span>
                    {isFocused && <input autoFocus className="absolute inset-0 opacity-0 cursor-none" onKeyDown={(e) => handleCellKeyDown(r, c, e)} />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="w-full mt-20 pt-10 border-t border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.5em]">Архив Синапсов</h3>
            <button onClick={() => setShowAnswers(!showAnswers)} className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-3">
              {showAnswers ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              {showAnswers ? 'СКРЫТЬ ОТВЕТЫ' : 'РАСКРЫТЬ ОТВЕТЫ'}
            </button>
          </div>
          <AnimatePresence>
            {showAnswers && (
              <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid grid-cols-1 gap-4 overflow-hidden">
                {croppedData.items.map(item => (
                  <div key={item.id} className="bg-slate-50 p-5 rounded-3xl flex items-center justify-between border border-slate-200/50">
                    <div className="flex items-center gap-5">
                       <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-indigo-600 text-sm shadow-sm">{item.id}</span>
                       <p className="text-sm font-bold text-slate-500 italic max-w-[200px] truncate">{item.clue}</p>
                    </div>
                    <span className={`px-5 py-2 rounded-2xl font-black text-sm ${solvedWordIds.has(item.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{item.answer}</span>
                  </div>
                ))}
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT COLUMN: SIDEBAR */}
      <div className="xl:flex-1 flex flex-col gap-8 h-full sticky top-36 overflow-visible">
        
        {/* ACTIVE CLUE PANEL */}
        <AnimatePresence mode="wait">
          {activeItem ? (
            <MotionDiv 
              key={activeItem.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className={`${solvedWordIds.has(activeItem.id) ? 'bg-emerald-50 border-emerald-200 shadow-emerald-50' : 'bg-white border-slate-200 shadow-xl shadow-slate-100'} p-8 rounded-[3.5rem] border-2 transition-all flex items-start gap-8`}
            >
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shrink-0 shadow-2xl ${solvedWordIds.has(activeItem.id) ? 'bg-emerald-500' : 'bg-slate-900'}`}>
                {solvedWordIds.has(activeItem.id) ? <Lock className="w-10 h-10" /> : activeItem.id}
              </div>
              <div className="flex-1 pt-2">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 block ${solvedWordIds.has(activeItem.id) ? 'text-emerald-500' : 'text-indigo-500'}`}>
                  {activeItem.direction === Direction.HORIZONTAL ? 'Горизонталь' : 'Вертикаль'} • {activeItem.answer.length} Букв
                </span>
                <p className="text-2xl font-extrabold text-slate-900 leading-tight">{activeItem.clue}</p>
              </div>
            </MotionDiv>
          ) : (
             <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 p-10 rounded-[3.5rem] text-center flex flex-col items-center justify-center gap-4 text-slate-400 min-h-[160px]">
                <Cpu className="w-10 h-10 opacity-30" />
                <p className="text-sm font-extrabold uppercase tracking-widest">Выберите ячейку для анализа</p>
             </div>
          )}
        </AnimatePresence>

        {/* LIST OF ALL CLUES - Fixed clipping issues */}
        <div className="bg-white p-10 rounded-[4rem] border border-slate-200/50 shadow-2xl flex-1 flex flex-col relative z-0 overflow-visible">
          <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-6 shrink-0">
             <ListFilter className="w-6 h-6 text-indigo-600" />
             <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-[0.2em]">Матрица заданий</h3>
          </div>
          {/* Added px-6 to prevent clipping of scaled items */}
          <div className="flex-1 overflow-y-auto overflow-x-visible px-6 custom-scrollbar space-y-12 pb-10">
            <section className="overflow-visible">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3"><ArrowRight className="w-4 h-4" /> По Горизонтали</h4>
               {hClues.map(item => (
                 <div 
                   key={item.id} 
                   onClick={() => { setFocusedCell({ r: item.row, c: item.col }); setActiveDirection(Direction.HORIZONTAL); }}
                   className={`group p-5 rounded-3xl mb-4 border-2 transition-all cursor-pointer flex items-start gap-4 ${
                     activeItem?.id === item.id && activeItem.direction === Direction.HORIZONTAL ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl scale-[1.03]' : 
                     solvedWordIds.has(item.id) ? 'bg-emerald-50 border-emerald-100 text-emerald-900 opacity-60' : 'bg-slate-50 border-transparent hover:bg-white hover:border-indigo-100'
                   }`}
                 >
                   <b className="mt-1">{solvedWordIds.has(item.id) ? '✓' : item.id + '.'}</b>
                   <span className="font-bold text-sm leading-relaxed">{item.clue}</span>
                 </div>
               ))}
            </section>
            <section className="overflow-visible">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3"><ArrowDown className="w-4 h-4" /> По Вертикали</h4>
               {vClues.map(item => (
                 <div 
                   key={item.id} 
                   onClick={() => { setFocusedCell({ r: item.row, c: item.col }); setActiveDirection(Direction.VERTICAL); }}
                   className={`group p-5 rounded-3xl mb-4 border-2 transition-all cursor-pointer flex items-start gap-4 ${
                     activeItem?.id === item.id && activeItem.direction === Direction.VERTICAL ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl scale-[1.03]' : 
                     solvedWordIds.has(item.id) ? 'bg-emerald-50 border-emerald-100 text-emerald-900 opacity-60' : 'bg-slate-50 border-transparent hover:bg-white hover:border-indigo-100'
                   }`}
                 >
                   <b className="mt-1">{solvedWordIds.has(item.id) ? '✓' : item.id + '.'}</b>
                   <span className="font-bold text-sm leading-relaxed">{item.clue}</span>
                 </div>
               ))}
            </section>
          </div>
        </div>

        {/* GAMIFIED STATUS BAR */}
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex items-center gap-6 shadow-2xl shrink-0 border-b-8 border-indigo-900">
           <Zap className="w-10 h-10 text-amber-400 shrink-0 animate-pulse" />
           <div className="flex flex-col">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Системный совет</p>
              <p className="text-xs font-bold text-slate-300 leading-snug">Верно разгаданные слова блокируются для защиты данных.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CrosswordGame;
