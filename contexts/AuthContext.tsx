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

    // Session expiry: clear old resume data if it exists (e.g. > 2 hours)
    const timestamp = localStorage.getItem('resumeTimestamp');
    if (timestamp) {
      const hours = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60);
      if (hours > 2) {
        console.log('[Auth] Clearing stale session data');
        const keys = ['resumeText', 'userSkills', 'userHardSkills', 'userSoftSkills', 'userRoles', 'resumeTimestamp'];
        keys.forEach(k => localStorage.removeItem(k));
      }
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const clearUserData = () => {
    const keys = [
      'resumeText', 'userSkills', 'userHardSkills', 'userSoftSkills',
      'userExperience', 'userRoles', 'userLocation', 'userIndustry',
      'userExperienceLevel', 'userName', 'userEmail', 'userPhone', 'userEducation',
      'detectedCountry', 'resumeVersion', 'resumeTimestamp', 'lastUserId', 'userCountry'
    ];
    keys.forEach(key => localStorage.removeItem(key));
    sessionStorage.removeItem('selectedJob');
  };

  const signIn = async () => {
    // Clear any previous session data
    clearUserData();
    // In "Open" mode, we just set the guest user immediately
    setUser(GUEST_USER);
    window.location.href = '/selection';
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear all user data on sign out
    clearUserData();
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
