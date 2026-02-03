'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CrosswordData, Direction, UserProfile } from '../types';
import {
  ListFilter,
  ArrowDown,
  ArrowRight,
  Sparkles,
  Clock,
  HelpCircle,
  X,
  BrainCircuit,
  Lightbulb,
  Pause,
  Play,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

interface CrosswordGameProps {
  profile: UserProfile;
  crosswordData: CrosswordData | null;
  onComplete: (
    score: number,
    crosswordId: string,
    title: string,
    timeSeconds: number,
    wordsSolved: number,
    category: string,
    solvedWords: string[]
  ) => void;
  onCancel: () => void;
}

const HintPopup: React.FC<{
  hint: string;
  letters?: string;
  showLetters: boolean;
  onShowLetters: () => void;
  onClose: () => void;
}> = ({ hint, letters, showLetters, onShowLetters, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    onClick={onClose}
  >
    <MotionDiv
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-amber-100">
        <Lightbulb className="w-8 h-8 text-amber-600" />
      </div>
      <h3 className="text-xl font-black mb-4 uppercase">Подсказка</h3>
      <p className="text-slate-600 font-medium leading-relaxed mb-6">{hint}</p>

      {showLetters && letters && (
        <div className="bg-sky-50 rounded-xl p-4 mb-6">
          <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">
            Буквы слова
          </p>
          <p className="font-mono tracking-[0.3em] text-xl text-sky-700 font-black">{letters}</p>
        </div>
      )}

      <div className="flex gap-3">
        {!showLetters && (
          <button
            onClick={onShowLetters}
            className="flex-1 py-4 bg-sky-100 text-sky-600 rounded-xl font-black"
          >
            БУКВЫ
          </button>
        )}
        <button
          onClick={onClose}
          className={`${showLetters ? 'w-full' : 'flex-1'} py-4 bg-amber-500 text-white rounded-xl font-black shadow-lg`}
        >
          ПОНЯТНО
        </button>
      </div>
    </MotionDiv>
  </motion.div>
);

// Функция перемешивания букв
const shuffleWord = (word: string): string => {
  const letters = word.toUpperCase().split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters.join(' ');
};

const CrosswordGame: React.FC<CrosswordGameProps> = ({
  profile,
  crosswordData,
  onComplete,
  onCancel,
}) => {
  const [data, setData] = useState<CrosswordData | null>(crosswordData);
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [focusedCell, setFocusedCell] = useState<{ r: number; c: number } | null>(null);
  const [activeDirection, setActiveDirection] = useState<Direction>(Direction.HORIZONTAL);
  const [solved, setSolved] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showHint, setShowHint] = useState<{
    hint: string;
    word: string;
    showLetters: boolean;
  } | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (data) {
      setUserGrid(
        Array(data.grid.length)
          .fill(null)
          .map(() => Array(data.grid[0].length).fill(''))
      );
    }
  }, [data]);

  useEffect(() => {
    if (!solved && !isPaused) {
      const interval = setInterval(() => setTimer((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [solved, isPaused]);

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

  // Вычисление номеров ячеек для отображения
  const cellNumbers = useMemo(() => {
    if (!data) return new Map<string, number>();
    const numbers = new Map<string, number>();
    // Сортируем слова по позиции (сверху-вниз, слева-направо)
    const sortedWords = [...data.words].sort((a, b) => {
      if (a.startRow !== b.startRow) return a.startRow - b.startRow;
      return a.startCol - b.startCol;
    });
    let num = 1;
    sortedWords.forEach((word) => {
      const key = `${word.startRow}-${word.startCol}`;
      if (!numbers.has(key)) {
        numbers.set(key, num++);
      }
    });
    return numbers;
  }, [data]);

  const checkSolution = useCallback(() => {
    if (!data) return;
    if (solvedWordIds.size === data.words.length && !solved) {
      setSolved(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      const score = Math.max(100, 500 - hintsUsed * 25);
      setTimeout(
        () =>
          onComplete(
            score,
            data.id,
            `Кроссворд: ${data.category}`,
            timer,
            data.words.length,
            data.category,
            data.words.map((w) => w.word)
          ),
        2000
      );
    }
  }, [data, solvedWordIds, solved, onComplete, timer, hintsUsed]);

  useEffect(() => {
    if (userGrid.length > 0) checkSolution();
  }, [userGrid, checkSolution]);

  const getWordsForCell = (r: number, c: number) => {
    if (!data) return [];
    return data.words
      .map((w, idx) => ({ ...w, idx }))
      .filter((w) => {
        if (w.direction === Direction.HORIZONTAL) {
          return r === w.startRow && c >= w.startCol && c < w.startCol + w.length;
        }
        return c === w.startCol && r >= w.startRow && r < w.startRow + w.length;
      });
  };

  const getActiveWord = () => {
    if (!focusedCell) return null;
    const words = getWordsForCell(focusedCell.r, focusedCell.c);
    return words.find((w) => w.direction === activeDirection) || words[0];
  };

  // Проверка принадлежности ячейки активному слову (для подсветки)
  const isInActiveWord = useCallback(
    (r: number, c: number) => {
      const activeWord = getActiveWord();
      if (!activeWord) return false;
      if (activeWord.direction === Direction.HORIZONTAL) {
        return (
          r === activeWord.startRow &&
          c >= activeWord.startCol &&
          c < activeWord.startCol + activeWord.length
        );
      }
      return (
        c === activeWord.startCol &&
        r >= activeWord.startRow &&
        r < activeWord.startRow + activeWord.length
      );
    },
    [focusedCell, activeDirection]
  );

  // Проверка принадлежности ячейки решённому слову
  const isCellSolved = useCallback(
    (r: number, c: number) => {
      const words = getWordsForCell(r, c);
      return words.some((w) => solvedWordIds.has(w.idx.toString()));
    },
    [solvedWordIds]
  );

  // Проверяет, есть ли у ячейки нерешённые слова
  const hasUnsolvedWord = useCallback(
    (r: number, c: number) => {
      const words = getWordsForCell(r, c);
      return words.some((w) => !solvedWordIds.has(w.idx.toString()));
    },
    [solvedWordIds]
  );

  const handleCellClick = (r: number, c: number) => {
    // Блокируем клики только если ВСЕ слова ячейки решены
    if (!hasUnsolvedWord(r, c)) return;
    const words = getWordsForCell(r, c);
    if (words.length === 0) return;

    // Фильтруем только нерешённые слова для переключения
    const unsolvedWords = words.filter((w) => !solvedWordIds.has(w.idx.toString()));

    if (focusedCell?.r === r && focusedCell?.c === c) {
      // При повторном клике переключаем только между нерешёнными словами
      if (unsolvedWords.length > 1) {
        setActiveDirection((d) =>
          d === Direction.HORIZONTAL ? Direction.VERTICAL : Direction.HORIZONTAL
        );
      }
    } else {
      setFocusedCell({ r, c });
      if (unsolvedWords.length === 1) {
        setActiveDirection(unsolvedWords[0].direction);
      } else if (!unsolvedWords.some((w) => w.direction === activeDirection)) {
        setActiveDirection(unsolvedWords[0].direction);
      }
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
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Сброс фокуса при клике вне сетки
  const handleOutsideClick = useCallback(() => {
    setFocusedCell(null);
  }, []);

  if (!data) return <div className="p-20 text-center font-bold">Загрузка данных кроссворда...</div>;

  return (
    <div className="flex flex-col gap-6" onClick={handleOutsideClick}>
      <div className="flex justify-center -mt-4" onClick={(e) => e.stopPropagation()}>
        <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-lg border border-slate-100 divide-x divide-slate-100 gap-6">
          <div className="flex items-center gap-2.5 text-orange-600 font-bold text-xl">
            <Clock className="w-5 h-5" />
            <span>{formatTime(timer)}</span>
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="ml-2 w-8 h-8 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center transition-colors"
            >
              {isPaused ? (
                <Play className="w-4 h-4 text-orange-600" />
              ) : (
                <Pause className="w-4 h-4 text-orange-600" />
              )}
            </button>
          </div>
          <div className="pl-6 text-slate-800 font-bold text-xs uppercase tracking-widest">
            {data.category} • {data.difficulty}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        <div className="xl:flex-1 w-full bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-200/50 flex flex-col items-center relative">
          {isPaused && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20">
              <button
                onClick={() => setIsPaused(false)}
                className="flex items-center gap-3 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-lg shadow-xl transition-colors"
              >
                <Play className="w-6 h-6" />
                ПРОДОЛЖИТЬ
              </button>
            </div>
          )}
          <div
            className="bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-xl grid gap-1.5 sm:gap-2 transition-all"
            onClick={(e) => e.stopPropagation()}
            style={{
              gridTemplateColumns: `repeat(${data.grid[0].length}, 1fr)`,
              width: '100%',
              maxWidth: '600px',
              aspectRatio: `${data.grid[0].length} / ${data.grid.length}`,
            }}
          >
            {data.grid.map((row, r) =>
              row.map((cell, c) => {
                const isActive = cell !== null && cell !== '';
                const isFocused = focusedCell?.r === r && focusedCell?.c === c;
                const val = userGrid[r]?.[c];
                const cellIsSolved = isCellSolved(r, c);
                const cellHasUnsolved = hasUnsolvedWord(r, c);
                const isHighlighted = isInActiveWord(r, c);
                const cellNumber = cellNumbers.get(`${r}-${c}`);

                if (!isActive)
                  return (
                    <div key={`${r}-${c}`} className="aspect-square bg-white/[0.03] rounded-md" />
                  );

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`relative aspect-square flex items-center justify-center rounded-lg transition-all border-b-2
                    ${
                      cellIsSolved
                        ? `bg-emerald-500 border-emerald-700 ${cellHasUnsolved ? 'cursor-pointer' : 'cursor-not-allowed'}`
                        : isFocused
                          ? 'bg-orange-500 border-orange-600 z-10 shadow-lg scale-105 cursor-pointer ring-4 ring-orange-300'
                          : isHighlighted
                            ? 'bg-orange-100 border-orange-300 cursor-pointer'
                            : val
                              ? 'bg-slate-700 border-slate-800 cursor-pointer'
                              : 'bg-white border-slate-200 cursor-pointer'
                    }
                  `}
                  >
                    {cellNumber && (
                      <span
                        className={`absolute top-0.5 left-1 text-[8px] font-bold ${
                          cellIsSolved || isFocused
                            ? 'text-white/70'
                            : isHighlighted
                              ? 'text-orange-500'
                              : 'text-slate-500'
                        }`}
                      >
                        {cellNumber}
                      </span>
                    )}
                    <span
                      className={`text-sm sm:text-lg md:text-xl font-black uppercase ${
                        cellIsSolved || isFocused
                          ? 'text-white'
                          : isHighlighted
                            ? 'text-orange-900'
                            : val
                              ? 'text-white'
                              : 'text-slate-900'
                      }`}
                    >
                      {val}
                    </span>
                    {isFocused && (
                      <input
                        autoFocus
                        className="absolute inset-0 opacity-0 cursor-none"
                        onKeyDown={(e) => handleCellKeyDown(r, c, e)}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="xl:w-[380px] w-full space-y-6" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence mode="wait">
            {activeWord ? (
              <MotionDiv
                key={activeWord.idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">
                      {activeWord.direction}
                    </span>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase">
                      {activeWord.length} букв
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowHint({
                        hint: activeWord.hint,
                        word: activeWord.word,
                        showLetters: false,
                      });
                      setHintsUsed((h) => h + 1);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-bold text-[9px]"
                  >
                    <Lightbulb className="w-3.5 h-3.5" /> ПОДСКАЗКА
                  </button>
                </div>
                <p className="text-xl font-bold text-slate-900 leading-snug">{activeWord.clue}</p>
              </MotionDiv>
            ) : (
              <div className="bg-slate-50 p-12 rounded-2xl text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-200">
                Выберите слово
              </div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col max-h-[500px]">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-orange-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                Список Вопросов
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
              {[Direction.HORIZONTAL, Direction.VERTICAL].map((dir) => (
                <section key={dir}>
                  <h4 className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                    {dir === Direction.HORIZONTAL ? (
                      <ArrowRight className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}{' '}
                    {dir === Direction.HORIZONTAL ? 'По горизонтали' : 'По вертикали'}
                  </h4>
                  <div className="space-y-1.5">
                    {data.words
                      .map((w, idx) => ({ ...w, idx }))
                      .filter((w) => w.direction === dir)
                      .map((w) => {
                        const wordNumber = cellNumbers.get(`${w.startRow}-${w.startCol}`);
                        return (
                          <div
                            key={w.idx}
                            onClick={() => {
                              setFocusedCell({ r: w.startRow, c: w.startCol });
                              setActiveDirection(dir);
                            }}
                            className={`p-3 rounded-xl cursor-pointer transition-all border flex items-start gap-3 ${
                              activeWord?.idx === w.idx && activeDirection === dir
                                ? 'bg-orange-500 border-orange-600 text-white shadow-md'
                                : solvedWordIds.has(w.idx.toString())
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-900 opacity-60'
                                  : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
                            }`}
                          >
                            <span className="font-black text-orange-500 min-w-[20px]">
                              {wordNumber}.
                            </span>
                            <span className="text-[11px] font-medium leading-normal line-clamp-2">
                              {w.clue}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showHint && (
        <HintPopup
          hint={showHint.hint}
          letters={showHint.showLetters ? shuffleWord(showHint.word) : undefined}
          showLetters={showHint.showLetters}
          onShowLetters={() => {
            setShowHint({ ...showHint, showLetters: true });
            setHintsUsed((h) => h + 1);
          }}
          onClose={() => setShowHint(null)}
        />
      )}
    </div>
  );
};

export default CrosswordGame;
