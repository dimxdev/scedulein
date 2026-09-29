import { Outlet, Link, useLocation } from 'react-router-dom';
import { CalendarDays, LogOut, CheckCircle2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import SkyBackground from './SkyBackground';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

export default function Layout() {
  const location = useLocation();
  const { user, isCloud, signOut } = useAuthStore();

  const navItems = [
    { path: '/', label: 'Hari Ini', icon: CheckCircle2 },
    { path: '/manage', label: 'Atur Jadwal', icon: CalendarDays },
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
                  className={`relative px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'text-sky-600 dark:text-sky-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-white dark:bg-slate-700/90 rounded-xl -z-10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Theme Toggle & User */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <span className="hidden sm:inline-block max-w-[120px] truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {user.isGuest ? 'Tamu' : user.email.split('@')[0]}
                </span>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  aria-label="Keluar dari akun"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-6 pb-28 md:pb-16 pt-2">
        <div className="max-w-4xl mx-auto">
          <Outlet />
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
