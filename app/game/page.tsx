'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../AppContext';
import CrosswordGame from '@/components/CrosswordGame';
import Layout from '@/components/Layout';
import BottomNav from '@/components/BottomNav';
import { CrosswordData, GameHistoryEntry } from '@/types';

export default function GamePage() {
  const { profile, saveProfile, loading } = useAppContext();
  const router = useRouter();
  const [currentCrossword, setCurrentCrossword] = useState<CrosswordData | null>(null);

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/');
      return;
    }

    // Retrieve crossword data from sessionStorage
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

  const handleGameComplete = (
    score: number,
    crosswordId: string,
    title: string,
    timeSeconds: number,
    wordsSolved: number,
    category: string,
    solvedWords: string[]
  ) => {
    if (!profile) return;

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
    const newLevel = Math.floor(newPoints / 1000) + 1;

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
    };

    const updatedProfile = {
      ...profile,
      themeProgress: updatedThemeProgress,
      solvedCrosswordIds: [...profile.solvedCrosswordIds, crosswordId].slice(-100),
      stats: {
        ...profile.stats,
        points: newPoints,
        level: newLevel,
        streak: newStreak,
        lastPlayed: today,
        totalSolved: profile.stats.totalSolved + 1,
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
    <Layout
      stats={profile.stats}
      username={profile.username}
      onLogoClick={() => router.push('/')}
      onAccountClick={() => router.push('/dashboard')}
    >
      <div className="pb-24">
        <CrosswordGame
          profile={profile}
          crosswordData={currentCrossword}
          onComplete={handleGameComplete}
          onCancel={handleCancel}
        />
      </div>
      <BottomNav activeView="GAME" onViewChange={() => {}} />
    </Layout>
  );
}
