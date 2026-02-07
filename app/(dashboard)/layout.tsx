'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../AppContext';
import Sidebar from '@/components/Sidebar';
import Layout from '@/components/Layout';
import DashboardFooter from '@/components/DashboardFooter';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAppContext();
  const router = useRouter();

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

  return (
    <>
      <Sidebar
        activeView="DASHBOARD"
        onViewChange={(view) => {
          if (view === 'SETTINGS') router.push('/p/settings');
          if (view === 'DASHBOARD') router.push('/p/dashboard');
          if (view === 'STATISTICS') router.push('/p/statistics');
          if (view === 'GAME') router.push('/p/games');
        }}
        onLogoClick={() => router.push('/p/dashboard')}
        onAccountClick={() => router.push('/p/settings')}
        avatar={profile.avatar}
        username={profile.username}
      />
      <Layout stats={profile.stats}>
        {children}
        <DashboardFooter />
      </Layout>
    </>
  );
}
