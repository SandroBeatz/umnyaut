import React from 'react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-orange-50 text-stone-800">
      <PublicHeader />
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-12 w-full">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
