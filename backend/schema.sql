-- Create Schedules Table
CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  time TIME NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'routine',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Daily Logs Table (To track completions)
CREATE TABLE daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(schedule_id, date) -- Ensure only one log per schedule per day
);

-- Enable Row Level Security (RLS)
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies for Schedules
CREATE POLICY "Users can view their own schedules" 
ON schedules FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules" 
ON schedules FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" 
ON schedules FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" 
ON schedules FOR DELETE 
USING (auth.uid() = user_id);

-- Create Policies for Daily Logs
CREATE POLICY "Users can view their own logs" 
ON daily_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs" 
ON daily_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs" 
ON daily_logs FOR UPDATE 
USING (auth.uid() = user_id);
