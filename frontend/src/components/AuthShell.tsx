import type { ReactNode } from 'react';
import { useThemeStore } from '../store/themeStore';
import SkyBackground from './SkyBackground';
import MascotCat from './MascotCat';
import ThemeToggle from './ThemeToggle';

/** Kerangka bersama halaman Login & Daftar. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative font-sans text-slate-800 dark:text-slate-100">
      <SkyBackground />

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      <main className="w-full max-w-md py-12">
        <div className="text-center mb-4">
          <MascotCat isNight={isDarkMode} />
          <h1 className="text-3xl font-display font-extrabold tracking-tight mt-2 bg-gradient-to-r from-sky-600 via-amber-500 to-orange-500 dark:from-sky-300 dark:via-purple-300 dark:to-amber-200 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">{subtitle}</p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/85 border border-white/60 dark:border-white/10 rounded-3xl p-6 sm:p-7 shadow-glass dark:shadow-glass-dark">
          {children}
        </div>
      </main>
    </div>
  );
}

export const authInputClass =
  'w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium transition-all';
export const authLabelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';
export const authPrimaryButtonClass =
  'w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-sky-500 to-amber-400 hover:from-sky-400 hover:to-amber-500 text-white shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2';
