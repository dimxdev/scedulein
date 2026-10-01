import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mail, MailCheck, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured } from '../lib/supabase';
import AuthShell, { authInputClass, authLabelClass, authPrimaryButtonClass } from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [loading, setLoading] = useState(false);

  const signUp = useAuthStore((s) => s.signUp);
  const navigate = useNavigate();

  // Tanpa Supabase tidak ada akun — langsung ke halaman mulai
  if (!isSupabaseConfigured()) return <Navigate to="/login" replace />;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signUp(email.trim(), password);
      if (result === 'signed-in') {
        navigate('/', { replace: true });
        return;
      }
      setSentTo(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  if (sentTo) {
    return (
      <AuthShell title="Cek Email Kamu" subtitle="Satu langkah lagi! ✉️">
        <div className="text-center space-y-4" role="status">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <MailCheck className="w-7 h-7" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Kami sudah mengirim link konfirmasi ke <strong className="text-slate-800 dark:text-white">{sentTo}</strong>.
            Klik link tersebut, lalu masuk dengan email & password yang tadi.
          </p>
          <p className="text-xs text-slate-400">Tidak ada di inbox? Cek folder spam/promosi.</p>
          <Link to="/login" className={authPrimaryButtonClass}>
            Ke halaman masuk
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Daftar Schedulin" subtitle="Buat akun supaya jadwalmu tersinkron di semua perangkat ✨">
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs font-semibold"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="register-email" className={authLabelClass}>
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="register-email"
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
          <label htmlFor="register-password" className={authLabelClass}>
            Password
          </label>
          <PasswordInput
            id="register-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="Minimal 6 karakter"
            minLength={6}
          />
        </div>

        <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
          <UserPlus className="w-4 h-4" />
          {loading ? 'Mendaftarkan...' : 'Buat Akun'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
          Masuk di sini
        </Link>
      </p>
    </AuthShell>
  );
}
