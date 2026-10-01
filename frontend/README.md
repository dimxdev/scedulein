# Schedulin 🐱

Pencatat rutinitas mingguan bertema kucing. PWA berbasis React 19 + Vite + Tailwind + Zustand, dengan Supabase sebagai backend (opsional).

## Fitur

- Checklist harian dengan sorotan kegiatan yang **sedang berlangsung / berikutnya / terlewat**
- Jadwal **rutin mingguan** (bisa banyak hari sekaligus) dan **tugas sekali jalan** bertanggal
- Jam selesai & catatan opsional, edit jadwal, hapus dengan **Urungkan**
- Salin jadwal satu hari ke hari lain
- **Statistik & streak**: grafik 7 hari, heatmap 12 minggu, penyelesaian per kategori
- Maskot kucing yang bereaksi ke progress (mahkota untuk streak ≥ 7 hari)
- **Pengingat** via notifikasi browser (selama app terbuka)
- **Export / import** backup JSON, dan pindahkan data mode tamu ke akun cloud
- Mode siang/malam, bisa dipasang sebagai aplikasi (PWA)

## Mode data

| Mode | Kapan | Penyimpanan |
| --- | --- | --- |
| Tamu | Tombol "Coba Mode Tamu", atau Supabase tidak dikonfigurasi | `localStorage` perangkat ini |
| Cloud | Login dengan akun | Supabase (tersinkron antar perangkat) |

## Menjalankan

```bash
bun install
cp .env.example .env   # isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY (opsional)
bun run dev
```

## Database Supabase

- **Instalasi baru:** jalankan `backend/schema.sql` di Supabase → SQL Editor.
- **Database lama (sebelum v2):** jalankan `backend/migrations/002_v2.sql` sekali. Migrasi ini:
  - menambah policy `DELETE` untuk `daily_logs` (tanpa ini, uncheck checklist tidak tersimpan),
  - menambah kolom `end_time`, `note`, `date` di `schedules`,
  - membuat tabel `categories` & `presets` supaya tersinkron di cloud.

## Push notification (pengingat walaupun app tertutup)

Hanya untuk user yang login (akun cloud). Alurnya: browser mendaftarkan push subscription ke tabel
`push_subscriptions` → `pg_cron` memanggil Edge Function `send-reminders` tiap menit → fungsi mengirim
Web Push ke jadwal yang akan dimulai → service worker (`src/sw.ts`) menampilkan notifikasi.

Setup sekali:

1. **SQL** — jalankan `backend/migrations/003_push.sql` di SQL Editor.
2. **Extension** — Dashboard → Database → Extensions → aktifkan `pg_cron` dan `pg_net`.
3. **Edge Function** — Dashboard → Edge Functions → *Deploy a new function* → *Via Editor*, beri nama
   `send-reminders`, tempel isi `supabase/functions/send-reminders/index.ts`, deploy. Lalu di pengaturan
   fungsi, **matikan "Verify JWT"** (fungsi ini diamankan dengan header `x-cron-secret`).
   Alternatif CLI: `npx supabase functions deploy send-reminders --no-verify-jwt --project-ref <ref>`.
4. **Secrets** — Edge Functions → Secrets → tambahkan `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`
   (nilainya ada di `backend/.vapid-keys.local`, file lokal yang tidak di-commit).
5. **Cron** — jalankan `backend/push-cron.sql.local` (versi template yang sudah terisi) di SQL Editor.
   Kalau file itu tidak ada, pakai `backend/push-cron.template.sql` dan isi placeholder-nya.

Kunci publik VAPID juga tertanam di `src/lib/push.ts`. Kalau kuncinya diganti, perbarui di dua tempat itu.

Catatan perangkat: Android/desktop Chrome langsung bisa. iPhone/iPad butuh iOS 16.4+ dan app harus
dipasang lewat **Share → Add to Home Screen**, lalu pengingat diaktifkan dari app yang terpasang.

## Skrip

- `bun run dev` — server pengembangan
- `bun run build` — typecheck + build produksi
- `bun run lint` — oxlint
