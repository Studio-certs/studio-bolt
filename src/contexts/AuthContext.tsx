import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  supabase: typeof supabase;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUserRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, blocked')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      // If user is blocked, sign them out
      if (data?.blocked) {
        await signOut();
        throw new Error('Your account has been blocked. Please contact support.');
      }

      setIsAdmin(data?.role === 'admin' || false);
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    // First check if the email is blocked
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('blocked')
      .eq('email', email)
      .maybeSingle();

    if (profileError) throw profileError;

    if (profile?.blocked) {
      throw new Error('This account has been blocked. Please contact support.');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Check if email is blocked
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('blocked')
      .eq('email', email)
      .maybeSingle();

    if (profileError) throw profileError;

    if (profile?.blocked) {
      throw new Error('This email address has been blocked. Please contact support.');
    }

    try {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (response.error) throw response.error;

      // Create user wallet
      if (response.data.user) {
        try {
          const { error: walletError } = await supabase
            .from('user_wallets')
            .insert({
              user_id: response.data.user.id,
              tokens: 0
            });

          if (walletError) throw walletError;
        } catch (walletError: any) {
          console.error('Error creating user wallet:', walletError);
          throw new Error('Failed to create user wallet');
        }
      }
    } catch (error: any) {
      console.error('Error during sign up:', error);
      throw new Error(error.message || 'Failed to create an account');
    }
  };

  const signOut = async () => {
    try {
      // First check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // If no session exists, just clear the local state
        setUser(null);
        setIsAdmin(false);
        return;
      }

      // If we have a valid session, proceed with sign out
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      // If the error is related to missing session, we can safely ignore it
      if (error.name === 'AuthSessionMissingError' || error.message?.includes('session_not_found')) {
        setUser(null);
        setIsAdmin(false);
        return;
      }
      // For other errors, we should still throw them
      throw error;
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    supabase
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}