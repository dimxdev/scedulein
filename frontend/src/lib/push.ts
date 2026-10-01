import { getSupabase } from './supabase';

/**
 * Kunci publik VAPID — memang dirancang untuk publik, aman di-commit.
 * Pasangan kunci privatnya hanya ada di secret Edge Function Supabase.
 */
export const VAPID_PUBLIC_KEY =
  'BFt0aSU1iCSVQRUysZxjbnx9KjWUhLZaCoQU3Av2cwCvlRbt7jp1CyrxOEA9zsTfYtwy4N96x3xKe8D-jLRCrTw';

export type PushSupport = 'supported' | 'unsupported' | 'ios-needs-install';

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS mengaku Mac

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function pushSupport(): PushSupport {
  // iOS hanya mengizinkan Web Push untuk app yang dipasang ke Home Screen (iOS 16.4+)
  if (isIOS() && !isStandalone()) return 'ios-needs-install';
  const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  return ok ? 'supported' : 'unsupported';
}

function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** Registration service worker; null kalau belum ada (mis. di dev server). */
async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  // Beri waktu sebentar untuk registrasi yang sedang berjalan
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
  ]);
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const registration = await getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

const timezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
  } catch {
    return 'Asia/Jakarta';
  }
};

/** Minta izin, buat push subscription, dan simpan ke Supabase untuk user yang login. */
export async function enablePush(userId: string, leadMinutes: number): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Izin notifikasi diblokir. Aktifkan lewat pengaturan situs di browser.'
        : 'Izin notifikasi belum diberikan.'
    );
  }

  const registration = await getRegistration();
  if (!registration) {
    throw new Error('Service worker belum aktif. Buka versi yang sudah di-deploy (bukan dev server), lalu muat ulang.');
  }

  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Browser tidak memberikan data langganan push yang lengkap.');
  }

  const sb = await getSupabase();
  const { error } = await sb.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      timezone: timezone(),
      lead_minutes: leadMinutes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );
  if (error) throw error;
}

/** Perbarui "X menit sebelumnya" untuk perangkat ini. */
export async function updatePushLead(leadMinutes: number): Promise<void> {
  const subscription = await getCurrentSubscription();
  if (!subscription) return;
  const sb = await getSupabase();
  const { error } = await sb
    .from('push_subscriptions')
    .update({ lead_minutes: leadMinutes, timezone: timezone(), updated_at: new Date().toISOString() })
    .eq('endpoint', subscription.endpoint);
  if (error) throw error;
}

/** Hentikan push untuk perangkat ini (dipanggil saat menonaktifkan pengingat atau keluar akun). */
export async function disablePush(): Promise<void> {
  const subscription = await getCurrentSubscription();
  if (!subscription) return;
  try {
    const sb = await getSupabase();
    await sb.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
  } finally {
    await subscription.unsubscribe();
  }
}
