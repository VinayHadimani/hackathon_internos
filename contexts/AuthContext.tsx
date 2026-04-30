"use client";

import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for Guest Mode
const GUEST_USER: any = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'guest@internos.ai',
  user_metadata: {
    full_name: 'InternOS Guest',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
  },
  aud: 'authenticated',
  role: 'authenticated',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(GUEST_USER);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false); // Immediate load for guest mode

  const supabase = createClient();

  useEffect(() => {
    // We keep the listener just in case a real login happens, 
    // but default to guest if not.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        setUser(GUEST_USER);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        setUser(GUEST_USER);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    // In "Open" mode, we just set the guest user immediately
    setUser(GUEST_USER);
    window.location.href = '/dashboard';
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(GUEST_USER);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signOut,
        isAuthenticated: true, // Always true to bypass guards
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
