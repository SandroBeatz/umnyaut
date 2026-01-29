'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, UserStats, GameHistoryEntry } from '@/types';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';
import CrosswordGame from '@/components/CrosswordGame';
import Settings from '@/components/Settings';
import Landing from '@/components/Landing';
import Layout from '@/components/Layout';
import BottomNav from '@/components/BottomNav';

const INITIAL_STATS: UserStats = {
  points: 0,
  level: 1,
  streak: 0,
  lastPlayed: null,
  totalSolved: 0,
};

type ViewState = 'LANDING' | 'ONBOARDING' | 'DASHBOARD' | 'GAME' | 'SETTINGS';

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<ViewState>('LANDING');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('intellect_crossword_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
      setView('DASHBOARD');
    } else {
      setView('LANDING');
    }
    setLoading(false);
  }, []);

  const saveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('intellect_crossword_profile', JSON.stringify(newProfile));
  };

  const handleOnboardingComplete = (data: { username: string; categories: string[] }) => {
    const newProfile: UserProfile = {
      username: data.username,
      categories: data.categories,
      stats: INITIAL_STATS,
      history: []
    };
    saveProfile(newProfile);
    setView('DASHBOARD');
  };

  const handleGameComplete = (score: number, title: string) => {
    if (!profile) return;

    const today = new Date().toISOString().split('T')[0];
    const lastPlayed = profile.stats.lastPlayed;
    
    let newStreak = profile.stats.streak;
    if (!lastPlayed) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastPlayed);
      const diffDays = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    const newPoints = profile.stats.points + score;
    const newLevel = Math.floor(newPoints / 500) + 1;

    const historyEntry: GameHistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: today,
      title,
      score,
      categories: profile.categories
    };

    const updatedProfile: UserProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        points: newPoints,
        level: newLevel,
        streak: newStreak,
        lastPlayed: today,
        totalSolved: profile.stats.totalSolved + 1
      },
      history: [historyEntry, ...profile.history].slice(0, 20)
    };

    saveProfile(updatedProfile);
    setView('DASHBOARD');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-game font-bold">Загрузка нейронной сети...</div>;

  // Render Landing separately if no profile or explicitly on Landing
  if (view === 'LANDING') {
    return (
      <Layout 
        stats={profile?.stats} 
        username={profile?.username} 
        onLogoClick={() => setView('LANDING')}
        onAccountClick={() => setView('DASHBOARD')}
      >
        <Landing 
          isLoggedIn={!!profile} 
          onStart={() => profile ? setView('DASHBOARD') : setView('ONBOARDING')} 
        />
      </Layout>
    );
  }

  if (view === 'ONBOARDING' && !profile) {
    return <Onboarding onComplete={handleOnboardingComplete} onCancel={() => setView('LANDING')} />;
  }

  if (!profile) return <Landing isLoggedIn={false} onStart={() => setView('ONBOARDING')} />;

  return (
    <Layout 
      stats={profile.stats} 
      username={profile.username}
      onLogoClick={() => setView('LANDING')}
      onAccountClick={() => setView('DASHBOARD')}
    >
      <div className="pb-24 md:pb-8">
        {view === 'DASHBOARD' && (
          <Dashboard 
            profile={profile} 
            onStartGame={() => setView('GAME')} 
          />
        )}
        {view === 'GAME' && (
          <CrosswordGame 
            categories={profile.categories} 
            onComplete={handleGameComplete}
            onCancel={() => setView('DASHBOARD')}
          />
        )}
        {view === 'SETTINGS' && (
          <Settings 
            profile={profile}
            onSave={(updated) => {
              saveProfile(updated);
              setView('DASHBOARD');
            }}
          />
        )}
      </div>
      <BottomNav 
        activeView={view === 'GAME' ? 'GAME' : view === 'SETTINGS' ? 'SETTINGS' : 'DASHBOARD'} 
        onViewChange={(v) => setView(v as any)} 
      />
    </Layout>
  );
}
