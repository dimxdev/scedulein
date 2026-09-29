import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured } from '../lib/dataService';
import { Link, useNavigate } from 'react-router-dom';
import SkyBackground from '../components/SkyBackground';
import MascotCat from '../components/MascotCat';
import { useThemeStore } from '../store/themeStore';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { isDarkMode } = useThemeStore();
  const { signInGuest, setUser } = useAuthStore();
  const navigate = useNavigate();
  const isCloud = isSupabaseConfigured();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isCloud) {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          isGuest: false,
        });
      }
    } else {
      // Offline/Local mode: log in with entered email
      signInGuest(email.split('@')[0] || 'Kawan Schedulin');
    }

    setLoading(false);
    navigate('/', { replace: true });
  };

  const handleGuestLogin = () => {
    signInGuest('Sahabat Kucing');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative font-sans text-slate-800 dark:text-slate-100">
      <SkyBackground />

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Mascot Header */}
        <div className="text-center mb-4">
          <MascotCat isNight={isDarkMode} size="md" />
          <h1 className="text-3xl font-display font-extrabold tracking-tight mt-2 bg-gradient-to-r from-sky-600 via-amber-500 to-orange-500 dark:from-sky-300 dark:via-purple-300 dark:to-amber-200 bg-clip-text text-transparent">
            Schedulin
          </h1>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
            Rutinitas ceria & produktif bersama si kucing lucu 🐾
          </p>
        </div>

        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-3xl p-7 shadow-glass dark:shadow-glass-dark transition-all">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Masuk ke Akun</h2>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              isCloud 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
            }`}>
              {isCloud ? '⚡ Cloud Supabase' : '🟢 Mode Offline / Lokal'}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-sky-500 to-amber-400 hover:from-sky-400 hover:to-amber-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Memproses...' : 'Masuk Sekarang'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Instant Demo Access */}
          <div className="mt-5 pt-5 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-3 px-4 rounded-2xl font-bold text-xs bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform" />
              <span>Coba Langsung Mode Demo (Tanpa Daftar)</span>
            </button>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
            Belum punya akun?{' '}
            <Link to="/register" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
              Daftar Baru
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
