import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  initTheme: () => void;
}

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
  // Warna status bar HP mengikuti tema app, bukan hanya tema sistem
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#090D1A' : '#E0F2FE');
}

let systemListenerAttached = false;

export const useThemeStore = create<ThemeState>((set, get) => ({
  // Kelas `dark` sudah dipasang oleh script inline di index.html sebelum render
  isDarkMode: typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),

  toggleTheme: () => {
    const next = !get().isDarkMode;
    applyTheme(next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // abaikan kalau storage tidak tersedia
    }
    set({ isDarkMode: next });
  },

  initTheme: () => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('theme');
    } catch {
      // abaikan
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = stored === 'dark' || (!stored && media.matches);
    applyTheme(isDark);
    set({ isDarkMode: isDark });

    // Kalau user belum memilih manual, ikuti perubahan tema sistem
    if (systemListenerAttached) return;
    systemListenerAttached = true;
    media.addEventListener('change', (e) => {
      if (localStorage.getItem('theme')) return;
      applyTheme(e.matches);
      set({ isDarkMode: e.matches });
    });
  },
}));
