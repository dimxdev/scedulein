import { lazy } from 'react';

// Setiap halaman jadi chunk terpisah: halaman login tidak ikut mengunduh
// kode dashboard, dan sebaliknya.
const loaders = {
  login: () => import('./pages/Login'),
  register: () => import('./pages/Register'),
  dashboard: () => import('./pages/Dashboard'),
  manage: () => import('./pages/ManageSchedule'),
  stats: () => import('./pages/Stats'),
  settings: () => import('./pages/Settings'),
};

export const LoginPage = lazy(loaders.login);
export const RegisterPage = lazy(loaders.register);
export const DashboardPage = lazy(loaders.dashboard);
export const ManagePage = lazy(loaders.manage);
export const StatsPage = lazy(loaders.stats);
export const SettingsPage = lazy(loaders.settings);

/** Unduh chunk halaman app di waktu senggang supaya pindah halaman tetap instan. */
export function prefetchAppPages() {
  const run = () => {
    void loaders.dashboard();
    void loaders.manage();
    void loaders.stats();
    void loaders.settings();
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1500);
}
