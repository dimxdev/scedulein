-- =============================================================================
-- Migrasi Schedulin v2 untuk database yang SUDAH berjalan.
-- Jalankan sekali di Supabase Dashboard → SQL Editor. Aman dijalankan ulang.
-- =============================================================================

-- 1. BUG FIX: policy DELETE untuk daily_logs belum ada, sehingga uncheck
--    checklist diblokir RLS secara diam-diam.
DROP POLICY IF EXISTS "Users can delete their own logs" ON daily_logs;
CREATE POLICY "Users can delete their own logs" ON daily_logs FOR DELETE USING (auth.uid() = user_id);

-- 2. Kolom baru untuk jadwal: jam selesai, catatan, dan tanggal (tugas sekali jalan)
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS date DATE;

-- user_id otomatis diisi dari sesi login
ALTER TABLE schedules ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE daily_logs ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS schedules_user_idx ON schedules (user_id);
CREATE INDEX IF NOT EXISTS daily_logs_user_date_idx ON daily_logs (user_id, date);

-- 3. Kategori & preset kini tersimpan di cloud (sebelumnya hanya di browser)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  label TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '✨',
  color TEXT NOT NULL DEFAULT 'purple',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  time TIME NOT NULL,
  category TEXT NOT NULL DEFAULT 'routine',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
CREATE POLICY "Users can view their own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own presets" ON presets;
DROP POLICY IF EXISTS "Users can insert their own presets" ON presets;
DROP POLICY IF EXISTS "Users can update their own presets" ON presets;
DROP POLICY IF EXISTS "Users can delete their own presets" ON presets;
CREATE POLICY "Users can view their own presets" ON presets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own presets" ON presets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own presets" ON presets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own presets" ON presets FOR DELETE USING (auth.uid() = user_id);
