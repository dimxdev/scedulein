-- =============================================================================
-- Migrasi Schedulin: Push notification (notifikasi walaupun app tertutup)
-- Jalankan sekali di Supabase Dashboard → SQL Editor. Aman dijalankan ulang.
-- Setelah ini, jalankan juga backend/push-cron.sql (jadwal cron tiap menit).
-- =============================================================================

-- Langganan push per perangkat
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  lead_minutes SMALLINT NOT NULL DEFAULT 5 CHECK (lead_minutes BETWEEN 0 AND 120),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Catatan notifikasi yang sudah terkirim, supaya tidak dikirim dua kali.
-- Hanya diakses Edge Function (service role) — sengaja tanpa policy untuk user.
CREATE TABLE IF NOT EXISTS push_deliveries (
  subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (subscription_id, schedule_id, date)
);

CREATE INDEX IF NOT EXISTS push_deliveries_date_idx ON push_deliveries (date);

ALTER TABLE push_deliveries ENABLE ROW LEVEL SECURITY;
