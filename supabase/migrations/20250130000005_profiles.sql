-- Phase 1: profiles table for future auth/employees (standalone; link to auth.users later if needed)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  full_name text,
  role text DEFAULT 'staff' CHECK (role IN ('admin','manager','staff','viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow service role all profiles" ON profiles;
CREATE POLICY "Allow service role all profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Allow public read profiles" ON profiles;
CREATE POLICY "Allow public read profiles" ON profiles FOR SELECT USING (true);
