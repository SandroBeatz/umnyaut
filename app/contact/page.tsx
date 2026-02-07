'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../AppContext';
import Contact from '@/components/Contact';
import Layout from '@/components/Layout';
import Header from '@/components/Header';

export default function ContactPage() {
  const { profile } = useAppContext();
  const router = useRouter();

  // For logged-in users, show layout without sidebar
  if (profile) {
    return (
      <Layout stats={profile.stats}>
        <Contact />
      </Layout>
    );
  }

  // For non-logged-in users, show simple layout
  return (
    <div className="min-h-screen bg-orange-50 text-stone-800">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-12">
        <Contact />
      </main>
    </div>
  );
}
