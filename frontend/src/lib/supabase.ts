import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = (): boolean =>
  Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('your-project-id') &&
      !supabaseUrl.includes('placeholder')
  );

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * SDK Supabase cukup besar (~50 KB gzip), jadi baru di-load saat benar-benar
 * dibutuhkan: user cloud sudah login, atau sedang login/daftar.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured()) {
    return Promise.reject(new Error('Supabase belum dikonfigurasi'));
  }
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(supabaseUrl!, supabaseAnonKey!)
  );
  return clientPromise;
}

/** Cek cepat (tanpa load SDK) apakah ada sesi Supabase tersimpan di browser. */
export function hasStoredSupabaseSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) return true;
    }
  } catch {
    // localStorage tidak tersedia
  }
  return false;
}

/** URL berisi token dari link konfirmasi email / reset password Supabase. */
export function hasAuthCallbackInUrl(): boolean {
  return /access_token=|refresh_token=|error_description=/.test(window.location.hash) ||
    /[?&]code=/.test(window.location.search);
}
