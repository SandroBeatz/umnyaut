'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../AppContext';
import Layout from '@/components/Layout';
import Sidebar from '@/components/Sidebar';
import { BarChart3, Trophy, Flame, Target, Clock } from 'lucide-react';

export default function StatisticsPage() {
  const { profile, loading } = useAppContext();
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

  const stats = profile.stats;

  return (
    <>
      <Sidebar
        activeView="STATISTICS"
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-black text-slate-900 mb-8">Статистика</h1>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-orange-100/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{stats.points}</p>
                  <p className="text-xs font-semibold text-slate-500">Всего очков</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-orange-100/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{stats.streak}</p>
                  <p className="text-xs font-semibold text-slate-500">Ударный режим</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-orange-100/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{stats.totalSolved}</p>
                  <p className="text-xs font-semibold text-slate-500">Игр завершено</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="bg-white rounded-2xl p-8 shadow-md border border-orange-100/50">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-orange-500" />
              Детальная статистика
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Всего игр</span>
                <span className="text-slate-900 font-bold">{stats.totalSolved}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Текущая серия</span>
                <span className="text-slate-900 font-bold">{stats.streak} дней</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Всего очков</span>
                <span className="text-slate-900 font-bold">{stats.points}</span>
              </div>

              {stats.maxStreak !== undefined && (
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Максимальная серия</span>
                  <span className="text-slate-900 font-bold">{stats.maxStreak} дней</span>
                </div>
              )}

              {stats.perfectGames !== undefined && (
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Идеальных игр</span>
                  <span className="text-slate-900 font-bold">{stats.perfectGames}</span>
                </div>
              )}

              {stats.averageTime !== undefined && (
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Среднее время</span>
                  <span className="text-slate-900 font-bold">
                    {Math.floor(stats.averageTime / 60)}:
                    {String(stats.averageTime % 60).padStart(2, '0')}
                  </span>
                </div>
              )}

              <div className="mt-6 p-4 bg-orange-50 rounded-xl">
                <p className="text-sm text-slate-600 text-center">
                  Продолжайте играть, чтобы улучшить свою статистику!
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
