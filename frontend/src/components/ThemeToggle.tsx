import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <button
      role="switch"
      aria-checked={isDarkMode}
      onClick={toggleTheme}
      className="relative flex items-center gap-1.5 p-1.5 px-2 rounded-full bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-white/10 shadow-glass dark:shadow-glass-dark hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none transition-all text-xs font-bold"
      aria-label={isDarkMode ? 'Beralih ke Mode Siang' : 'Beralih ke Mode Malam'}
      title={isDarkMode ? 'Beralih ke Mode Siang' : 'Beralih ke Mode Malam'}
    >
      <div
        className={`p-1.5 rounded-full transition-all ${
          !isDarkMode ? 'bg-amber-300 text-amber-900 shadow-sm' : 'text-slate-400'
        }`}
      >
        <Sun className="w-4 h-4" />
      </div>

      <div
        className={`p-1.5 rounded-full transition-all ${
          isDarkMode ? 'bg-indigo-600 text-indigo-100 shadow-sm' : 'text-slate-400'
        }`}
      >
        <Moon className="w-4 h-4" />
      </div>

      <span className="hidden sm:inline pr-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
        {isDarkMode ? 'Malam' : 'Siang'}
      </span>
    </button>
  );
}
