'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/supabase/context';
import Dashboard from '@/components/Dashboard/Dashboard';
import AdminOverview from '@/components/Dashboard/Admin/AdminOverview';
import ExpertOverview from '@/components/Dashboard/Expert/ExpertOverview';
import { getActiveView } from '@/lib/expert/active-view';

export default function DashboardPage() {
  const { user, loading, signOut, refreshUser } = useAuth();
  const activeView = getActiveView(user?.profile ?? null);

  useEffect(() => {
    if (!loading && !user) {
      void refreshUser();
    }
  }, [loading, user, refreshUser]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  if (activeView === 'admin') {
    return <AdminOverview />;
  }

  if (activeView === 'expert') {
    return <ExpertOverview />;
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
        } catch {
          // ignore
        }
      }}
    />
  );
}
