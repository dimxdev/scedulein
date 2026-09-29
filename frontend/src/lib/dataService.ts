import { supabase } from './supabase';

export interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  color: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'pink' | 'cyan' | 'indigo';
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
  time: string;
  title: string;
  category?: string;
  user_id?: string;
}

export interface DailyLogItem {
  id: string;
  schedule_id: string;
  date: string; // YYYY-MM-DD
  status: boolean;
}

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

export const COLOR_PALETTES: Record<CategoryItem['color'], { bg: string; dot: string }> = {
  blue: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300', dot: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', dot: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300', dot: 'bg-amber-500' },
  purple: { bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300', dot: 'bg-purple-500' },
  rose: { bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', dot: 'bg-rose-500' },
  pink: { bg: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300', dot: 'bg-pink-500' },
  cyan: { bg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300', dot: 'bg-cyan-500' },
  indigo: { bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300', dot: 'bg-indigo-500' },
};

// Initial realistic default routine seed
const DEFAULT_SEED_SCHEDULES: ScheduleItem[] = [
  // Senin (1)
  { id: 'seed-1', day_of_week: 1, time: '06:30', title: 'Sarapan bergizi & segelas air putih 🍳', category: 'health' },
  { id: 'seed-2', day_of_week: 1, time: '08:30', title: 'Review to-do list & mulai kerja / kuliah 💻', category: 'work' },
  { id: 'seed-3', day_of_week: 1, time: '12:00', title: 'Makan siang & istirahat sejenak 🍱', category: 'chill' },
  { id: 'seed-4', day_of_week: 1, time: '17:00', title: 'Beri makan kucing kesayangan & jalan sore 🐈', category: 'routine' },
  { id: 'seed-5', day_of_week: 1, time: '21:30', title: 'Skincare malam & baca buku 20 menit 📖', category: 'learn' },

  // Selasa (2)
  { id: 'seed-6', day_of_week: 2, time: '07:00', title: 'Stretching & olahraga ringan 15 menit 🧘', category: 'health' },
  { id: 'seed-7', day_of_week: 2, time: '09:00', title: 'Fokus pengerjaan project & coding 🚀', category: 'work' },
  { id: 'seed-8', day_of_week: 2, time: '16:00', title: 'Kopi santai sore & cemilan ☕', category: 'chill' },
  { id: 'seed-9', day_of_week: 2, time: '22:00', title: 'Tidur cukup sebelum larut malam 🌙', category: 'health' },

  // Rabu (3)
  { id: 'seed-10', day_of_week: 3, time: '08:00', title: 'Cek email & meeting pagi ☕', category: 'work' },
  { id: 'seed-11', day_of_week: 3, time: '15:30', title: 'Belajar teknologi baru / baca tutorial 📚', category: 'learn' },
  { id: 'seed-12', day_of_week: 3, time: '19:00', title: 'Nonton film / main game santai 🎮', category: 'chill' },

  // Kamis (4)
  { id: 'seed-13', day_of_week: 4, time: '07:30', title: 'Sarapan buah & jus segar 🍓', category: 'health' },
  { id: 'seed-14', day_of_week: 4, time: '10:00', title: 'Selesaikan tugas prioritas minggu ini 🎯', category: 'work' },
  { id: 'seed-15', day_of_week: 4, time: '17:30', title: 'Bersih-bersih kamar & meja kerja ✨', category: 'routine' },

  // Jumat (5)
  { id: 'seed-16', day_of_week: 5, time: '09:00', title: 'Review progress mingguan 📈', category: 'work' },
  { id: 'seed-17', day_of_week: 5, time: '17:00', title: 'Jumat santai - weekend is coming! 🎉', category: 'chill' },
  { id: 'seed-18', day_of_week: 5, time: '20:00', title: 'Hangout / Me-time malam 🍿', category: 'chill' },

  // Sabtu (6)
  { id: 'seed-19', day_of_week: 6, time: '08:30', title: 'Bangun santai & jalan pagi santai 🌿', category: 'health' },
  { id: 'seed-20', day_of_week: 6, time: '14:00', title: 'Eksplor hobi baru & dengerin musik 🎨', category: 'learn' },
  { id: 'seed-21', day_of_week: 6, time: '18:30', title: 'Makan malam enak bareng teman/keluarga 🍕', category: 'chill' },

  // Minggu (7)
  { id: 'seed-22', day_of_week: 7, time: '09:00', title: 'Cuci pakaian & self care day 🛁', category: 'routine' },
  { id: 'seed-23', day_of_week: 7, time: '15:00', title: 'Jadwalkan rencana minggu depan di Schedulin 📝', category: 'routine' },
  { id: 'seed-24', day_of_week: 7, time: '21:00', title: 'Tidur lelap menyiapkan energi hari Senin 💤', category: 'health' },
];

const LOCAL_STORAGE_KEY_SCHEDULES = 'schedulin_schedules_v1';
const LOCAL_STORAGE_KEY_LOGS = 'schedulin_daily_logs_v1';
const LOCAL_STORAGE_KEY_CATEGORIES = 'schedulin_categories_v1';
const LOCAL_STORAGE_KEY_PRESETS = 'schedulin_presets_v1';

export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('your-project-id') && !url.includes('placeholder'));
};

// Local storage helpers
const getLocalSchedules = (): ScheduleItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SCHEDULES);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SCHEDULES, JSON.stringify(DEFAULT_SEED_SCHEDULES));
      return DEFAULT_SEED_SCHEDULES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SEED_SCHEDULES;
  }
};

const saveLocalSchedules = (items: ScheduleItem[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_SCHEDULES, JSON.stringify(items));
};

const getLocalLogs = (): DailyLogItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalLogs = (logs: DailyLogItem[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(logs));
};

export const dataService = {
  // --- CATEGORIES ---
  getCategories(): CategoryItem[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
      if (!raw) {
        localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  addCategory(item: Omit<CategoryItem, 'id'>): CategoryItem {
    const categories = this.getCategories();
    const newCat: CategoryItem = {
      ...item,
      id: 'cat-' + Date.now(),
    };
    categories.push(newCat);
    localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    return newCat;
  },

  deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    if (categories.length <= 1) return false; // Prevent deleting all categories
    const filtered = categories.filter((c) => c.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(filtered));
    return true;
  },

  // --- PRESETS ---
  getPresets(): PresetItem[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PRESETS);
      if (!raw) {
        localStorage.setItem(LOCAL_STORAGE_KEY_PRESETS, JSON.stringify(DEFAULT_PRESETS));
        return DEFAULT_PRESETS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PRESETS;
    }
  },

  addPreset(item: Omit<PresetItem, 'id'>): PresetItem {
    const presets = this.getPresets();
    const newPreset: PresetItem = {
      ...item,
      id: 'pre-' + Date.now(),
    };
    presets.push(newPreset);
    localStorage.setItem(LOCAL_STORAGE_KEY_PRESETS, JSON.stringify(presets));
    return newPreset;
  },

  deletePreset(id: string): boolean {
    const presets = this.getPresets();
    const filtered = presets.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_PRESETS, JSON.stringify(filtered));
    return true;
  },

  // --- SCHEDULES ---
  async getSchedules(dayOfWeek?: number): Promise<ScheduleItem[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('schedules').select('*').order('time', { ascending: true });
        if (dayOfWeek) {
          query = query.eq('day_of_week', dayOfWeek);
        }
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local storage:', err);
      }
    }

    const all = getLocalSchedules();
    if (dayOfWeek) {
      return all
        .filter((s) => s.day_of_week === dayOfWeek)
        .sort((a, b) => a.time.localeCompare(b.time));
    }
    return all.sort((a, b) => a.time.localeCompare(b.time));
  },

  async addSchedule(item: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('schedules').insert(item).select().single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase insert failed, saving locally:', err);
      }
    }

    const all = getLocalSchedules();
    const newItem: ScheduleItem = {
      ...item,
      id: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    };
    all.push(newItem);
    saveLocalSchedules(all);
    return newItem;
  },

  async deleteSchedule(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('schedules').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete failed, removing locally:', err);
      }
    }

    const all = getLocalSchedules();
    const filtered = all.filter((s) => s.id !== id);
    saveLocalSchedules(filtered);
    return true;
  },

  // --- DAILY LOGS ---
  async getCompletedLogs(dateStr: string): Promise<string[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('daily_logs')
          .select('schedule_id')
          .eq('date', dateStr)
          .eq('status', true);
        if (!error && data) {
          return data.map((d) => d.schedule_id);
        }
      } catch (err) {
        console.warn('Supabase log fetch error, reading local logs:', err);
      }
    }

    const logs = getLocalLogs();
    return logs.filter((l) => l.date === dateStr && l.status).map((l) => l.schedule_id);
  },

  async toggleLog(scheduleId: string, dateStr: string, currentCompleted: boolean, userId?: string): Promise<boolean> {
    const nextStatus = !currentCompleted;

    if (isSupabaseConfigured()) {
      try {
        if (!nextStatus) {
          await supabase.from('daily_logs').delete().match({ schedule_id: scheduleId, date: dateStr });
        } else {
          await supabase.from('daily_logs').upsert({
            schedule_id: scheduleId,
            date: dateStr,
            status: true,
            user_id: userId,
          });
        }
        return nextStatus;
      } catch (err) {
        console.warn('Supabase toggle failed, saving locally:', err);
      }
    }

    let logs = getLocalLogs();
    if (!nextStatus) {
      logs = logs.filter((l) => !(l.schedule_id === scheduleId && l.date === dateStr));
    } else {
      logs = logs.filter((l) => !(l.schedule_id === scheduleId && l.date === dateStr));
      logs.push({
        id: 'log-' + Date.now(),
        schedule_id: scheduleId,
        date: dateStr,
        status: true,
      });
    }
    saveLocalLogs(logs);
    return nextStatus;
  }
};
