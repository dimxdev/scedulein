import { create } from 'zustand';
import type { AppUser } from './authStore';
import { toast } from './toastStore';
import {
  clearLocalData,
  createCloudBackend,
  localBackend,
  newId,
  sortSchedules,
  type AppData,
  type Backend,
  type CategoryItem,
  type PresetItem,
  type ScheduleItem,
} from '../lib/dataService';
import { addDays, toDateStr } from '../lib/date';
import { friendlyError } from '../lib/errors';
import { importInto, type ImportSummary } from '../lib/transfer';

/** Riwayat checklist yang dimuat untuk statistik & streak. */
export const LOG_WINDOW_DAYS = 365;

export const doneKey = (date: string, scheduleId: string) => `${date}|${scheduleId}`;

export type NewSchedule = Omit<ScheduleItem, 'id' | 'created_at'>;
export type SchedulePatch = Partial<NewSchedule>;
type Undo = () => Promise<void>;

interface DataState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  ownerId: string | null;
  schedules: ScheduleItem[];
  categories: CategoryItem[];
  presets: PresetItem[];
  /** Kunci `${date}|${scheduleId}` untuk setiap jadwal yang sudah dicentang. */
  done: Set<string>;

  load: (user: AppUser) => Promise<void>;
  reload: () => Promise<void>;
  reset: () => void;
  toggle: (scheduleId: string, date: string) => Promise<void>;
  addSchedules: (items: NewSchedule[]) => Promise<boolean>;
  updateSchedule: (id: string, patch: SchedulePatch) => Promise<boolean>;
  deleteSchedule: (id: string) => Promise<Undo | null>;
  addCategory: (item: Omit<CategoryItem, 'id'>) => Promise<CategoryItem | null>;
  deleteCategory: (id: string) => Promise<Undo | null>;
  addPreset: (item: Omit<PresetItem, 'id'>) => Promise<boolean>;
  deletePreset: (id: string) => Promise<Undo | null>;
  /** Semua data termasuk seluruh riwayat (untuk backup). */
  exportData: () => Promise<AppData | null>;
  importData: (data: AppData, mode: 'merge' | 'replace') => Promise<ImportSummary | null>;
  /** Pindahkan data mode tamu di perangkat ini ke akun cloud yang sedang login. */
  migrateGuestData: () => Promise<ImportSummary | null>;
}

let backend: Backend = localBackend;
let currentUser: AppUser | null = null;
/** Antrian per jadwal+tanggal supaya klik cepat berulang tidak saling balapan di server. */
const logQueues = new Map<string, Promise<void>>();

export const getBackend = () => backend;

const fail = (err: unknown, prefix?: string) => {
  const message = friendlyError(err);
  toast.error(prefix ? `${prefix} ${message}` : message);
};

const initialData = {
  schedules: [] as ScheduleItem[],
  categories: [] as CategoryItem[],
  presets: [] as PresetItem[],
  done: new Set<string>(),
};

export const useDataStore = create<DataState>((set, get) => ({
  status: 'idle',
  error: null,
  ownerId: null,
  ...initialData,

  load: async (user) => {
    const isNewOwner = get().ownerId !== user.id;
    currentUser = user;
    backend = user.isGuest ? localBackend : createCloudBackend(user.id);
    set({
      ownerId: user.id,
      error: null,
      // Tetap tampilkan data lama saat reload; kosongkan kalau ganti akun
      ...(isNewOwner ? { ...initialData, done: new Set<string>(), status: 'loading' as const } : {}),
    });

    try {
      const since = toDateStr(addDays(new Date(), -LOG_WINDOW_DAYS));
      const data = await backend.loadAll(since);
      if (get().ownerId !== user.id) return; // user sudah berganti selama loading
      set({
        status: 'ready',
        schedules: data.schedules,
        categories: data.categories,
        presets: data.presets,
        done: new Set(data.logs.map((l) => doneKey(l.date, l.schedule_id))),
      });
    } catch (err) {
      if (get().ownerId !== user.id) return;
      set({ status: 'error', error: friendlyError(err) });
    }
  },

  reload: async () => {
    if (currentUser) await get().load(currentUser);
  },

  reset: () => {
    currentUser = null;
    backend = localBackend;
    set({ status: 'idle', error: null, ownerId: null, ...initialData, done: new Set<string>() });
  },

  toggle: async (scheduleId, date) => {
    const key = doneKey(date, scheduleId);
    const nextDone = !get().done.has(key);
    const apply = (value: boolean) =>
      set((state) => {
        const done = new Set(state.done);
        if (value) done.add(key);
        else done.delete(key);
        return { done };
      });

    apply(nextDone); // optimistic
    const previous = logQueues.get(key) ?? Promise.resolve();
    const job = previous.then(() => backend.setLog(scheduleId, date, nextDone));
    logQueues.set(key, job.catch(() => undefined));
    try {
      await job;
    } catch (err) {
      apply(!nextDone);
      fail(err, 'Gagal menyimpan checklist.');
    }
  },

  addSchedules: async (items) => {
    const created: ScheduleItem[] = items.map((item) => ({
      ...item,
      id: newId(),
      created_at: new Date().toISOString(),
    }));
    try {
      await backend.insertSchedules(created);
      set((state) => ({ schedules: sortSchedules([...state.schedules, ...created]) }));
      return true;
    } catch (err) {
      fail(err, 'Gagal menyimpan jadwal.');
      return false;
    }
  },

  updateSchedule: async (id, patch) => {
    try {
      await backend.updateSchedule(id, patch);
      set((state) => ({
        schedules: sortSchedules(state.schedules.map((s) => (s.id === id ? { ...s, ...patch } : s))),
      }));
      return true;
    } catch (err) {
      fail(err, 'Gagal memperbarui jadwal.');
      return false;
    }
  },

  deleteSchedule: async (id) => {
    const before = get().schedules;
    set({ schedules: before.filter((s) => s.id !== id) }); // optimistic
    try {
      const snapshot = await backend.deleteSchedule(id);
      if (!snapshot) return null;
      return async () => {
        try {
          await backend.insertSchedules([snapshot.schedule]);
          if (snapshot.logs.length) await backend.insertLogs(snapshot.logs);
          set((state) => {
            const done = new Set(state.done);
            snapshot.logs.forEach((l) => done.add(doneKey(l.date, l.schedule_id)));
            return { schedules: sortSchedules([...state.schedules, snapshot.schedule]), done };
          });
        } catch (err) {
          fail(err, 'Gagal mengembalikan jadwal.');
        }
      };
    } catch (err) {
      set({ schedules: before });
      fail(err, 'Gagal menghapus jadwal.');
      return null;
    }
  },

  addCategory: async (item) => {
    const category: CategoryItem = { ...item, id: 'cat-' + newId() };
    try {
      await backend.insertCategories([category]);
      set((state) => ({ categories: [...state.categories, category] }));
      return category;
    } catch (err) {
      fail(err, 'Gagal menyimpan kategori.');
      return null;
    }
  },

  deleteCategory: async (id) => {
    const before = get().categories;
    const removed = before.find((c) => c.id === id);
    if (!removed) return null;
    if (before.length <= 1) {
      toast.error('Minimal harus ada 1 kategori tersisa.');
      return null;
    }
    set({ categories: before.filter((c) => c.id !== id) });
    try {
      await backend.deleteCategory(id);
      return async () => {
        try {
          await backend.insertCategories([removed]);
          set((state) => ({ categories: [...state.categories, removed] }));
        } catch (err) {
          fail(err, 'Gagal mengembalikan kategori.');
        }
      };
    } catch (err) {
      set({ categories: before });
      fail(err, 'Gagal menghapus kategori.');
      return null;
    }
  },

  addPreset: async (item) => {
    const preset: PresetItem = { ...item, id: newId() };
    try {
      await backend.insertPresets([preset]);
      set((state) => ({ presets: [...state.presets, preset] }));
      return true;
    } catch (err) {
      fail(err, 'Gagal menyimpan preset.');
      return false;
    }
  },

  deletePreset: async (id) => {
    const before = get().presets;
    const removed = before.find((p) => p.id === id);
    if (!removed) return null;
    set({ presets: before.filter((p) => p.id !== id) });
    try {
      await backend.deletePreset(id);
      return async () => {
        try {
          await backend.insertPresets([removed]);
          set((state) => ({ presets: [...state.presets, removed] }));
        } catch (err) {
          fail(err, 'Gagal mengembalikan preset.');
        }
      };
    } catch (err) {
      set({ presets: before });
      fail(err, 'Gagal menghapus preset.');
      return null;
    }
  },

  exportData: async () => {
    try {
      return await backend.exportAll();
    } catch (err) {
      fail(err, 'Gagal menyiapkan backup.');
      return null;
    }
  },

  importData: async (data, mode) => {
    const { schedules, categories, presets } = get();
    try {
      const summary = await importInto(backend, data, mode, { schedules, categories, presets, logs: [] });
      await get().reload();
      return summary;
    } catch (err) {
      fail(err, 'Gagal mengimpor data.');
      await get().reload(); // tampilkan kondisi sebenarnya kalau import berhenti di tengah
      return null;
    }
  },

  migrateGuestData: async () => {
    if (backend.kind !== 'cloud') return null;
    try {
      const localData = await localBackend.exportAll();
      const { schedules, categories, presets } = get();
      const summary = await importInto(backend, localData, 'merge', { schedules, categories, presets, logs: [] });
      clearLocalData();
      await get().reload();
      return summary;
    } catch (err) {
      fail(err, 'Gagal memindahkan data tamu.');
      return null;
    }
  },
}));
