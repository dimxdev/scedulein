const MESSAGE_MAP: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'Email atau password salah.'],
  [/email not confirmed/i, 'Email belum dikonfirmasi. Cek inbox (atau folder spam) kamu dulu ya.'],
  [/user already registered|already been registered/i, 'Email ini sudah terdaftar. Silakan masuk.'],
  [/password should be at least/i, 'Password minimal 6 karakter.'],
  [/unable to validate email|invalid email/i, 'Format email tidak valid.'],
  [/rate limit|for security purposes|too many requests/i, 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'],
  [/failed to fetch|networkerror|network request failed|load failed/i, 'Tidak bisa terhubung ke server. Cek koneksi internetmu.'],
  [/jwt expired|invalid jwt|refresh token/i, 'Sesi login sudah berakhir. Silakan masuk lagi.'],
  [/row-level security|permission denied/i, 'Akses ditolak oleh database. Pastikan migrasi SQL terbaru sudah dijalankan.'],
  [/relation .* does not exist|could not find the table/i, 'Tabel database belum ada. Jalankan migrasi SQL terbaru di Supabase.'],
  [/column .* does not exist|could not find the .* column/i, 'Struktur database belum diperbarui. Jalankan migrasi SQL terbaru di Supabase.'],
  [/quota|exceeded the quota/i, 'Penyimpanan browser penuh. Hapus beberapa data atau export backup dulu.'],
];

/** Ubah error apa pun (Supabase, jaringan, dll.) jadi pesan ramah berbahasa Indonesia. */
export function friendlyError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err && 'message' in err
        ? String((err as { message: unknown }).message)
        : String(err ?? '');

  for (const [pattern, message] of MESSAGE_MAP) {
    if (pattern.test(raw)) return message;
  }
  return raw ? `Terjadi kesalahan: ${raw}` : 'Terjadi kesalahan yang tidak diketahui.';
}
