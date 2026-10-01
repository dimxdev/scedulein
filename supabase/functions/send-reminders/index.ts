// Supabase Edge Function: kirim push notification untuk jadwal yang akan dimulai.
// Dipanggil pg_cron setiap menit (lihat backend/push-cron.template.sql).
//
// Secret yang dibutuhkan (Dashboard → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET, (opsional) VAPID_SUBJECT
// SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY sudah tersedia otomatis.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const env = (name: string) => (Deno.env.get(name) ?? '').trim();

const SUPABASE_URL = env('SUPABASE_URL');
const SERVICE_ROLE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const CRON_SECRET = env('CRON_SECRET');
const VAPID_SUBJECT = env('VAPID_SUBJECT') || 'https://scedulin.vercel.app';

/**
 * Setup VAPID dilakukan saat request (bukan saat fungsi dimuat), supaya secret
 * yang hilang/salah format menghasilkan pesan error yang jelas, bukan WORKER_ERROR.
 */
let vapidReady = false;
function setupVapid(): string | null {
  if (vapidReady) return null;
  const missing = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((n) => !env(n));
  if (missing.length) return `Secret belum diisi: ${missing.join(', ')}`;
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'));
    vapidReady = true;
    return null;
  } catch (err) {
    return `Kunci VAPID tidak valid: ${(err as Error)?.message ?? err}`;
  }
}

/** Toleransi keterlambatan cron: notifikasi tetap dikirim kalau telat < 5 menit. */
const WINDOW_MINUTES = 5;
const PAGE_SIZE = 1000;
const DOW: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

interface Subscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
  lead_minutes: number;
}

interface Schedule {
  id: string;
  user_id: string;
  day_of_week: number;
  time: string;
  title: string;
  date: string | null;
}

/** Tanggal, hari, dan menit-sejak-tengah-malam di zona waktu user. */
function localParts(timeZone: string, now: Date) {
  const format = (tz: string) =>
    Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        weekday: 'short',
      })
        .formatToParts(now)
        .map((p) => [p.type, p.value])
    );
  let p: Record<string, string>;
  try {
    p = format(timeZone);
  } catch {
    p = format('Asia/Jakarta'); // zona waktu tidak valid
  }
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    dow: DOW[p.weekday] ?? 1,
    minutes: Number(p.hour) * 60 + Number(p.minute),
  };
}

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const setupError = setupVapid();
  if (setupError) {
    console.error(setupError);
    return json({ error: setupError }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Ambil semua baris dengan paginasi (PostgREST membatasi 1000 baris per request)
  async function selectAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
    const rows: T[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await build(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE_SIZE) return rows;
    }
  }

  try {
    const now = new Date();
    const subs = await selectAll<Subscription>((from, to) =>
      supabase.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth, timezone, lead_minutes').range(from, to)
    );
    if (subs.length === 0) return json({ checked: 0, sent: 0 });

    const contexts = subs.map((sub) => ({ sub, ...localParts(sub.timezone, now) }));
    const userIds = [...new Set(subs.map((s) => s.user_id))];
    const dates = [...new Set(contexts.map((c) => c.date))];

    const [schedules, logs] = await Promise.all([
      selectAll<Schedule>((from, to) =>
        supabase.from('schedules').select('id, user_id, day_of_week, time, title, date').in('user_id', userIds).range(from, to)
      ),
      selectAll<{ schedule_id: string; date: string }>((from, to) =>
        supabase
          .from('daily_logs')
          .select('schedule_id, date')
          .in('user_id', userIds)
          .in('date', dates)
          .eq('status', true)
          .range(from, to)
      ),
    ]);
    const done = new Set(logs.map((l) => `${l.date}|${l.schedule_id}`));

    let sent = 0;
    let removed = 0;

    for (const { sub, date, dow, minutes } of contexts) {
      const due = schedules.filter((s) => {
        if (s.user_id !== sub.user_id) return false;
        if (s.date ? s.date !== date : s.day_of_week !== dow) return false;
        if (done.has(`${date}|${s.id}`)) return false;
        const late = minutes - (toMinutes(s.time) - sub.lead_minutes);
        return late >= 0 && late < WINDOW_MINUTES;
      });

      for (const schedule of due) {
        // "Klaim" pengiriman dulu — kalau barisnya sudah ada, notifikasi ini sudah pernah dikirim
        const { data: claimed, error: claimError } = await supabase
          .from('push_deliveries')
          .upsert(
            { subscription_id: sub.id, schedule_id: schedule.id, date },
            { onConflict: 'subscription_id,schedule_id,date', ignoreDuplicates: true }
          )
          .select('schedule_id');
        if (claimError) throw claimError;
        if (!claimed?.length) continue;

        const time = schedule.time.slice(0, 5);
        const when = sub.lead_minutes === 0 ? 'sekarang' : `${sub.lead_minutes} menit lagi`;
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title: '⏰ Pengingat Schedulin',
              body: `${schedule.title} — mulai ${when} (jam ${time}).`,
              tag: `schedulin-${schedule.id}-${date}`,
              url: '/',
            }),
            { TTL: 15 * 60, urgency: 'high' }
          );
          sent++;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            // Langganan sudah tidak berlaku (app di-uninstall / izin dicabut)
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            removed++;
            break;
          }
          console.error('Gagal kirim push', status, err);
        }
      }
    }

    // Bersihkan catatan pengiriman yang sudah lewat seminggu
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await supabase.from('push_deliveries').delete().lt('date', cutoff);

    return json({ checked: subs.length, sent, removed });
  } catch (err) {
    console.error(err);
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});
