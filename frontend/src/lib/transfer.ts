import {
  COLOR_PALETTES,
  DEFAULT_CATEGORIES,
  newId,
  type AppData,
  type Backend,
  type CategoryColor,
  type CategoryItem,
  type LogItem,
  type PresetItem,
  type ScheduleItem,
} from './dataService';

export interface ExportFile {
  app: 'schedulin';
  version: 2;
  exportedAt: string;
  data: AppData;
}

export interface ImportSummary {
  schedules: number;
  categories: number;
  presets: number;
  logs: number;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function buildExport(data: AppData): ExportFile {
  return { app: 'schedulin', version: 2, exportedAt: new Date().toISOString(), data };
}

export function downloadExport(data: AppData) {
  const blob = new Blob([JSON.stringify(buildExport(data), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `schedulin-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Baca & bersihkan file backup. Entri yang rusak dibuang, bukan membuat seluruh import gagal. */
export function parseImport(text: string): AppData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('File bukan JSON yang valid.');
  }
  const obj = raw as Partial<ExportFile> & Partial<AppData>;
  const data = (obj?.data ?? obj) as Partial<Record<keyof AppData, unknown>>;
  const arr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []);

  const categories: CategoryItem[] = arr(data.categories)
    .map((c) => ({
      id: str(c.id, 80),
      label: str(c.label, 30),
      icon: str(c.icon, 8) || '✨',
      color: (str(c.color) in COLOR_PALETTES ? str(c.color) : 'purple') as CategoryColor,
    }))
    .filter((c) => c.id && c.label);

  const presets: PresetItem[] = arr(data.presets)
    .map((p) => ({ id: str(p.id, 80), title: str(p.title, 120), time: str(p.time, 8).slice(0, 5), category: str(p.category, 80) }))
    .filter((p) => p.title && TIME_RE.test(p.time));

  const schedules: ScheduleItem[] = arr(data.schedules)
    .map((s) => ({
      id: str(s.id, 80),
      day_of_week: Number(s.day_of_week),
      time: str(s.time, 8).slice(0, 5),
      end_time: TIME_RE.test(str(s.end_time)) ? str(s.end_time).slice(0, 5) : null,
      title: str(s.title, 120),
      category: str(s.category, 80) || 'routine',
      note: str(s.note) || null,
      date: DATE_RE.test(str(s.date)) ? str(s.date) : null,
      created_at: str(s.created_at, 40) || undefined,
    }))
    .filter((s) => s.id && s.title && TIME_RE.test(s.time) && s.day_of_week >= 1 && s.day_of_week <= 7);

  const logs: LogItem[] = arr(data.logs)
    .map((l) => ({ schedule_id: str(l.schedule_id, 80), date: str(l.date, 10) }))
    .filter((l) => l.schedule_id && DATE_RE.test(l.date));

  if (schedules.length === 0 && categories.length === 0 && presets.length === 0) {
    throw new Error('File ini tidak berisi data Schedulin.');
  }
  return { schedules, categories, presets, logs };
}

/**
 * Masukkan data ke backend.
 * - replace: hapus semua data lama dulu, lalu isi dengan data file.
 * - merge: gabungkan; kategori disamakan lewat nama, jadwal/preset kembar dilewati.
 */
export async function importInto(
  backend: Backend,
  incoming: AppData,
  mode: 'merge' | 'replace',
  existing: AppData
): Promise<ImportSummary> {
  if (mode === 'replace') {
    await backend.clearAll();
    existing = { schedules: [], categories: [], presets: [], logs: [] };
  }

  // Kategori
  const categoryMap = new Map<string, string>();
  const usedIds = new Set(existing.categories.map((c) => c.id));
  const newCategories: CategoryItem[] = [];
  for (const cat of incoming.categories) {
    const match = existing.categories.find((c) => c.label.toLowerCase() === cat.label.toLowerCase());
    if (match) {
      categoryMap.set(cat.id, match.id);
      continue;
    }
    const id = usedIds.has(cat.id) ? 'cat-' + newId() : cat.id;
    usedIds.add(id);
    categoryMap.set(cat.id, id);
    newCategories.push({ ...cat, id });
  }
  if (existing.categories.length + newCategories.length === 0) newCategories.push(...DEFAULT_CATEGORIES);
  if (newCategories.length) await backend.insertCategories(newCategories);
  const mapCategory = (id: string) => categoryMap.get(id) ?? id;

  // Preset
  const presetKey = (p: Pick<PresetItem, 'title' | 'time'>) => `${p.title.toLowerCase()}|${p.time}`;
  const presetSeen = new Set(existing.presets.map(presetKey));
  const newPresets: PresetItem[] = [];
  for (const p of incoming.presets) {
    if (presetSeen.has(presetKey(p))) continue;
    presetSeen.add(presetKey(p));
    newPresets.push({ ...p, id: newId(), category: mapCategory(p.category) });
  }
  if (newPresets.length) await backend.insertPresets(newPresets);

  // Jadwal — jadwal kembar diarahkan ke yang sudah ada supaya riwayat checklist tetap tersambung
  const scheduleKey = (s: ScheduleItem) => `${s.title.toLowerCase()}|${s.time}|${s.day_of_week}|${s.date ?? ''}`;
  const existingByKey = new Map(existing.schedules.map((s) => [scheduleKey(s), s.id]));
  const scheduleMap = new Map<string, string>();
  const newSchedules: ScheduleItem[] = [];
  for (const s of incoming.schedules) {
    const dup = existingByKey.get(scheduleKey(s));
    if (dup) {
      scheduleMap.set(s.id, dup);
      continue;
    }
    const id = newId();
    scheduleMap.set(s.id, id);
    existingByKey.set(scheduleKey(s), id);
    newSchedules.push({ ...s, id, category: mapCategory(s.category) });
  }
  if (newSchedules.length) await backend.insertSchedules(newSchedules);

  // Riwayat checklist
  const logs = incoming.logs
    .filter((l) => scheduleMap.has(l.schedule_id))
    .map((l) => ({ schedule_id: scheduleMap.get(l.schedule_id)!, date: l.date }));
  if (logs.length) await backend.insertLogs(logs);

  return {
    schedules: newSchedules.length,
    categories: newCategories.length,
    presets: newPresets.length,
    logs: logs.length,
  };
}
