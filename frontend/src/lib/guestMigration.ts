import { GUEST_USED_KEY } from '../store/authStore';
import { hasLocalData } from './dataService';

/** Jumlah jadwal mode tamu di perangkat ini yang bisa dipindah ke akun (0 = tidak ada). */
export function localScheduleCount(): number {
  if (!hasLocalData()) return 0;
  try {
    const items = JSON.parse(localStorage.getItem('schedulin_schedules_v1') ?? '[]') as unknown[];
    return Array.isArray(items) ? items.length : 0;
  } catch {
    return 0;
  }
}

/** Tawarkan migrasi hanya kalau mode tamu memang pernah dipakai di perangkat ini. */
export function shouldOfferMigration(): boolean {
  return localStorage.getItem(GUEST_USED_KEY) === '1' && localScheduleCount() > 0;
}

export function dismissMigrationOffer() {
  localStorage.removeItem(GUEST_USED_KEY);
}
