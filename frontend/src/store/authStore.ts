import { create } from 'zustand';

import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/dataService';

export interface AppUser {
  id: string;
  email: string;
  isGuest?: boolean;
}

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  isCloud: boolean;
  setUser: (user: AppUser | null) => void;
  checkUser: () => Promise<void>;
  signInGuest: (nickname?: string) => void;
  signOut: () => Promise<void>;
}

const LOCAL_USER_KEY = 'schedulin_guest_user';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isCloud: isSupabaseConfigured(),

  setUser: (user) => set({ user }),

  checkUser: async () => {
    // 1. Check if Supabase cloud is configured
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email || 'user@example.com',
              isGuest: false,
            },
            isCloud: true,
            loading: false,
          });
          return;
        }
      } catch (err) {
        console.warn('Supabase session check error:', err);
      }
    }

    // 2. Check local guest session
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        set({ user: parsed, isCloud: false, loading: false });
        return;
      }
    } catch {
      // ignore
    }

    // Default: Not logged in yet
    set({ user: null, loading: false });
  },

  signInGuest: (nickname = 'Kawan Schedulin') => {
    const guestUser: AppUser = {
      id: 'guest-' + Date.now(),
      email: `${nickname.toLowerCase().replace(/\s+/g, '')}@demo.local`,
      isGuest: true,
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(guestUser));
    set({ user: guestUser, isCloud: false });
  },

  signOut: async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.removeItem(LOCAL_USER_KEY);
    set({ user: null });
  },
}));
