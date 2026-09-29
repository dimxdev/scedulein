import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured } from '../lib/dataService';
import { Link, useNavigate } from 'react-router-dom';
import SkyBackground from '../components/SkyBackground';
import MascotCat from '../components/MascotCat';
import { useThemeStore } from '../store/themeStore';
import { Mail, Lock, UserPlus } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { isDarkMode } = useThemeStore();
  const { signInGuest } = useAuthStore();
  const navigate = useNavigate();
  const isCloud = isSupabaseConfigured();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);

    if (isCloud) {
      const { error: regError } = await supabase.auth.signUp({ email, password });
      if (regError) {
        setError(regError.message);
        setLoading(false);
        return;
      }
      setMsg('Registrasi akun berhasil! Silakan langsung login.');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      // Local mode
      signInGuest(email.split('@')[0] || 'Kawan Schedulin');
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative font-sans text-slate-800 dark:text-slate-100">
      <SkyBackground />

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <MascotCat isNight={isDarkMode} size="md" />
          <h1 className="text-3xl font-display font-extrabold tracking-tight mt-2 bg-gradient-to-r from-sky-600 via-amber-500 to-orange-500 dark:from-sky-300 dark:via-purple-300 dark:to-amber-200 bg-clip-text text-transparent">
            Daftar Schedulin
          </h1>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
            Buat akun baru untuk mulai menyusun rutinitas harianmu ✨
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-3xl p-7 shadow-glass dark:shadow-glass-dark transition-all">
          {error && (
            <div role="alert" className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {msg && (
            <div role="alert" aria-live="polite" className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-300 text-xs font-semibold">
              {msg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="register-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="register-email"
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
              <label htmlFor="register-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-sky-500 to-amber-400 hover:from-sky-400 hover:to-amber-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Mendaftarkan...' : 'Buat Akun'}</span>
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
