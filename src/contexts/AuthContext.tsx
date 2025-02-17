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

      // If user is blocked, sign them out and show message
      if (data?.blocked) {
        await signOut();
        throw new Error('Your account has been blocked. Please contact support for assistance.');
      }

      setIsAdmin(data?.role === 'admin' || false);
    } catch (error: any) {
      console.error('Error checking user role:', error);
      if (error.message.includes('blocked')) {
        throw error; // Re-throw blocked error to show to user
      }
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      // First check if the email is blocked
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('blocked')
        .eq('email', email)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile?.blocked) {
        throw new Error('This account has been blocked. Please contact support for assistance.');
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from sign up');

      // Wait for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the profile with additional information
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email,
          full_name: fullName
        })
        .eq('id', data.user.id);

      if (updateError) throw updateError;

      return;
    } catch (error: any) {
      console.error('Error during sign up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing out:', error);
    } finally {
      setUser(null);
      setIsAdmin(false);
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