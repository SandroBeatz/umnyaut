'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../AppContext';
import CrosswordGame, { GameCompletionStats } from '@/components/CrosswordGame';
import Layout from '@/components/Layout';
import Sidebar from '@/components/Sidebar';
import {
  CrosswordData,
  GameHistoryEntry,
  calculateLevel,
  STREAK_MILESTONES,
  SavedGameState,
  SAVED_GAME_KEY,
} from '@/types';

export default function GamePage() {
  const { profile, saveProfile, loading } = useAppContext();
  const router = useRouter();
  const [currentCrossword, setCurrentCrossword] = useState<CrosswordData | null>(null);
  const [savedGameState, setSavedGameState] = useState<SavedGameState | null>(null);

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/');
      return;
    }

    // First check for saved game state in localStorage
    const savedState = localStorage.getItem(SAVED_GAME_KEY);
    if (savedState) {
      try {
        const parsed: SavedGameState = JSON.parse(savedState);
        setSavedGameState(parsed);
        setCurrentCrossword(parsed.crosswordData);
        return;
      } catch (e) {
        console.error('Failed to parse saved game state', e);
        localStorage.removeItem(SAVED_GAME_KEY);
      }
    }

    // Otherwise retrieve new crossword data from sessionStorage
    const saved = sessionStorage.getItem('currentCrossword');
    if (saved) {
      try {
        setCurrentCrossword(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse crossword data', e);
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  }, [profile, loading, router]);

  const handleGameComplete = (stats: GameCompletionStats) => {
    if (!profile) return;

    const {
      score,
      crosswordId,
      title,
      timeSeconds,
      wordsSolved,
      category,
      solvedWords,
      grid,
      difficulty,
      hintsUsed,
      lettersRevealed,
      wordsWithoutHints,
      perfectGame,
    } = stats;

    const today = new Date().toISOString().split('T')[0];
    const lastPlayed = profile.stats.lastPlayed;

    let newStreak = profile.stats.streak;
    if (!lastPlayed) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastPlayed);
      const diffDays = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
    }

    const newPoints = profile.stats.points + score;

    // Calculate new average time
    const oldAvgTime = profile.stats.averageTime || 0;
    const oldTotal = profile.stats.totalSolved;
    const newTotal = oldTotal + 1;
    const newAverageTime = Math.round((oldAvgTime * oldTotal + timeSeconds) / newTotal);

    // Track perfect games
    const newPerfectGames = (profile.stats.perfectGames || 0) + (perfectGame ? 1 : 0);

    // Track max streak
    const newMaxStreak = Math.max(profile.stats.maxStreak || 0, newStreak);

    // Check for new streak milestones
    const existingMilestones = profile.stats.streakMilestones || [];
    const newMilestones = [...existingMilestones];
    for (const milestone of STREAK_MILESTONES) {
      if (newStreak >= milestone && !existingMilestones.includes(milestone)) {
        newMilestones.push(milestone);
      }
    }

    // Build new stats for level calculation
    const newStats = {
      points: newPoints,
      level: 1, // Will be calculated
      streak: newStreak,
      lastPlayed: today,
      totalSolved: newTotal,
      averageTime: newAverageTime,
      perfectGames: newPerfectGames,
      maxStreak: newMaxStreak,
      streakMilestones: newMilestones,
    };

    // Calculate level using new formula
    const newLevel = calculateLevel(newStats);

    // Update theme progress
    const currentProgress = profile.themeProgress[category] || {
      completedWords: [],
      totalWords: 100,
    };
    const newCompletedWords = Array.from(
      new Set([...currentProgress.completedWords, ...solvedWords])
    );

    const updatedThemeProgress = {
      ...profile.themeProgress,
      [category]: {
        ...currentProgress,
        completedWords: newCompletedWords,
      },
    };

    const historyEntry: GameHistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      crosswordId,
      date: today,
      title,
      score,
      timeSeconds,
      wordsSolved,
      category,
      grid,
      difficulty,
      hintsUsed,
      lettersRevealed,
      wordsWithoutHints,
    };

    const updatedProfile = {
      ...profile,
      themeProgress: updatedThemeProgress,
      solvedCrosswordIds: [...profile.solvedCrosswordIds, crosswordId].slice(-100),
      stats: {
        ...newStats,
        level: newLevel,
      },
      history: [historyEntry, ...profile.history].slice(0, 20),
    };

    saveProfile(updatedProfile);
    sessionStorage.removeItem('currentCrossword');
    router.push('/dashboard');
  };

  const handleCancel = () => {
    sessionStorage.removeItem('currentCrossword');
    router.push('/dashboard');
  };

  if (loading || !profile || !currentCrossword) {
    return (
      <div className="min-h-screen flex items-center justify-center font-game font-bold text-orange-600">
        Загрузка игры...
      </div>
    );
  }

  return (
    <>
      <Sidebar
        activeView="GAME"
        onViewChange={(view) => {
          if (view === 'SETTINGS') router.push('/settings');
          if (view === 'DASHBOARD') router.push('/dashboard');
          if (view === 'ABOUT') router.push('/about');
          if (view === 'STATISTICS') router.push('/statistics');
          if (view === 'GAME') router.push('/game');
        }}
        onLogoClick={() => router.push('/')}
        onAccountClick={() => router.push('/settings')}
        avatar={profile.avatar}
        username={profile.username}
      />
      <Layout stats={profile.stats}>
        <CrosswordGame
          profile={profile}
          crosswordData={currentCrossword}
          savedState={savedGameState}
          onComplete={handleGameComplete}
          onCancel={handleCancel}
        />
      </Layout>
    </>
  );
}
