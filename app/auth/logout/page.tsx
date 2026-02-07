'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../AppContext';

export default function LogoutPage() {
  const { setProfile } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    // Clear profile from state and localStorage
    setProfile(null);
    localStorage.removeItem('umnyaut_user_profile');
    
    // Clear authentication cookie
    document.cookie = 'umnyaut_auth=false; path=/; max-age=0';
    
    // Redirect to home page
    router.push('/');
  }, [setProfile, router]);

  return (
    <div className="flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-game font-bold text-orange-600">Выход из системы...</p>
      </div>
    </div>
  );
}
