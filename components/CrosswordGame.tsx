'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CrosswordData, Direction, UserProfile, SavedGameState, SAVED_GAME_KEY } from '../types';
import {
  ListFilter,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  HelpCircle,
  X,
  BrainCircuit,
  Lightbulb,
  Pause,
  Play,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

export interface GameCompletionStats {
  score: number;
  crosswordId: string;
  title: string;
  timeSeconds: number;
  wordsSolved: number;
  category: string;
  solvedWords: string[];
  grid: string[][];
  difficulty: 'easy' | 'medium' | 'hard';
  hintsUsed: number;
  lettersRevealed: number;
  wordsWithoutHints: number;
  speedBonus: boolean;
  perfectGame: boolean;
}

interface CrosswordGameProps {
  profile: UserProfile;
  crosswordData: CrosswordData | null;
  savedState?: SavedGameState | null;
  onComplete: (stats: GameCompletionStats) => void;
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
            БУКВЫ (-25%)
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

// Score popup animation component
const ScorePopup: React.FC<{ score: number; x: number; y: number }> = ({ score, x, y }) => (
  <motion.div
    initial={{ opacity: 0, y: 0, scale: 0.5 }}
    animate={{ opacity: [0, 1, 1, 0], y: -80, scale: [0.5, 1.2, 1, 0.8] }}
    transition={{ duration: 1.5, ease: 'easeOut' }}
    className="fixed pointer-events-none z-[400] font-black text-3xl text-emerald-500 drop-shadow-lg"
    style={{ left: `${x}%`, top: `${y}%` }}
  >
    +{score}
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
  savedState,
  onComplete,
  onCancel,
}) => {
  const [data, setData] = useState<CrosswordData | null>(
    savedState?.crosswordData || crosswordData
  );
  const [userGrid, setUserGrid] = useState<string[][]>(savedState?.userGrid || []);
  const [focusedCell, setFocusedCell] = useState<{ r: number; c: number } | null>(null);
  const [activeDirection, setActiveDirection] = useState<Direction>(Direction.HORIZONTAL);
  const [solved, setSolved] = useState(false);
  const [timer, setTimer] = useState(savedState?.timer || 0);
  const [showHint, setShowHint] = useState<{
    hint: string;
    word: string;
    wordIdx: number;
    showLetters: boolean;
  } | null>(null);
  // Track penalty per word to avoid double-counting
  const [wordPenalties, setWordPenalties] = useState<
    Map<number, { hint: boolean; letters: boolean }>
  >(savedState?.wordPenalties ? new Map(savedState.wordPenalties) : new Map());
  const [isPaused, setIsPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [scorePopups, setScorePopups] = useState<
    { id: number; score: number; x: number; y: number }[]
  >([]);
  const [prevSolvedCount, setPrevSolvedCount] = useState(0);

  // Calculate total penalty percentage
  const totalPenaltyPercent = useMemo(() => {
    let penalty = 0;
    wordPenalties.forEach((p) => {
      if (p.hint) penalty += 10; // -10% for hint
      if (p.letters) penalty += 25; // -25% for showing letters
    });
    return Math.min(penalty, 90); // Cap at 90% penalty
  }, [wordPenalties]);

  // Initialize userGrid only if not restored from saved state
  useEffect(() => {
    if (data && userGrid.length === 0) {
      setUserGrid(
        Array(data.grid.length)
          .fill(null)
          .map(() => Array(data.grid[0].length).fill(''))
      );
    }
  }, [data, userGrid.length]);

  useEffect(() => {
    if (!solved && !isPaused) {
      const interval = setInterval(() => setTimer((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [solved, isPaused]);

  // Auto-save game state
  useEffect(() => {
    if (data && userGrid.length > 0 && !solved) {
      const gameState: SavedGameState = {
        crosswordData: data,
        userGrid,
        timer,
        wordPenalties: Array.from(wordPenalties.entries()),
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(gameState));
    }
  }, [data, userGrid, timer, wordPenalties, solved]);

  // Clear saved state on completion
  const clearSavedGame = useCallback(() => {
    localStorage.removeItem(SAVED_GAME_KEY);
  }, []);

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
      // Base score depends on difficulty
      const baseScore = data.difficulty === 'easy' ? 300 : data.difficulty === 'medium' ? 500 : 750;

      // Calculate hint stats first (needed for accuracy bonus)
      let hintsUsed = 0;
      let lettersRevealed = 0;
      wordPenalties.forEach((p) => {
        if (p.hint) hintsUsed++;
        if (p.letters) lettersRevealed++;
      });
      const wordsWithoutHints = data.words.length - wordPenalties.size;
      const isPerfectGame = wordPenalties.size === 0;

      // Check for speed bonus (+20% if faster than average)
      const averageTime = profile.stats.averageTime;
      const speedBonus = averageTime && timer < averageTime;
      const speedMultiplier = speedBonus ? 1.2 : 1;

      // Accuracy bonus (+30% for perfect game - no hints used)
      const accuracyMultiplier = isPerfectGame ? 1.3 : 1;

      // Apply penalty percentage, speed bonus, and accuracy bonus
      const score = Math.max(
        50,
        Math.round(
          baseScore * (1 - totalPenaltyPercent / 100) * speedMultiplier * accuracyMultiplier
        )
      );

      // Clear saved game state on completion
      clearSavedGame();

      setTimeout(
        () =>
          onComplete({
            score,
            crosswordId: data.id,
            title: `Кроссворд: ${data.category}`,
            timeSeconds: timer,
            wordsSolved: data.words.length,
            category: data.category,
            solvedWords: data.words.map((w) => w.word),
            grid: userGrid,
            difficulty: data.difficulty,
            hintsUsed,
            lettersRevealed,
            wordsWithoutHints,
            speedBonus: !!speedBonus,
            perfectGame: isPerfectGame,
          }),
        2000
      );
    }
  }, [
    data,
    solvedWordIds,
    solved,
    onComplete,
    timer,
    totalPenaltyPercent,
    wordPenalties,
    userGrid,
    profile.stats.averageTime,
    clearSavedGame,
  ]);

  useEffect(() => {
    if (userGrid.length > 0) checkSolution();
  }, [userGrid, checkSolution]);

  // Detect new word solved and show score popup
  useEffect(() => {
    if (!data) return;
    const currentCount = solvedWordIds.size;
    if (currentCount > prevSolvedCount && prevSolvedCount > 0) {
      // A new word was solved - show score animation
      const baseWordScore =
        data.difficulty === 'easy' ? 30 : data.difficulty === 'medium' ? 50 : 75;
      const popup = {
        id: Date.now(),
        score: baseWordScore,
        x: Math.random() * 60 + 20, // Random position 20-80%
        y: Math.random() * 30 + 35, // Random position 35-65%
      };
      setScorePopups((prev) => [...prev, popup]);
      // Remove popup after animation
      setTimeout(() => {
        setScorePopups((prev) => prev.filter((p) => p.id !== popup.id));
      }, 1500);
    }
    setPrevSolvedCount(currentCount);
  }, [solvedWordIds.size, data, prevSolvedCount]);

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
      <div
        className="flex items-center justify-center gap-4 -mt-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Back button */}
        <button
          onClick={() => setShowExitConfirm(true)}
          className="flex items-center gap-2 bg-white rounded-full px-4 py-3 shadow-lg border border-slate-100 text-slate-600 hover:text-slate-800 hover:border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold text-sm hidden sm:inline">Выйти</span>
        </button>

        {/* Game info panel */}
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
          {totalPenaltyPercent > 0 && (
            <div className="pl-6 text-red-500 font-bold text-xs">-{totalPenaltyPercent}%</div>
          )}
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
                  <MotionDiv
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    initial={false}
                    animate={{
                      scale: cellIsSolved ? [1, 1.15, 1] : 1,
                      backgroundColor: cellIsSolved
                        ? '#10b981'
                        : isFocused
                          ? '#f97316'
                          : isHighlighted
                            ? '#ffedd5'
                            : val
                              ? '#334155'
                              : '#ffffff',
                    }}
                    transition={{ duration: 0.3 }}
                    className={`relative aspect-square flex items-center justify-center rounded-lg border-b-2
                    ${
                      cellIsSolved
                        ? `border-emerald-700 ${cellHasUnsolved ? 'cursor-pointer' : 'cursor-not-allowed'}`
                        : isFocused
                          ? 'border-orange-600 z-10 shadow-lg cursor-pointer ring-4 ring-orange-300'
                          : isHighlighted
                            ? 'border-orange-300 cursor-pointer'
                            : val
                              ? 'border-slate-800 cursor-pointer'
                              : 'border-slate-200 cursor-pointer'
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
                  </MotionDiv>
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
                      const wordIdx = activeWord.idx;
                      setShowHint({
                        hint: activeWord.hint,
                        word: activeWord.word,
                        wordIdx,
                        showLetters: false,
                      });
                      // Add hint penalty only if not already used for this word
                      setWordPenalties((prev) => {
                        const newMap = new Map(prev);
                        const existing = newMap.get(wordIdx) || { hint: false, letters: false };
                        if (!existing.hint) {
                          newMap.set(wordIdx, { ...existing, hint: true });
                        }
                        return newMap;
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-bold text-[9px]"
                  >
                    <Lightbulb className="w-3.5 h-3.5" /> ПОДСКАЗКА (-10%)
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
            const wordIdx = showHint.wordIdx;
            setShowHint({ ...showHint, showLetters: true });
            // Add letters penalty only if not already used for this word
            setWordPenalties((prev) => {
              const newMap = new Map(prev);
              const existing = newMap.get(wordIdx) || { hint: false, letters: false };
              if (!existing.letters) {
                newMap.set(wordIdx, { ...existing, letters: true });
              }
              return newMap;
            });
          }}
          onClose={() => setShowHint(null)}
        />
      )}

      {/* Exit Confirmation Dialog */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowExitConfirm(false)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-100">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black mb-2 uppercase">Выйти из игры?</h3>
              <p className="text-slate-500 font-medium mb-8">
                Ваш прогресс в этом кроссворде будет потерян.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-xl font-black hover:bg-slate-200 transition-colors"
                >
                  ПРОДОЛЖИТЬ
                </button>
                <button
                  onClick={() => {
                    clearSavedGame();
                    onCancel();
                  }}
                  className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black shadow-lg hover:bg-red-600 transition-colors"
                >
                  ВЫЙТИ
                </button>
              </div>
            </MotionDiv>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Popups */}
      <AnimatePresence>
        {scorePopups.map((popup) => (
          <ScorePopup key={popup.id} score={popup.score} x={popup.x} y={popup.y} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default CrosswordGame;
