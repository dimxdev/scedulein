import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CategoryColor = 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'pink' | 'cyan' | 'indigo';

export interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  color: CategoryColor;
}

export interface PresetItem {
  id: string;
  title: string;
  time: string;
  category: string;
}

export interface ScheduleItem {
  id: string;
  day_of_week: number; // 1 = Senin, 7 = Minggu
  time: string; // "HH:MM"
  end_time?: string | null; // "HH:MM", opsional
  title: string;
  category: string;
  note?: string | null;
  /** Diisi = tugas sekali jalan di tanggal itu (YYYY-MM-DD). Kosong = rutin mingguan. */
  date?: string | null;
  created_at?: string;
}

export interface LogItem {
  schedule_id: string;
  date: string; // YYYY-MM-DD
}

export interface AppData {
  schedules: ScheduleItem[];
  categories: CategoryItem[];
  presets: PresetItem[];
  logs: LogItem[];
}

export interface DeletedSchedule {
  schedule: ScheduleItem;
  logs: LogItem[];
}

export interface Backend {
  readonly kind: 'local' | 'cloud';
  /** Semua data, log dibatasi mulai `sinceDate`. */
  loadAll(sinceDate: string): Promise<AppData>;
  /** Semua data termasuk seluruh riwayat log (untuk export / migrasi). */
  exportAll(): Promise<AppData>;
  insertSchedules(items: ScheduleItem[]): Promise<void>;
  updateSchedule(id: string, patch: Partial<Omit<ScheduleItem, 'id'>>): Promise<void>;
  deleteSchedule(id: string): Promise<DeletedSchedule | null>;
  setLog(scheduleId: string, date: string, done: boolean): Promise<void>;
  insertLogs(logs: LogItem[]): Promise<void>;
  insertCategories(items: CategoryItem[]): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  insertPresets(items: PresetItem[]): Promise<void>;
  deletePreset(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'work', label: 'Kerja/Tugas', icon: '💼', color: 'blue' },
  { id: 'health', label: 'Kesehatan', icon: '🏃', color: 'emerald' },
  { id: 'chill', label: 'Me-Time', icon: '☕', color: 'amber' },
  { id: 'learn', label: 'Belajar', icon: '📚', color: 'purple' },
  { id: 'routine', label: 'Rutinitas', icon: '✨', color: 'rose' },
];

export const DEFAULT_PRESETS: PresetItem[] = [
  { id: 'pre-1', title: 'Olahraga Pagi 🏃', time: '06:30', category: 'health' },
  { id: 'pre-2', title: 'Fokus Belajar / Coding 💻', time: '09:00', category: 'work' },
  { id: 'pre-3', title: 'Makan Siang & Santai 🍱', time: '12:00', category: 'chill' },
  { id: 'pre-4', title: 'Beri Makan Kucing & Jalan Sore 🐈', time: '17:00', category: 'routine' },
  { id: 'pre-5', title: 'Baca Buku / Me-Time Malam 📖', time: '21:30', category: 'learn' },
];

export const COLOR_PALETTES: Record<CategoryColor, { bg: string; dot: string }> = {
  blue: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300', dot: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', dot: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300', dot: 'bg-amber-500' },
  purple: { bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300', dot: 'bg-purple-500' },
  rose: { bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', dot: 'bg-rose-500' },
  pink: { bg: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300', dot: 'bg-pink-500' },
  cyan: { bg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300', dot: 'bg-cyan-500' },
  indigo: { bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300', dot: 'bg-indigo-500' },
};

const seed = (id: string, day: number, time: string, title: string, category: string): ScheduleItem => ({
  id,
  day_of_week: day,
  time,
  title,
  category,
});

// Contoh rutinitas awal untuk mode tamu
const DEFAULT_SEED_SCHEDULES: ScheduleItem[] = [
  seed('seed-1', 1, '06:30', 'Sarapan bergizi & segelas air putih 🍳', 'health'),
  seed('seed-2', 1, '08:30', 'Review to-do list & mulai kerja / kuliah 💻', 'work'),
  seed('seed-3', 1, '12:00', 'Makan siang & istirahat sejenak 🍱', 'chill'),
  seed('seed-4', 1, '17:00', 'Beri makan kucing kesayangan & jalan sore 🐈', 'routine'),
  seed('seed-5', 1, '21:30', 'Skincare malam & baca buku 20 menit 📖', 'learn'),
  seed('seed-6', 2, '07:00', 'Stretching & olahraga ringan 15 menit 🧘', 'health'),
  seed('seed-7', 2, '09:00', 'Fokus pengerjaan project & coding 🚀', 'work'),
  seed('seed-8', 2, '16:00', 'Kopi santai sore & cemilan ☕', 'chill'),
  seed('seed-9', 2, '22:00', 'Tidur cukup sebelum larut malam 🌙', 'health'),
  seed('seed-10', 3, '08:00', 'Cek email & meeting pagi ☕', 'work'),
  seed('seed-11', 3, '15:30', 'Belajar teknologi baru / baca tutorial 📚', 'learn'),
  seed('seed-12', 3, '19:00', 'Nonton film / main game santai 🎮', 'chill'),
  seed('seed-13', 4, '07:30', 'Sarapan buah & jus segar 🍓', 'health'),
  seed('seed-14', 4, '10:00', 'Selesaikan tugas prioritas minggu ini 🎯', 'work'),
  seed('seed-15', 4, '17:30', 'Bersih-bersih kamar & meja kerja ✨', 'routine'),
  seed('seed-16', 5, '09:00', 'Review progress mingguan 📈', 'work'),
  seed('seed-17', 5, '17:00', 'Jumat santai - weekend is coming! 🎉', 'chill'),
  seed('seed-18', 5, '20:00', 'Hangout / Me-time malam 🍿', 'chill'),
  seed('seed-19', 6, '08:30', 'Bangun santai & jalan pagi santai 🌿', 'health'),
  seed('seed-20', 6, '14:00', 'Eksplor hobi baru & dengerin musik 🎨', 'learn'),
  seed('seed-21', 6, '18:30', 'Makan malam enak bareng teman/keluarga 🍕', 'chill'),
  seed('seed-22', 7, '09:00', 'Cuci pakaian & self care day 🛁', 'routine'),
  seed('seed-23', 7, '15:00', 'Jadwalkan rencana minggu depan di Schedulin 📝', 'routine'),
  seed('seed-24', 7, '21:00', 'Tidur lelap menyiapkan energi hari Senin 💤', 'health'),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback untuk konteks non-HTTPS (mis. buka dev server lewat IP LAN)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const hhmm = (value: string | null | undefined): string | null => (value ? value.slice(0, 5) : null);

function normalizeSchedule(raw: ScheduleItem): ScheduleItem {
  return {
    ...raw,
    time: hhmm(raw.time) ?? '00:00',
    end_time: hhmm(raw.end_time),
    note: raw.note || null,
    date: raw.date || null,
    category: raw.category || 'routine',
  };
}

export const sortSchedules = (items: ScheduleItem[]) =>
  [...items].sort((a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title));

// ---------------------------------------------------------------------------
// Local backend (localStorage) — dipakai mode tamu
// ---------------------------------------------------------------------------

const KEYS = {
  schedules: 'schedulin_schedules_v1',
  logs: 'schedulin_daily_logs_v1',
  categories: 'schedulin_categories_v1',
  presets: 'schedulin_presets_v1',
};

interface StoredLog extends LogItem {
  id?: string;
  status?: boolean;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readOrSeed<T>(key: string, fallback: T | (() => T)): T {
  const existing = readJson<T>(key);
  if (existing) return existing;
  const value = typeof fallback === 'function' ? (fallback as () => T)() : fallback;
  writeJson(key, value);
  return value;
}

// Contoh jadwal diberi created_at = saat dibuat, supaya statistik tidak
// menghitung hari-hari sebelum user mulai sebagai "gagal".
const seedSchedules = () => {
  const now = new Date().toISOString();
  return DEFAULT_SEED_SCHEDULES.map((s) => ({ ...s, created_at: now }));
};

const localSchedules = () => readOrSeed<ScheduleItem[]>(KEYS.schedules, seedSchedules).map(normalizeSchedule);
const localLogs = () =>
  (readJson<StoredLog[]>(KEYS.logs) ?? [])
    .filter((l) => l.status !== false)
    .map((l) => ({ schedule_id: l.schedule_id, date: l.date }));
const localCategories = () => readOrSeed<CategoryItem[]>(KEYS.categories, DEFAULT_CATEGORIES);
const localPresets = () => readOrSeed<PresetItem[]>(KEYS.presets, DEFAULT_PRESETS);

const logKey = (l: LogItem) => `${l.date}|${l.schedule_id}`;

export const localBackend: Backend = {
  kind: 'local',

  async loadAll(sinceDate) {
    return {
      schedules: sortSchedules(localSchedules()),
      categories: localCategories(),
      presets: localPresets(),
      logs: localLogs().filter((l) => l.date >= sinceDate),
    };
  },

  async exportAll() {
    return {
      schedules: sortSchedules(localSchedules()),
      categories: localCategories(),
      presets: localPresets(),
      logs: localLogs(),
    };
  },

  async insertSchedules(items) {
    const now = new Date().toISOString();
    writeJson(KEYS.schedules, [
      ...localSchedules(),
      ...items.map((s) => normalizeSchedule({ created_at: now, ...s })),
    ]);
  },

  async updateSchedule(id, patch) {
    writeJson(
      KEYS.schedules,
      localSchedules().map((s) => (s.id === id ? normalizeSchedule({ ...s, ...patch }) : s))
    );
  },

  async deleteSchedule(id) {
    const schedule = localSchedules().find((s) => s.id === id);
    if (!schedule) return null;
    const logs = localLogs().filter((l) => l.schedule_id === id);
    writeJson(KEYS.schedules, localSchedules().filter((s) => s.id !== id));
    writeJson(KEYS.logs, localLogs().filter((l) => l.schedule_id !== id));
    return { schedule, logs };
  },

  async setLog(scheduleId, date, done) {
    const rest = localLogs().filter((l) => !(l.schedule_id === scheduleId && l.date === date));
    writeJson(KEYS.logs, done ? [...rest, { schedule_id: scheduleId, date }] : rest);
  },

  async insertLogs(logs) {
    const existing = localLogs();
    const seen = new Set(existing.map(logKey));
    writeJson(KEYS.logs, [...existing, ...logs.filter((l) => !seen.has(logKey(l)))]);
  },

  async insertCategories(items) {
    writeJson(KEYS.categories, [...localCategories(), ...items]);
  },

  async deleteCategory(id) {
    writeJson(KEYS.categories, localCategories().filter((c) => c.id !== id));
  },

  async insertPresets(items) {
    writeJson(KEYS.presets, [...localPresets(), ...items]);
  },

  async deletePreset(id) {
    writeJson(KEYS.presets, localPresets().filter((p) => p.id !== id));
  },

  async clearAll() {
    writeJson(KEYS.schedules, []);
    writeJson(KEYS.logs, []);
    writeJson(KEYS.categories, []);
    writeJson(KEYS.presets, []);
  },
};

/** Apakah browser ini punya data mode tamu yang pernah dipakai. */
export function hasLocalData(): boolean {
  return readJson<ScheduleItem[]>(KEYS.schedules) !== null;
}

/** Hapus semua data mode tamu (dipakai setelah dipindahkan ke akun cloud). */
export function clearLocalData() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

// ---------------------------------------------------------------------------
// Cloud backend (Supabase) — dipakai user yang login dengan akun
// ---------------------------------------------------------------------------

const SCHEDULE_COLUMNS = 'id, day_of_week, time, end_time, title, category, note, date, created_at';
const PAGE_SIZE = 1000;
const CHUNK_SIZE = 500;

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

function unwrap<T>(result: QueryResult<T>): T {
  if (result.error) throw result.error;
  return result.data as T;
}

/** PostgREST membatasi 1000 baris per request, jadi ambil per halaman. */
async function selectAll<T>(build: (from: number, to: number) => PromiseLike<QueryResult<T[]>>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = unwrap(await build(from, from + PAGE_SIZE - 1)) ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function inChunks<T>(items: T[], run: (chunk: T[]) => PromiseLike<QueryResult<unknown>>) {
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    unwrap(await run(items.slice(i, i + CHUNK_SIZE)));
  }
}

const seedPromises = new Map<string, Promise<void>>();

/**
 * Akun baru (atau akun lama dari versi sebelumnya yang menyimpan kategori di
 * browser) diberi kategori & preset awal sekali saja. Penanda disimpan di
 * user_metadata supaya preset yang sengaja dihapus user tidak muncul lagi.
 */
function ensureCloudSeed(sb: SupabaseClient, userId: string): Promise<void> {
  let promise = seedPromises.get(userId);
  if (!promise) {
    promise = (async () => {
      const { data } = await sb.auth.getSession();
      if (data.session?.user.user_metadata?.schedulin_seeded) return;

      // Versi lama menyimpan kategori/preset di localStorage walau login cloud — bawa ikut.
      const categories = readJson<CategoryItem[]>(KEYS.categories) ?? DEFAULT_CATEGORIES;
      const presets = readJson<PresetItem[]>(KEYS.presets) ?? DEFAULT_PRESETS;

      const existing = unwrap(await sb.from('categories').select('id').limit(1));
      if (!existing?.length) {
        unwrap(
          await sb.from('categories').upsert(
            categories.map((c) => ({ id: c.id, label: c.label, icon: c.icon, color: c.color, user_id: userId })),
            { onConflict: 'user_id,id', ignoreDuplicates: true }
          )
        );
      }

      const existingPresets = unwrap(await sb.from('presets').select('id').limit(1));
      if (!existingPresets?.length) {
        unwrap(
          await sb.from('presets').insert(
            presets.map((p) => ({ id: newId(), title: p.title, time: p.time, category: p.category, user_id: userId }))
          )
        );
      }

      unwrap(await sb.auth.updateUser({ data: { schedulin_seeded: true } }));
    })();
    seedPromises.set(userId, promise);
    promise.catch(() => seedPromises.delete(userId));
  }
  return promise;
}

export function createCloudBackend(userId: string): Backend {
  const client = async () => {
    const sb = await getSupabase();
    await ensureCloudSeed(sb, userId);
    return sb;
  };

  const loadWithLogs = async (sinceDate: string | null): Promise<AppData> => {
    const sb = await client();
    const [schedules, categories, presets, logs] = await Promise.all([
      selectAll<ScheduleItem>((from, to) =>
        sb.from('schedules').select(SCHEDULE_COLUMNS).order('time').range(from, to)
      ),
      selectAll<CategoryItem>((from, to) =>
        sb.from('categories').select('id, label, icon, color').order('created_at').range(from, to)
      ),
      selectAll<PresetItem>((from, to) =>
        sb.from('presets').select('id, title, time, category').order('created_at').range(from, to)
      ),
      selectAll<LogItem>((from, to) => {
        let q = sb.from('daily_logs').select('schedule_id, date').eq('status', true);
        if (sinceDate) q = q.gte('date', sinceDate);
        return q.order('date').range(from, to);
      }),
    ]);
    return {
      schedules: sortSchedules(schedules.map(normalizeSchedule)),
      categories,
      presets: presets.map((p) => ({ ...p, time: hhmm(p.time) ?? '00:00' })),
      logs,
    };
  };

  return {
    kind: 'cloud',

    loadAll: (sinceDate) => loadWithLogs(sinceDate),
    exportAll: () => loadWithLogs(null),

    async insertSchedules(items) {
      const sb = await client();
      await inChunks(items, (chunk) =>
        sb.from('schedules').insert(
          chunk.map((s) => ({
            id: s.id,
            day_of_week: s.day_of_week,
            time: s.time,
            end_time: s.end_time || null,
            title: s.title,
            category: s.category,
            note: s.note || null,
            date: s.date || null,
            ...(s.created_at ? { created_at: s.created_at } : {}),
            user_id: userId,
          }))
        )
      );
    },

    async updateSchedule(id, patch) {
      const sb = await client();
      unwrap(await sb.from('schedules').update(patch).eq('id', id));
    },

    async deleteSchedule(id) {
      const sb = await client();
      const rows = unwrap(await sb.from('schedules').select(SCHEDULE_COLUMNS).eq('id', id)) as ScheduleItem[];
      if (!rows?.length) return null;
      const logs = await selectAll<LogItem>((from, to) =>
        sb.from('daily_logs').select('schedule_id, date').eq('schedule_id', id).eq('status', true).range(from, to)
      );
      unwrap(await sb.from('schedules').delete().eq('id', id));
      return { schedule: normalizeSchedule(rows[0]), logs };
    },

    async setLog(scheduleId, date, done) {
      const sb = await client();
      if (done) {
        unwrap(
          await sb
            .from('daily_logs')
            .upsert(
              { schedule_id: scheduleId, date, status: true, user_id: userId },
              { onConflict: 'schedule_id,date' }
            )
        );
      } else {
        unwrap(await sb.from('daily_logs').delete().eq('schedule_id', scheduleId).eq('date', date));
      }
    },

    async insertLogs(logs) {
      const sb = await client();
      await inChunks(logs, (chunk) =>
        sb.from('daily_logs').upsert(
          chunk.map((l) => ({ schedule_id: l.schedule_id, date: l.date, status: true, user_id: userId })),
          { onConflict: 'schedule_id,date', ignoreDuplicates: true }
        )
      );
    },

    async insertCategories(items) {
      const sb = await client();
      unwrap(
        await sb
          .from('categories')
          .insert(items.map((c) => ({ id: c.id, label: c.label, icon: c.icon, color: c.color, user_id: userId })))
      );
    },

    async deleteCategory(id) {
      const sb = await client();
      unwrap(await sb.from('categories').delete().eq('id', id));
    },

    async insertPresets(items) {
      const sb = await client();
      unwrap(
        await sb
          .from('presets')
          .insert(items.map((p) => ({ id: p.id, title: p.title, time: p.time, category: p.category, user_id: userId })))
      );
    },

    async deletePreset(id) {
      const sb = await client();
      unwrap(await sb.from('presets').delete().eq('id', id));
    },

    async clearAll() {
      const sb = await client();
      // daily_logs ikut terhapus lewat ON DELETE CASCADE
      unwrap(await sb.from('schedules').delete().eq('user_id', userId));
      unwrap(await sb.from('daily_logs').delete().eq('user_id', userId));
      unwrap(await sb.from('presets').delete().eq('user_id', userId));
      unwrap(await sb.from('categories').delete().eq('user_id', userId));
    },
  };
}
