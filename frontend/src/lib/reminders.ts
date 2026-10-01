import { useEffect, useSyncExternalStore } from 'react';
import { useDataStore, doneKey } from '../store/dataStore';
import { toast } from '../store/toastStore';
import { dayOfWeek, timeToMinutes, toDateStr } from './date';

export interface ReminderSettings {
  enabled: boolean;
  /** Berapa menit sebelum jadwal mulai. */
  leadMinutes: number;
}

export const LEAD_OPTIONS = [0, 5, 10, 15, 30];

const SETTINGS_KEY = 'schedulin_reminders_v1';
const FIRED_KEY = 'schedulin_reminders_fired';
const CHECK_INTERVAL_MS = 20_000;
/** Pengingat yang telat lebih dari ini (mis. app baru dibuka) tidak dikirim lagi. */
const MAX_LATE_MS = 2 * 60_000;

const DEFAULT_SETTINGS: ReminderSettings = { enabled: false, leadMinutes: 5 };

const listeners = new Set<() => void>();
let cached: ReminderSettings | null = null;

export function getReminderSettings(): ReminderSettings {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    cached = raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ReminderSettings>) } : DEFAULT_SETTINGS;
  } catch {
    cached = DEFAULT_SETTINGS;
  }
  return cached;
}

export function setReminderSettings(next: ReminderSettings) {
  cached = next;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // abaikan
  }
  listeners.forEach((l) => l());
}

export function useReminderSettings(): ReminderSettings {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getReminderSettings
  );
}

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

/** Tampilkan notifikasi lewat service worker (wajib di Android) dengan fallback ke Notification biasa. */
export async function showNotification(title: string, body: string, tag?: string) {
  if (notificationPermission() !== 'granted') return false;
  const options: NotificationOptions = { body, tag, icon: '/pwa-192x192.png', badge: '/favicon.png' };
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
      return true;
    }
  } catch {
    // lanjut ke fallback
  }
  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

function readFired(today: string): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(FIRED_KEY) ?? '{}') as { date?: string; keys?: string[] };
    return raw.date === today ? new Set(raw.keys) : new Set();
  } catch {
    return new Set();
  }
}

function writeFired(today: string, keys: Set<string>) {
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify({ date: today, keys: [...keys] }));
  } catch {
    // abaikan
  }
}

function checkReminders() {
  const settings = getReminderSettings();
  if (!settings.enabled) return;

  const { schedules, done, status } = useDataStore.getState();
  if (status !== 'ready') return;

  const now = new Date();
  const today = toDateStr(now);
  const dow = dayOfWeek(now);
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const fired = readFired(today);
  let changed = false;

  for (const s of schedules) {
    const isToday = s.date ? s.date === today : s.day_of_week === dow;
    if (!isToday || done.has(doneKey(today, s.id))) continue;

    const fireAt = midnight + (timeToMinutes(s.time) - settings.leadMinutes) * 60_000;
    const late = now.getTime() - fireAt;
    const key = `${s.id}|${s.time}|${settings.leadMinutes}`;
    if (late < 0 || late > MAX_LATE_MS || fired.has(key)) continue;

    fired.add(key);
    changed = true;
    const when = settings.leadMinutes === 0 ? 'sekarang' : `${settings.leadMinutes} menit lagi`;
    const body = `${s.title} — mulai ${when} (jam ${s.time}).`;
    void showNotification('⏰ Pengingat Schedulin', body, `schedulin-${s.id}`);
    toast.info(`⏰ ${body}`, { duration: 8000 });
  }

  if (changed) writeFired(today, fired);
}

/**
 * Cek jadwal secara berkala dan kirim notifikasi menjelang waktunya.
 * Catatan: tanpa server push, pengingat hanya bekerja selama Schedulin terbuka
 * (termasuk di tab latar belakang atau sebagai PWA yang masih berjalan).
 */
export function useReminderScheduler() {
  useEffect(() => {
    checkReminders();
    const id = window.setInterval(checkReminders, CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (!document.hidden) checkReminders();
    };
    document.addEventListener('visibilitychange', onVisible);
    // Cek langsung begitu data selesai dimuat (jangan tunggu interval berikutnya)
    const unsubscribe = useDataStore.subscribe((state, prev) => {
      if (state.status === 'ready' && prev.status !== 'ready') checkReminders();
    });
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      unsubscribe();
    };
  }, []);
}
