'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './client';
import { type AuthUser } from './actions';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const { dashboardFetch } = await import('@/lib/session/client')
      const res = await dashboardFetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const data = await res.json();
      const currentUser: AuthUser = {
        id: data.id,
        email: data.email,
        profile: data.profile,
      };
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      return null;
    }
  }, []);

  const signOut = async () => {
    try {
      const { signOut: signOutAction } = await import('./actions');
      const { error } = await signOutAction();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let authReady = false;

    const finishLoading = () => {
      if (mounted && !authReady) {
        authReady = true;
        setLoading(false);
      }
    };

    const resolveInitialAuth = async (session: { user: unknown } | null) => {
      if (session?.user) {
        let profile = await refreshUser();
        if (!profile) {
          await new Promise(resolve => setTimeout(resolve, 150));
          profile = await refreshUser();
        }
        if (!profile) {
          await new Promise(resolve => setTimeout(resolve, 400));
          await refreshUser();
        }
        return;
      }
      await refreshUser();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'INITIAL_SESSION') {
          const { data: { session: latestSession } } = await supabase.auth.getSession();
          await resolveInitialAuth(latestSession ?? session);
          finishLoading();
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          await refreshUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      },
    );

    const fallbackTimer = setTimeout(() => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted || authReady) return;
        return resolveInitialAuth(session).finally(finishLoading);
      });
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
