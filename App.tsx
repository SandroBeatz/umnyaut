import React, { useState, useEffect } from 'react';
import { UserProfile, UserStats, GameHistoryEntry } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import CrosswordGame from './components/CrosswordGame';
import Settings from './components/Settings';
import Landing from './components/Landing';
import Layout from './components/Layout';
import BottomNav from './components/BottomNav';

const INITIAL_STATS: UserStats = {
  points: 0,
  level: 1,
  streak: 0,
  lastPlayed: null,
  totalSolved: 0,
};

type ViewState = 'LANDING' | 'ONBOARDING' | 'DASHBOARD' | 'GAME' | 'SETTINGS';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<ViewState>('LANDING');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('intellect_crossword_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration check for new fields
        if (!parsed.solvedCrosswordIds) parsed.solvedCrosswordIds = [];
        if (!parsed.themeProgress) parsed.themeProgress = {};
        if (parsed.categories && !parsed.selectedCategories) {
          parsed.selectedCategories = parsed.categories;
        }
        setProfile(parsed);
        setView('DASHBOARD');
      } catch (e) {
        console.error("Profile parse error", e);
      }
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
      selectedCategories: data.categories,
      themeProgress: data.categories.reduce((acc, cat) => {
        acc[cat] = { completedWords: [], totalWords: 100 };
        return acc;
      }, {} as any),
      stats: INITIAL_STATS,
      history: [],
      solvedCrosswordIds: []
    };
    saveProfile(newProfile);
    setView('DASHBOARD');
  };

  const handleGameComplete = (score: number, crosswordId: string, title: string, timeSeconds: number, wordsSolved: number, category: string, solvedWords: string[]) => {
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
    const newLevel = Math.floor(newPoints / 1000) + 1; // Updated level calculation

    // Update theme progress
    const currentProgress = profile.themeProgress[category] || { completedWords: [], totalWords: 100 };
    const newCompletedWords = Array.from(new Set([...currentProgress.completedWords, ...solvedWords]));
    
    const updatedThemeProgress = {
      ...profile.themeProgress,
      [category]: {
        ...currentProgress,
        completedWords: newCompletedWords
      }
    };

    const historyEntry: GameHistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      crosswordId,
      date: today,
      title,
      score,
      timeSeconds,
      wordsSolved,
      category
    };

    const updatedProfile: UserProfile = {
      ...profile,
      themeProgress: updatedThemeProgress,
      solvedCrosswordIds: [...profile.solvedCrosswordIds, crosswordId].slice(-100),
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

  if (loading) return <div className="min-h-screen flex items-center justify-center font-game font-bold">Загрузка КроссКвест...</div>;

  return (
    <Layout 
      stats={profile?.stats} 
      username={profile?.username} 
      onLogoClick={() => setView('LANDING')}
      onAccountClick={() => setView('DASHBOARD')}
    >
      <div className="pb-24">
        {view === 'LANDING' && (
          <Landing 
            isLoggedIn={!!profile} 
            onStart={() => profile ? setView('DASHBOARD') : setView('ONBOARDING')} 
          />
        )}
        {view === 'ONBOARDING' && !profile && (
          <Onboarding onComplete={handleOnboardingComplete} onCancel={() => setView('LANDING')} />
        )}
        {profile && (
          <>
            {view === 'DASHBOARD' && (
              <Dashboard 
                profile={profile} 
                onStartGame={() => setView('GAME')} 
              />
            )}
            {view === 'GAME' && (
              <CrosswordGame 
                profile={profile}
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
          </>
        )}
      </div>
      <BottomNav 
        activeView={view === 'GAME' ? 'GAME' : view === 'SETTINGS' ? 'SETTINGS' : 'DASHBOARD'} 
        onViewChange={(v) => setView(v as any)} 
      />
    </Layout>
  );
};

export default App;
