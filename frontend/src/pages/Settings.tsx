import { useRef, useState } from 'react';
import { Bell, BellOff, CloudUpload, Coffee, Database, Download, FileUp, Info, LogOut, Save, Smartphone, User } from 'lucide-react';
import type { AppData } from '../lib/dataService';
import { downloadExport, parseImport } from '../lib/transfer';
import { localScheduleCount, dismissMigrationOffer } from '../lib/guestMigration';
import {
  LEAD_OPTIONS,
  notificationPermission,
  requestNotificationPermission,
  setReminderSettings,
  showNotification,
  useReminderSettings,
} from '../lib/reminders';
import { disablePush, enablePush, pushSupport, updatePushLead } from '../lib/push';
import { friendlyError } from '../lib/errors';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { toast } from '../store/toastStore';
import Modal from '../components/Modal';

const cardClass =
  'bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-glass dark:shadow-glass-dark space-y-4';
const headingClass = 'text-base font-bold text-slate-800 dark:text-white flex items-center gap-2';
const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 transition-colors disabled:opacity-50';
const primaryButton =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-sky-500 to-amber-400 text-white shadow-sm disabled:opacity-50';

function ProfileSection() {
  const { user, updateGuestName } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  if (!user) return null;

  return (
    <section className={cardClass} aria-labelledby="profile-title">
      <h2 id="profile-title" className={headingClass}>
        <User className="w-4 h-4 text-sky-500" /> Profil
      </h2>
      {user.isGuest ? (
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateGuestName(name);
            toast.success('Nama panggilan diperbarui!');
          }}
        >
          <label htmlFor="settings-name" className="sr-only">
            Nama panggilan
          </label>
          <input
            id="settings-name"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm font-medium"
          />
          <button type="submit" className={primaryButton}>
            <Save className="w-4 h-4" /> Simpan nama
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Masuk sebagai <strong className="text-slate-800 dark:text-white">{user.email}</strong>
        </p>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {user.isGuest
          ? '🟢 Mode tamu — data tersimpan di browser perangkat ini. Rutin export backup supaya aman.'
          : '⚡ Akun cloud — jadwal, kategori, dan preset tersinkron di semua perangkat.'}
      </p>
    </section>
  );
}

function ReminderSection() {
  const user = useAuthStore((s) => s.user);
  const settings = useReminderSettings();
  const [permission, setPermission] = useState(notificationPermission);
  const [busy, setBusy] = useState(false);
  const support = pushSupport();
  const isCloud = Boolean(user && !user.isGuest);
  // Push server: user cloud di browser yang mendukung. Selain itu pakai pengingat lokal.
  const canPush = isCloud && support === 'supported';

  const enable = async () => {
    setBusy(true);
    try {
      if (canPush && user) {
        await enablePush(user.id, settings.leadMinutes);
        setReminderSettings({ ...settings, enabled: true, push: true });
        toast.success('Pengingat aktif! Notifikasi tetap datang walaupun app ditutup.');
      } else {
        const result = await requestNotificationPermission();
        if (result === 'denied') throw new Error('Izin notifikasi ditolak. Aktifkan lewat pengaturan situs di browser.');
        if (result !== 'granted' && result !== 'unsupported') throw new Error('Izin notifikasi belum diberikan.');
        setReminderSettings({ ...settings, enabled: true, push: false });
        toast.success('Pengingat aktif!');
      }
    } catch (err) {
      toast.error(friendlyError(err).replace(/^Terjadi kesalahan: /, ''));
    } finally {
      setPermission(notificationPermission());
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      if (settings.push) await disablePush();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setReminderSettings({ ...settings, enabled: false, push: false });
      setBusy(false);
    }
  };

  const changeLead = async (leadMinutes: number) => {
    setReminderSettings({ ...settings, leadMinutes });
    if (settings.push) {
      try {
        await updatePushLead(leadMinutes);
      } catch (err) {
        toast.error(friendlyError(err));
      }
    }
  };

  return (
    <section className={cardClass} aria-labelledby="reminder-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="reminder-title" className={headingClass}>
            <Bell className="w-4 h-4 text-amber-500" /> Pengingat jadwal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Notifikasi muncul menjelang jadwal yang belum dicentang.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          aria-label="Aktifkan pengingat"
          disabled={busy || (permission === 'unsupported' && !canPush)}
          onClick={() => (settings.enabled ? disable() : enable())}
          className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors disabled:opacity-40 ${
            settings.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              settings.enabled ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {settings.enabled && (
        <p
          className={`text-xs font-semibold flex items-center gap-1.5 ${
            settings.push ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {settings.push ? (
            <>
              <Smartphone className="w-4 h-4" /> Push aktif di perangkat ini — tetap datang walaupun app ditutup.
            </>
          ) : (
            <>
              <Info className="w-4 h-4" /> Mode lokal — hanya bekerja selama Schedulin terbuka.
            </>
          )}
        </p>
      )}

      {support === 'ios-needs-install' && (
        <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/50 text-xs text-sky-900 dark:text-sky-100 space-y-1">
          <p className="font-bold">📱 Pakai iPhone/iPad?</p>
          <p>
            Supaya notifikasi datang walaupun app ditutup, pasang dulu: ketuk <strong>Share</strong> →{' '}
            <strong>Add to Home Screen</strong>, lalu buka Schedulin dari Home Screen dan aktifkan pengingat di sini. (Butuh iOS
            16.4 ke atas.)
          </p>
        </div>
      )}
      {permission === 'unsupported' && support !== 'ios-needs-install' && (
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
          <BellOff className="w-4 h-4" /> Browser ini tidak mendukung notifikasi.
        </p>
      )}
      {permission === 'denied' && (
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          Izin notifikasi diblokir. Buka pengaturan situs di browser untuk mengizinkannya.
        </p>
      )}

      {settings.enabled && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor="lead-select" className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Ingatkan
          </label>
          <select
            id="lead-select"
            value={settings.leadMinutes}
            onChange={(e) => changeLead(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium"
          >
            {LEAD_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m === 0 ? 'Tepat waktu' : `${m} menit sebelumnya`}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={secondaryButton}
            onClick={async () => {
              const ok = await showNotification('⏰ Tes pengingat', 'Mantap! Notifikasi Schedulin sudah berfungsi 🐱');
              if (!ok) toast.error('Notifikasi gagal ditampilkan. Cek izin notifikasi browser.');
            }}
          >
            Kirim tes
          </button>
        </div>
      )}

      {!isCloud && (
        <p className="text-[11px] text-slate-400 flex gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Di mode tamu pengingat hanya bekerja selama Schedulin terbuka. Daftar akun supaya notifikasi tetap datang walaupun app
          ditutup.
        </p>
      )}
    </section>
  );
}

function DataSection() {
  const user = useAuthStore((s) => s.user);
  const { exportData, importData, migrateGuestData } = useDataStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<AppData | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [localCount, setLocalCount] = useState(() => (user && !user.isGuest ? localScheduleCount() : 0));

  const handleExport = async () => {
    setBusy(true);
    const data = await exportData();
    setBusy(false);
    if (data) {
      downloadExport(data);
      toast.success(`Backup berisi ${data.schedules.length} jadwal diunduh.`);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = parseImport(await file.text());
      setConfirmReplace(false);
      setPending(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'File tidak bisa dibaca.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const runImport = async (mode: 'merge' | 'replace') => {
    if (!pending) return;
    setBusy(true);
    const summary = await importData(pending, mode);
    setBusy(false);
    setPending(null);
    if (summary) {
      toast.success(
        `Import selesai: ${summary.schedules} jadwal, ${summary.categories} kategori, ${summary.presets} preset, ${summary.logs} riwayat checklist.`
      );
    }
  };

  const handleMigrate = async () => {
    setBusy(true);
    const summary = await migrateGuestData();
    setBusy(false);
    if (summary) {
      dismissMigrationOffer();
      setLocalCount(0);
      toast.success(`${summary.schedules} jadwal dari mode tamu sudah pindah ke akunmu!`);
    }
  };

  return (
    <section className={cardClass} aria-labelledby="data-title">
      <h2 id="data-title" className={headingClass}>
        <Database className="w-4 h-4 text-purple-500" /> Data & backup
      </h2>

      {localCount > 0 && (
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/50 space-y-2">
          <p className="text-sm font-bold text-sky-900 dark:text-sky-100">Ada {localCount} jadwal dari mode tamu di perangkat ini</p>
          <p className="text-xs text-sky-800/80 dark:text-sky-200/80">
            Pindahkan ke akunmu supaya tersinkron. Kategori bernama sama akan digabung dan jadwal kembar dilewati.
          </p>
          <button type="button" onClick={handleMigrate} disabled={busy} className={primaryButton}>
            <CloudUpload className="w-4 h-4" /> Pindahkan ke akun
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <button type="button" onClick={handleExport} disabled={busy} className={secondaryButton}>
          <Download className="w-4 h-4" /> Export backup (.json)
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={secondaryButton}>
          <FileUp className="w-4 h-4" /> Import dari file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <p className="text-[11px] text-slate-400">
        Backup berisi jadwal, kategori, preset, dan seluruh riwayat checklist. Bisa dipakai untuk pindah perangkat atau dari mode tamu ke akun.
      </p>

      {pending && (
        <Modal onClose={() => setPending(null)} title="Import data" icon={<FileUp className="w-4 h-4" />}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              File berisi <strong>{pending.schedules.length}</strong> jadwal, <strong>{pending.categories.length}</strong> kategori,{' '}
              <strong>{pending.presets.length}</strong> preset, dan <strong>{pending.logs.length}</strong> riwayat checklist.
            </p>
            <button type="button" disabled={busy} onClick={() => runImport('merge')} className={`${primaryButton} w-full py-3`}>
              Gabungkan dengan data sekarang
            </button>
            {confirmReplace ? (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-2">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  Semua jadwal, kategori, preset, dan riwayat yang ada sekarang akan dihapus permanen. Yakin?
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runImport('replace')}
                  className="w-full py-2.5 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                >
                  Ya, hapus & ganti semua
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmReplace(true)} className={`${secondaryButton} w-full py-3`}>
                Ganti semua data dengan isi file…
              </button>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}

function SupportSection() {
  const [zoomed, setZoomed] = useState(false);

  return (
    <section
      aria-labelledby="support-title"
      className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-sky-50 dark:from-amber-950/30 dark:via-slate-900/90 dark:to-sky-950/30 border border-amber-200/70 dark:border-amber-900/40 rounded-3xl p-5 sm:p-6 shadow-glass dark:shadow-glass-dark"
    >
      <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
        <div className="flex-1 space-y-2">
          <h2 id="support-title" className={headingClass}>
            <Coffee className="w-4 h-4 text-amber-600" /> Traktir developernya kopi ☕
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Schedulin gratis dan tanpa iklan. Kalau app ini membantu harimu lebih teratur, kamu bisa dukung developernya
            lewat QRIS. Berapa pun nominalnya sangat berarti dan bikin si kucing makin semangat ngoding! 🐱🧡
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bisa dibayar pakai e-wallet atau m-banking apa saja (GoPay, OVO, DANA, ShopeePay, BCA, dll). Buka di HP?
            Ketuk QR-nya untuk memperbesar & menyimpan, lalu pilih <em>upload QR dari galeri</em> di aplikasi pembayaranmu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="self-center flex-shrink-0 rounded-2xl overflow-hidden bg-white border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          aria-label="Perbesar QRIS untuk dukungan developer"
        >
          <img src="/qris-support.png" alt="QRIS Jasa Software Developer" width={358} height={500} loading="lazy" className="w-40 h-auto" />
          <span className="block py-1.5 text-[11px] font-bold text-slate-500 bg-slate-50">Ketuk untuk memperbesar</span>
        </button>
      </div>

      {zoomed && (
        <Modal onClose={() => setZoomed(false)} title="Dukung Schedulin 🧡" icon={<Coffee className="w-4 h-4" />} maxWidth="max-w-sm">
          <div className="space-y-4 text-center">
            <img
              src="/qris-support.png"
              alt="QRIS Jasa Software Developer"
              width={358}
              height={500}
              className="w-full h-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Scan pakai aplikasi pembayaran apa saja. Terima kasih banyak! 🙏</p>
            <a
              href="/qris-support.png"
              download="QRIS-Dukung-Schedulin.png"
              className="w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-bold bg-amber-400 hover:bg-amber-500 text-amber-950"
            >
              <Download className="w-4 h-4" /> Simpan gambar QRIS
            </a>
          </div>
        </Modal>
      )}
    </section>
  );
}

export default function Settings() {
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 dark:text-white">Pengaturan ⚙️</h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Profil, pengingat, dan cadangan data.</p>
      </div>

      <ProfileSection />
      <ReminderSection />
      <DataSection />
      <SupportSection />

      <button
        type="button"
        onClick={() => signOut()}
        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-white/80 dark:bg-slate-900/80 border border-rose-200/70 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Keluar
      </button>

      <p className="text-center text-[11px] text-slate-400">Schedulin v2 · dibuat dengan 🧡 dan sedikit bulu kucing</p>
    </div>
  );
}
