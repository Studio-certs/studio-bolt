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
          checkUserRole(session?.user?.id);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          checkUserRole(session?.user?.id);
        });

        return () => subscription.unsubscribe();
      }, []);

      async function checkUserRole(userId: string | undefined) {
        if (!userId) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.role === 'admin' || false);
        }
        setLoading(false);
      }

      const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      };

      const signUp = async (email: string, password: string, fullName: string) => {
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
          console.log('Supabase signUp response:', response);
          if (response.error) throw response.error;

          // Create user wallet
          try {
            const { data: walletData, error: walletError } = await supabase
              .from('user_wallets')
              .insert({
                user_id: response.data.user.id,
                tokens: 0
              })
              .select('tokens')
              .maybeSingle();

            if (walletError) {
              console.error('Error creating user wallet:', walletError);
              throw new Error('Failed to create user wallet');
            }
            console.log('User wallet created:', walletData);
          } catch (walletError: any) {
            console.error('Error creating user wallet:', walletError);
            throw new Error('Failed to create user wallet');
          }
        } catch (error: any) {
          console.error('Error during sign up:', error);
          throw new Error(error.message || 'Failed to create an account');
        }
      };

      const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      };

      const value = {
        user,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
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
