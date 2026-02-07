'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext, INITIAL_STATS } from '../AppContext';
import Onboarding, { OnboardingData } from '@/components/Onboarding';
import { UserProfile } from '@/types';

export default function OnboardingPage() {
  const { profile, saveProfile, loading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile) {
      router.push('/dashboard');
    }
  }, [profile, loading, router]);

  const handleOnboardingComplete = (data: OnboardingData) => {
    const newProfile: UserProfile = {
      username: data.username,
      ageGroup: data.ageGroup,
      defaultDifficulty: data.defaultDifficulty,
      selectedCategories: [], // Categories will be selected in the game
      themeProgress: {},
      stats: INITIAL_STATS,
      history: [],
      solvedCrosswordIds: [],
      soundEnabled: true,
      createdAt: new Date().toISOString(),
    };
    saveProfile(newProfile);
    router.push('/dashboard');
  };

  const handleCancel = () => {
    router.push('/');
  };

  if (loading || profile) {
    return null;
  }

  return <Onboarding onComplete={handleOnboardingComplete} onCancel={handleCancel} />;
}
