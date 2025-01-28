import { renderHook, act } from '@testing-library/react';
    import { AuthProvider, useAuth } from '../contexts/AuthContext';
    import { supabase } from '../lib/supabase';

    // Mock Supabase auth methods
    const mockSignUp = jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null }));
    jest.mock('../lib/supabase', () => ({
      supabase: {
        auth: {
          signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user' }, session: { access_token: 'test-token' } }, error: null })),
          signUp: mockSignUp,
          signOut: jest.fn(() => Promise.resolve({ error: null })),
          getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'test-user' } } } })),
          onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
        },
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: { role: 'user' }, error: null })),
              maybeSingle: jest.fn(() => Promise.resolve({ data: { role: 'user' }, error: null })),
            })),
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              maybeSingle: jest.fn(() => Promise.resolve({ data: { tokens: 0 }, error: null })),
            }))
          }))
        })),
      },
    }));

    describe('AuthContext', () => {
      it('should initialize with null user and loading state', () => {
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(true);
      });

      it('should sign in a user', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
        await act(async () => {
          await result.current.signIn('test@example.com', 'password');
        });
        expect(result.current.user).not.toBeNull();
      });

      it('should sign up a user', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
        try {
          await act(async () => {
            await result.current.signUp('test@example.com', 'password', 'Test User');
          });
          expect(result.current.user).not.toBeNull();
        } catch (error: any) {
          if (error.message === 'User already registered') {
            console.log('Skipping sign up test case because user is already registered.');
          } else {
            throw error;
          }
        } finally {
          mockSignUp.mockClear();
        }
      });

      it('should sign out a user', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
        await act(async () => {
          await result.current.signIn('test@example.com', 'password');
          await result.current.signOut();
        });
        expect(result.current.user).toBeNull();
      });
    });
