import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Sparkles, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured } from '../lib/supabase';
import AuthShell, { authInputClass, authLabelClass, authPrimaryButtonClass } from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const isCloud = isSupabaseConfigured();
  return isCloud ? <CloudLogin /> : <LocalLogin />;
}

/** Supabase tidak dikonfigurasi: cukup nama panggilan, data tersimpan di perangkat. */
function LocalLogin() {
  const [name, setName] = useState('');
  const signInGuest = useAuthStore((s) => s.signInGuest);
  const navigate = useNavigate();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    signInGuest(name);
    navigate('/', { replace: true });
  };

  return (
    <AuthShell title="Schedulin" subtitle="Rutinitas ceria & produktif bersama si kucing lucu 🐾">
      <h2 className="text-lg font-bold mb-1">Mulai sekarang</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        Tanpa daftar. Semua jadwal tersimpan aman di perangkat ini.
      </p>
      <form onSubmit={handleStart} className="space-y-4">
        <div>
          <label htmlFor="guest-name" className={authLabelClass}>
            Nama panggilan
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="guest-name"
              type="text"
              autoComplete="nickname"
              maxLength={30}
              placeholder="Misal: Dimas"
              className={authInputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className={authPrimaryButtonClass}>
          Mulai
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </AuthShell>
  );
}

function CloudLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signInGuest } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    signInGuest('Kawan');
    navigate('/', { replace: true });
  };

  return (
    <AuthShell title="Schedulin" subtitle="Rutinitas ceria & produktif bersama si kucing lucu 🐾">
      <h2 className="text-lg font-bold mb-5">Masuk ke akun</h2>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs font-semibold"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="login-email" className={authLabelClass}>
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              className={authInputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className={authLabelClass}>
            Password
          </label>
          <PasswordInput
            id="login-password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
          {loading ? 'Memproses...' : 'Masuk'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-5 pt-5 border-t border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={handleGuestLogin}
          className="w-full py-3 px-4 rounded-2xl font-bold text-xs bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 group"
        >
          <Sparkles className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform" />
          Coba Mode Tamu (tanpa daftar)
        </button>
        <p className="text-[11px] text-center text-slate-400 mt-2">
          Data mode tamu tersimpan di perangkat ini dan bisa dipindah ke akun nanti.
        </p>
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
        Belum punya akun?{' '}
        <Link to="/register" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
          Daftar baru
        </Link>
      </p>
    </AuthShell>
  );
}
