'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserStats } from '@/types';

const INITIAL_STATS: UserStats = {
  points: 0,
  level: 1,
  streak: 0,
  lastPlayed: null,
  totalSolved: 0,
};

interface AppContextType {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  saveProfile: (profile: UserProfile) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('umnyaut_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration check for new fields
        if (!parsed.solvedCrosswordIds) parsed.solvedCrosswordIds = [];
        if (!parsed.themeProgress) parsed.themeProgress = {};
        if (parsed.categories && !parsed.selectedCategories) {
          parsed.selectedCategories = parsed.categories;
        }
        if (parsed.soundEnabled === undefined) parsed.soundEnabled = true;
        if (!parsed.defaultDifficulty) parsed.defaultDifficulty = 'medium';
        if (!parsed.createdAt) parsed.createdAt = new Date().toISOString();
        setProfile(parsed);
      } catch (e) {
        console.error('Profile parse error', e);
      }
    }
    setLoading(false);
  }, []);

  const saveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('umnyaut_profile', JSON.stringify(newProfile));
  };

  return (
    <AppContext.Provider value={{ profile, setProfile, saveProfile, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export { INITIAL_STATS };
