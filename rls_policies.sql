-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on date_posts" ON date_posts;
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;
DROP POLICY IF EXISTS "Allow all operations on matches" ON matches;
DROP POLICY IF EXISTS "Allow all operations on swipes" ON swipes;

-- Users table policies
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Date posts table policies
CREATE POLICY "Anyone can view date posts" ON date_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own date posts" ON date_posts
  FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Users can update their own date posts" ON date_posts
  FOR UPDATE USING (auth.uid()::text = created_by::text);

CREATE POLICY "Users can delete their own date posts" ON date_posts
  FOR DELETE USING (auth.uid()::text = created_by::text);

-- Matches table policies
CREATE POLICY "Users can view their own matches" ON matches
  FOR SELECT USING (
    auth.uid()::text = user_1_id::text OR 
    auth.uid()::text = user_2_id::text
  );

CREATE POLICY "Users can create matches" ON matches
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_1_id::text OR 
    auth.uid()::text = user_2_id::text
  );

-- Messages table policies
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = receiver_id::text
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

-- Swipes table policies
CREATE POLICY "Users can view their own swipes" ON swipes
  FOR SELECT USING (auth.uid()::text = swiper_id::text);

CREATE POLICY "Users can create their own swipes" ON swipes
  FOR INSERT WITH CHECK (auth.uid()::text = swiper_id::text);

-- Admin policies (for user with email brattyp233@gmail.com)
CREATE POLICY "Admin can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'brattyp233@gmail.com'
    )
  );

CREATE POLICY "Admin can manage all date posts" ON date_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'brattyp233@gmail.com'
    )
  );
