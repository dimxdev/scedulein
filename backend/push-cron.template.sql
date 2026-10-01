-- =============================================================================
-- Jadwal cron: panggil Edge Function `send-reminders` setiap menit.
--
-- Sebelum menjalankan:
--   1. Aktifkan extension pg_cron & pg_net (Dashboard → Database → Extensions).
--   2. Ganti <PROJECT_REF> dan <CRON_SECRET> di bawah. CRON_SECRET harus sama
--      dengan secret CRON_SECRET di Edge Functions → Secrets.
--
-- Rahasia disimpan di Supabase Vault, bukan ditulis langsung di perintah cron.
-- Aman dijalankan ulang.
-- =============================================================================

-- Simpan / perbarui secret di Vault
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'schedulin_cron_secret') THEN
    PERFORM vault.update_secret(
      (SELECT id FROM vault.secrets WHERE name = 'schedulin_cron_secret'),
      '<CRON_SECRET>'
    );
  ELSE
    PERFORM vault.create_secret('<CRON_SECRET>', 'schedulin_cron_secret');
  END IF;
END $$;

-- Hapus jadwal lama (kalau ada) lalu buat ulang
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'schedulin-send-reminders';

SELECT cron.schedule(
  'schedulin-send-reminders',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'schedulin_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);

-- Cek: SELECT * FROM cron.job;  |  Riwayat: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
-- Hentikan: SELECT cron.unschedule('schedulin-send-reminders');
