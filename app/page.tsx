'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from './AppContext';
import Landing from '@/components/Landing';
import Layout from '@/components/Layout';
import Sidebar from '@/components/Sidebar';

export default function HomePage() {
  const { profile } = useAppContext();
  const router = useRouter();

  const handleStart = () => {
    if (profile) {
      router.push('/dashboard');
    } else {
      router.push('/onboarding');
    }
  };

  // For logged-in users, show sidebar
  if (profile) {
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
          <Landing isLoggedIn={true} onStart={handleStart} />
        </Layout>
      </>
    );
  }

  // For non-logged-in users, show simple layout without sidebar
  return (
    <div className="min-h-screen bg-orange-50 text-stone-800">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-12">
        <Landing isLoggedIn={false} onStart={handleStart} />
      </main>
    </div>
  );
}
