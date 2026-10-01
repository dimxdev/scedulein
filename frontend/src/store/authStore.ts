import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import {
  getSupabase,
  hasAuthCallbackInUrl,
  hasStoredSupabaseSession,
  isSupabaseConfigured,
} from '../lib/supabase';
import { friendlyError } from '../lib/errors';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  isGuest: boolean;
}

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  /** 'signed-in' kalau langsung masuk, 'confirm-email' kalau perlu konfirmasi email dulu. */
  signUp: (email: string, password: string) => Promise<'signed-in' | 'confirm-email'>;
  signInGuest: (name?: string) => void;
  /** Ganti nama panggilan (mode tamu). */
  updateGuestName: (name: string) => void;
  signOut: () => Promise<void>;
}

const GUEST_USER_KEY = 'schedulin_guest_user';
export const GUEST_USED_KEY = 'schedulin_guest_used';

const nameFromEmail = (email: string) => {
  const prefix = email.split('@')[0] ?? '';
  return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'Kawan';
};

const toAppUser = (u: User): AppUser => ({
  id: u.id,
  email: u.email ?? '',
  name: nameFromEmail(u.email ?? ''),
  isGuest: false,
});

function readGuest(): AppUser | null {
  try {
    const raw = localStorage.getItem(GUEST_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppUser>;
    if (!parsed.id) return null;
    // Data tamu versi lama belum punya field `name`
    return {
      id: parsed.id,
      email: parsed.email ?? '',
      name: parsed.name || nameFromEmail(parsed.email ?? '') || 'Kawan',
      isGuest: true,
    };
  } catch {
    return null;
  }
}

let listenerAttached = false;
let initStarted = false;

export const useAuthStore = create<AuthState>((set, get) => {
  /** Load SDK + pasang listener perubahan sesi (sekali saja). */
  const connect = async () => {
    const sb = await getSupabase();
    if (!listenerAttached) {
      listenerAttached = true;
      sb.auth.onAuthStateChange((_event, session) => {
        const current = get().user;
        if (session?.user) {
          if (current?.id !== session.user.id) set({ user: toAppUser(session.user) });
        } else if (current && !current.isGuest) {
          set({ user: null });
        }
      });
    }
    return sb;
  };

  return {
    user: null,
    loading: true,

    init: async () => {
      if (initStarted) return; // StrictMode memanggil effect dua kali
      initStarted = true;

      const guest = readGuest();
      if (guest) {
        set({ user: guest, loading: false });
        return;
      }

      // Tidak ada sesi tersimpan → langsung tampilkan halaman login tanpa menunggu SDK.
      if (isSupabaseConfigured() && (hasStoredSupabaseSession() || hasAuthCallbackInUrl())) {
        try {
          const sb = await connect();
          const { data } = await sb.auth.getSession();
          set({ user: data.session?.user ? toAppUser(data.session.user) : null, loading: false });
          return;
        } catch (err) {
          console.warn('Gagal memeriksa sesi Supabase:', err);
        }
      }

      set({ user: null, loading: false });
    },

    signIn: async (email, password) => {
      try {
        const sb = await connect();
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        set({ user: toAppUser(data.user) });
      } catch (err) {
        throw new Error(friendlyError(err), { cause: err });
      }
    },

    signUp: async (email, password) => {
      try {
        const sb = await connect();
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        // Supabase mengembalikan user tanpa identities kalau email sudah terdaftar
        if (data.user && data.user.identities?.length === 0) {
          throw new Error('User already registered');
        }
        if (data.session?.user) {
          set({ user: toAppUser(data.session.user) });
          return 'signed-in';
        }
        return 'confirm-email';
      } catch (err) {
        throw new Error(friendlyError(err), { cause: err });
      }
    },

    signInGuest: (name) => {
      const cleanName = name?.trim() || 'Kawan';
      const guestUser: AppUser = {
        id: 'guest-' + Date.now(),
        email: '',
        name: cleanName,
        isGuest: true,
      };
      localStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser));
      localStorage.setItem(GUEST_USED_KEY, '1');
      set({ user: guestUser });
    },

    updateGuestName: (name) => {
      const current = get().user;
      if (!current?.isGuest) return;
      const updated = { ...current, name: name.trim() || 'Kawan' };
      localStorage.setItem(GUEST_USER_KEY, JSON.stringify(updated));
      set({ user: updated });
    },

    signOut: async () => {
      const current = get().user;
      if (current && !current.isGuest) {
        // Hentikan push di perangkat ini selagi sesi masih valid (supaya tidak menerima notif akun lama)
        try {
          const [{ disablePush }, reminders] = await Promise.all([import('../lib/push'), import('../lib/reminders')]);
          await disablePush();
          reminders.setReminderSettings({ ...reminders.getReminderSettings(), enabled: false, push: false });
        } catch (err) {
          console.warn('Gagal menonaktifkan push:', err);
        }
        try {
          const sb = await getSupabase();
          await sb.auth.signOut();
        } catch (err) {
          console.error('Gagal keluar dari Supabase:', err);
        }
      }
      localStorage.removeItem(GUEST_USER_KEY);
      set({ user: null });
    },
  };
});
