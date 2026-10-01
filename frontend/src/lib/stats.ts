import type { CategoryItem, ScheduleItem } from './dataService';
import { addDays, dayOfWeek, toDateStr } from './date';

export interface DayStat {
  date: string;
  scheduled: number;
  completed: number;
}

/** Hari dihitung "berhasil" kalau minimal separuh jadwalnya selesai. */
export const SUCCESS_RATIO = 0.5;

export const isSuccessDay = (d: DayStat) => d.scheduled > 0 && d.completed / d.scheduled >= SUCCESS_RATIO;

const doneKey = (date: string, id: string) => `${date}|${id}`;

/**
 * Tanggal mulai berlakunya jadwal. Jadwal lama tanpa created_at dianggap
 * berlaku sejak checklist pertama (supaya hari-hari sebelum user mulai
 * memakai app tidak terhitung "gagal").
 */
function startDates(schedules: ScheduleItem[], done: Set<string>, todayStr: string): Map<string, string> {
  let earliestLog = todayStr;
  for (const key of done) {
    const date = key.slice(0, 10);
    if (date < earliestLog) earliestLog = date;
  }
  const map = new Map<string, string>();
  for (const s of schedules) {
    map.set(s.id, s.created_at ? toDateStr(new Date(s.created_at)) : earliestLog);
  }
  return map;
}

/** Jadwal yang berlaku pada tanggal tertentu. */
export function schedulesOn(schedules: ScheduleItem[], date: Date, starts?: Map<string, string>): ScheduleItem[] {
  const dateStr = toDateStr(date);
  const dow = dayOfWeek(date);
  return schedules.filter((s) => {
    if (s.date) return s.date === dateStr;
    if (s.day_of_week !== dow) return false;
    const start = starts?.get(s.id);
    return !start || start <= dateStr;
  });
}

/** Statistik per hari, dari `days - 1` hari lalu sampai hari ini (urut kronologis). */
export function dailyStats(schedules: ScheduleItem[], done: Set<string>, today: Date, days: number): DayStat[] {
  const todayStr = toDateStr(today);
  const starts = startDates(schedules, done, todayStr);
  const result: DayStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const dateStr = toDateStr(date);
    const items = schedulesOn(schedules, date, starts);
    result.push({
      date: dateStr,
      scheduled: items.length,
      completed: items.filter((s) => done.has(doneKey(dateStr, s.id))).length,
    });
  }
  return result;
}

/**
 * Streak = hari berhasil berturut-turut. Hari tanpa jadwal dilewati (tidak
 * memutus). Hari ini yang belum berhasil juga tidak memutus — masih ada waktu.
 */
export function computeStreaks(stats: DayStat[]): { current: number; best: number } {
  let best = 0;
  let run = 0;
  for (const d of stats) {
    if (d.scheduled === 0) continue;
    if (isSuccessDay(d)) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  let current = 0;
  for (let i = stats.length - 1; i >= 0; i--) {
    const d = stats[i];
    if (d.scheduled === 0) continue;
    if (isSuccessDay(d)) current++;
    else if (i === stats.length - 1) continue; // hari ini belum selesai
    else break;
  }
  return { current, best };
}

export interface CategoryStat {
  category: CategoryItem | null;
  categoryId: string;
  scheduled: number;
  completed: number;
}

/** Penyelesaian per kategori dalam rentang statistik (exclude hari ini yang masih berjalan). */
export function categoryStats(
  schedules: ScheduleItem[],
  categories: CategoryItem[],
  done: Set<string>,
  today: Date,
  days: number
): CategoryStat[] {
  const todayStr = toDateStr(today);
  const starts = startDates(schedules, done, todayStr);
  const byId = new Map<string, CategoryStat>();
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const dateStr = toDateStr(date);
    for (const s of schedulesOn(schedules, date, starts)) {
      const known = categories.find((c) => c.id === s.category) ?? null;
      const id = known ? known.id : '__none';
      const stat = byId.get(id) ?? { category: known, categoryId: id, scheduled: 0, completed: 0 };
      stat.scheduled++;
      if (done.has(doneKey(dateStr, s.id))) stat.completed++;
      byId.set(id, stat);
    }
  }
  return [...byId.values()].sort((a, b) => b.scheduled - a.scheduled);
}
