import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AuthState, Profile } from '../types';

const AuthContext = createContext<{
  auth: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
} | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setAuth({
          isAuthenticated: true,
          user: profile,
          loading: false,
        });
      } else {
        setAuth({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) throw signUpError;
    if (!data.user) throw new Error('No user returned from sign up');

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ ...profile, id: data.user.id }]);

    if (profileError) throw profileError;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (profile: Partial<Profile>) => {
    if (!auth.user?.id) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', auth.user.id);

    if (error) throw error;

    setAuth(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...profile } : null,
    }));
  };

  return (
    <AuthContext.Provider value={{ auth, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};