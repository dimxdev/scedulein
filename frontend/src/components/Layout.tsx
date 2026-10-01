import { Suspense, useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { CalendarDays, CheckCircle2, CloudUpload, Download, Settings, TrendingUp, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import SkyBackground from './SkyBackground';
import PageLoader from './PageLoader';
import { prefetchAppPages } from '../routes';
import { useReminderScheduler } from '../lib/reminders';
import { dismissMigrationOffer, localScheduleCount, shouldOfferMigration } from '../lib/guestMigration';
import { toast } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Layout() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const loadData = useDataStore((s) => s.load);
  const resetData = useDataStore((s) => s.reset);
  const reloadData = useDataStore((s) => s.reload);
  const dataStatus = useDataStore((s) => s.status);
  const dataError = useDataStore((s) => s.error);
  const isCloud = Boolean(user && !user.isGuest);
  const migrateGuestData = useDataStore((s) => s.migrateGuestData);
  const [offerMigration, setOfferMigration] = useState(() => isCloud && shouldOfferMigration());
  const [migrating, setMigrating] = useState(false);

  useReminderScheduler();

  const handleMigrate = async () => {
    setMigrating(true);
    const summary = await migrateGuestData();
    setMigrating(false);
    if (summary) {
      dismissMigrationOffer();
      setOfferMigration(false);
      toast.success(`${summary.schedules} jadwal dari mode tamu sudah pindah ke akunmu!`);
    }
  };

  // Muat data sekali per user; dipakai bersama oleh semua halaman
  useEffect(() => {
    if (user) loadData(user);
    return () => resetData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    prefetchAppPages();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
    }
  };

  const navItems = [
    { path: '/', label: 'Hari Ini', icon: CheckCircle2 },
    { path: '/manage', label: 'Atur Jadwal', icon: CalendarDays },
    { path: '/stats', label: 'Statistik', icon: TrendingUp },
    { path: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col relative font-sans text-slate-800 dark:text-slate-100">
      {/* Dynamic Animated Sky Wallpaper */}
      <SkyBackground />

      {/* Top Floating Glass Header */}
      <header className="sticky top-4 z-40 w-full px-4 sm:px-6 mb-4">
        <div className="max-w-4xl mx-auto backdrop-blur-xl bg-white/70 dark:bg-slate-900/75 border border-white/60 dark:border-white/10 rounded-3xl px-5 py-3.5 shadow-glass dark:shadow-glass-dark flex items-center justify-between transition-colors">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-300 via-orange-300 to-sky-400 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-xl">🐱</span>
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-sky-600 to-amber-500 dark:from-sky-400 dark:to-amber-300 bg-clip-text text-transparent">
                Schedulin
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {isCloud ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Cloud
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400" title="Data tersimpan otomatis di LocalStorage browser Anda">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Mode Lokal (Aktif)
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Center Nav for Desktop */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50" aria-label="Navigasi Utama">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  title={item.label}
                  className={`relative px-3 lg:px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-white dark:bg-slate-700/90 text-sky-600 dark:text-sky-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Install PWA, Theme Toggle & User */}
          <div className="flex items-center gap-2.5">
            {canInstall && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-500 text-amber-950 font-bold text-xs shadow-sm hover:scale-105 active:scale-95 transition-all"
                title="Install Schedulin ke perangkat Anda"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Install</span>
              </button>
            )}

            <ThemeToggle />

            {user && (
              <Link
                to="/settings"
                className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 group"
                aria-label={`Profil & pengaturan (${user.name})`}
                title="Profil & pengaturan"
              >
                <span className="hidden sm:inline-block max-w-[110px] truncate text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
                  {user.name}
                </span>
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-amber-300 text-white text-sm font-extrabold flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Install App banner (if prompt available) */}
        {canInstall && (
          <div className="sm:hidden max-w-4xl mx-auto mt-2">
            <div className="backdrop-blur-xl bg-amber-100/90 dark:bg-amber-950/80 border border-amber-300/60 dark:border-amber-700/60 rounded-2xl p-2.5 px-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-base">📲</span>
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  Pasang Schedulin di Layar Utama HP
                </span>
              </div>
              <button
                onClick={handleInstallClick}
                className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
              >
                Install
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-6 pb-28 md:pb-16 pt-2">
        <div className="max-w-4xl mx-auto">
          {offerMigration && dataStatus === 'ready' && (
            <div className="mb-4 p-4 rounded-2xl bg-sky-50/95 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <CloudUpload className="hidden sm:block w-6 h-6 flex-shrink-0 text-sky-500" />
              <p className="flex-1 text-sm font-semibold">
                Ada {localScheduleCount()} jadwal dari mode tamu di perangkat ini. Pindahkan ke akunmu?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleMigrate}
                  disabled={migrating}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {migrating ? 'Memindahkan...' : 'Pindahkan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dismissMigrationOffer();
                    setOfferMigration(false);
                  }}
                  className="p-1.5 rounded-xl text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50"
                  aria-label="Abaikan tawaran pindah data"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {dataStatus === 'error' && (
            <div role="alert" className="mb-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm font-semibold flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="flex-1">Gagal memuat data. {dataError}</span>
              <button
                type="button"
                onClick={() => reloadData()}
                className="self-start px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Coba lagi
              </button>
            </div>
          )}
          {/* Header tetap tampil saat chunk halaman sedang dimuat */}
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* Floating Bottom Nav Dock (Mobile Only) — with safe-area inset for iPhone */}
      <nav className="md:hidden fixed left-4 right-4 z-40" style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }} aria-label="Navigasi Utama">
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/85 border border-white/60 dark:border-white/10 rounded-3xl p-2 shadow-2xl flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 font-medium'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
