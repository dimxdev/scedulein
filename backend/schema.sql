-- =============================================================================
-- Schedulin — skema lengkap untuk instalasi BARU.
-- Database yang sudah berjalan: cukup jalankan backend/migrations/002_v2.sql
-- =============================================================================

-- Jadwal: rutin mingguan (date NULL) atau tugas sekali jalan (date terisi)
CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  time TIME NOT NULL,
  end_time TIME,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'routine',
  note TEXT,
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checklist harian
CREATE TABLE daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(schedule_id, date) -- satu log per jadwal per hari
);

-- Kategori kustom per user (id berupa teks, mis. 'work' atau 'cat-<uuid>')
CREATE TABLE categories (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  label TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '✨',
  color TEXT NOT NULL DEFAULT 'purple',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- Preset jadwal cepat per user
CREATE TABLE presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  time TIME NOT NULL,
  category TEXT NOT NULL DEFAULT 'routine',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX schedules_user_idx ON schedules (user_id);
CREATE INDEX daily_logs_user_date_idx ON daily_logs (user_id, date);

-- Row Level Security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Schedules
CREATE POLICY "Users can view their own schedules" ON schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own schedules" ON schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own schedules" ON schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own schedules" ON schedules FOR DELETE USING (auth.uid() = user_id);

-- Daily logs (DELETE wajib ada: uncheck menghapus baris log)
CREATE POLICY "Users can view their own logs" ON daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own logs" ON daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own logs" ON daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own logs" ON daily_logs FOR DELETE USING (auth.uid() = user_id);

-- Categories
CREATE POLICY "Users can view their own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Presets
CREATE POLICY "Users can view their own presets" ON presets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own presets" ON presets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own presets" ON presets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own presets" ON presets FOR DELETE USING (auth.uid() = user_id);
