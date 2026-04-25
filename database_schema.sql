-- Create Enums
CREATE TYPE user_role AS ENUM ('user', 'super_admin');
CREATE TYPE reimbursement_status AS ENUM ('pending', 'approved', 'rejected');

-- Create Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  department TEXT,
  bank_name TEXT,
  bank_account TEXT,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Categories
INSERT INTO categories (name, description) VALUES
('ATK', 'Alat Tulis Kantor (Kertas, Pena, dll)'),
('Air Minum', 'Air Galon, Kopi, Teh untuk kantor'),
('Transportasi', 'Bensin, Tol, Parkir, Grab/Gojek'),
('Konsumsi', 'Makan siang meeting, Snack'),
('Lain-lain', 'Pengeluaran lainnya yang disetujui');

-- Create Reimbursements Table
CREATE TABLE reimbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL, -- e.g., 'May 2024'
  title TEXT NOT NULL,
  status reimbursement_status DEFAULT 'pending'::reimbursement_status NOT NULL,
  total_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Reimbursement Items Table
CREATE TABLE reimbursement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reimbursement_id UUID REFERENCES reimbursements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  vendor TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reimbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reimbursement_items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories: Anyone can read active categories, Admin can do all
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Reimbursements: Users can CRUD own, Admins can do all
CREATE POLICY "Users can view own reimbursements" ON reimbursements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reimbursements" ON reimbursements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending reimbursements" ON reimbursements FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Users can delete own pending reimbursements" ON reimbursements FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Super admins can view all reimbursements" ON reimbursements FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Super admins can update all reimbursements" ON reimbursements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Reimbursement Items: Users can CRUD own, Admins can do all
CREATE POLICY "Users can view own reimbursement items" ON reimbursement_items FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "Users can insert own reimbursement items" ON reimbursement_items FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "Users can update own pending reimbursement items" ON reimbursement_items FOR UPDATE USING (
  user_id = auth.uid() AND (
    reimbursement_id IS NULL OR 
    EXISTS (SELECT 1 FROM reimbursements WHERE id = reimbursement_id AND status = 'pending')
  )
);
CREATE POLICY "Users can delete own pending reimbursement items" ON reimbursement_items FOR DELETE USING (
  user_id = auth.uid() AND (
    reimbursement_id IS NULL OR 
    EXISTS (SELECT 1 FROM reimbursements WHERE id = reimbursement_id AND status = 'pending')
  )
);

CREATE POLICY "Super admins can view all reimbursement items" ON reimbursement_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_reimbursements_updated_at BEFORE UPDATE ON reimbursements FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Storage Bucket (requires manual creation in dashboard or this SQL if using supabaase sql)
-- insert into storage.buckets (id, name, public) values ('receipts', 'receipts', true);
-- CREATE POLICY "Anyone can read receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
-- CREATE POLICY "Authenticated users can upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
