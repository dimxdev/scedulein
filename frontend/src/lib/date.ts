export const DAYS = [
  { id: 1, name: 'Senin', short: 'Sen' },
  { id: 2, name: 'Selasa', short: 'Sel' },
  { id: 3, name: 'Rabu', short: 'Rab' },
  { id: 4, name: 'Kamis', short: 'Kam' },
  { id: 5, name: 'Jumat', short: 'Jum' },
  { id: 6, name: 'Sabtu', short: 'Sab' },
  { id: 7, name: 'Minggu', short: 'Min' },
] as const;

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Tanggal lokal "YYYY-MM-DD". Jangan pakai toISOString() — itu tanggal UTC,
 * sehingga di WIB antara 00:00–07:00 hasilnya masih tanggal kemarin.
 */
export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateStr(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 1 = Senin … 7 = Minggu */
export function dayOfWeek(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

export function dayName(dayId: number): string {
  return DAYS.find((d) => d.id === dayId)?.name ?? '';
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "HH:MM" → menit sejak tengah malam */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}
