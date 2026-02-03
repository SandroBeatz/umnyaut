'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../AppContext';
import Settings from '@/components/Settings';
import Layout from '@/components/Layout';
import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  const { profile, saveProfile, loading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/');
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-game font-bold text-orange-600">
        Загрузка...
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const handleSave = (updated: any) => {
    saveProfile(updated);
    router.push('/dashboard');
  };

  return (
    <>
      <Sidebar
        activeView="SETTINGS"
        onViewChange={(view) => {
          if (view === 'SETTINGS') router.push('/settings');
          if (view === 'DASHBOARD') router.push('/dashboard');
        }}
        onLogoClick={() => router.push('/')}
        onAccountClick={() => router.push('/settings')}
        avatar={profile.avatar}
      />
      <Layout stats={profile.stats}>
        <Settings profile={profile} onSave={handleSave} />
      </Layout>
    </>
  );
}
