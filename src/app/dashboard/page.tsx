'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/supabase/context';
import Dashboard from '@/components/Dashboard/Dashboard';

export default function DashboardPage() {
  const { user, loading, signOut, refreshUser } = useAuth();

  // Ensure user is hydrated after navigations without needing a manual refresh
  useEffect(() => {
    if (!loading && !user) {
      void refreshUser();
    }
  }, [loading, user, refreshUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      user={{
        name: user.profile.full_name,
        role: user.profile.role || 'parent',
        avatar: user.profile.avatar_url || undefined
      }}
      currentPath="/dashboard"
      role={user.profile.role}
      onboardingCompleted={user.profile.onboarding_completed ?? null}
      onSignOut={async () => {
        try {
          await signOut();
          window.location.href = '/welcome';
        } catch (e) {
          // ignore
        }
      }}
    />
  );
}