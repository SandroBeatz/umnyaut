'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../AppContext';
import Dashboard from '@/components/Dashboard';
import Layout from '@/components/Layout';
import Sidebar from '@/components/Sidebar';
import { CrosswordData } from '@/types';

export default function DashboardPage() {
  const { profile, loading } = useAppContext();
  const router = useRouter();
  const [currentCrossword, setCurrentCrossword] = useState<CrosswordData | null>(null);

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/');
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-game font-bold text-orange-600">
        Загрузка Умняут...
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const handleStartGame = (data: CrosswordData) => {
    setCurrentCrossword(data);
    // Store crossword data in sessionStorage for the game page
    sessionStorage.setItem('currentCrossword', JSON.stringify(data));
    router.push('/game');
  };

  return (
    <>
      <Sidebar
        activeView="DASHBOARD"
        onViewChange={(view) => {
          if (view === 'SETTINGS') router.push('/settings');
          if (view === 'DASHBOARD') router.push('/dashboard');
        }}
        onLogoClick={() => router.push('/')}
        onAccountClick={() => router.push('/settings')}
        avatar={profile.avatar}
      />
      <Layout stats={profile.stats}>
        <Dashboard profile={profile} onStartGame={handleStartGame} />
      </Layout>
    </>
  );
}
