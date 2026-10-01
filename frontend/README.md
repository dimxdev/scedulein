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

## Skrip

- `bun run dev` — server pengembangan
- `bun run build` — typecheck + build produksi
- `bun run lint` — oxlint
