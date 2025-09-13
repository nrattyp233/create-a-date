-- Database schema setup for Create-A-Date app
-- This includes all necessary tables for the admin and PayPal functionality

-- Create users table with admin support
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    bio TEXT,
    photos TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    gender VARCHAR(10) NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{"interestedIn": ["male", "female"], "ageRange": {"min": 18, "max": 65}}',
    earned_badge_ids TEXT[] DEFAULT '{}',
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table for PayPal payment tracking
CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed
    paypal_order_id TEXT,
    paypal_transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create date_posts table (for the dating app functionality)
CREATE TABLE IF NOT EXISTS public.date_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    applicants INTEGER[] DEFAULT '{}',
    chosen_applicant_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    categories TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE
);

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
    id SERIAL PRIMARY KEY,
    user_1_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_2_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_1_id, user_2_id)
);

-- Create swipes table
CREATE TABLE IF NOT EXISTS public.swipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    swiped_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('left', 'right')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, swiped_user_id)
);

-- Insert admin user (ID 1 as expected by the app)
INSERT INTO public.users (
    id, name, age, bio, photos, interests, gender, is_premium, is_admin, email
) VALUES (
    1, 
    'Admin User', 
    30, 
    'Administrator of Create-A-Date platform',
    '{"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"}',
    '{"technology", "management", "dating"}',
    'male',
    TRUE,
    TRUE,
    'admin@create-a-date.com'
) ON CONFLICT (id) DO UPDATE SET
    is_admin = TRUE,
    is_premium = TRUE;

-- Insert some sample users for testing
INSERT INTO public.users (
    name, age, bio, photos, interests, gender, is_premium, is_admin, email
) VALUES 
(
    'Sarah Johnson', 
    25, 
    'Love hiking and coffee',
    '{"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"}',
    '{"hiking", "coffee", "reading"}',
    'female',
    FALSE,
    FALSE,
    'sarah@example.com'
),
(
    'Mike Chen', 
    28, 
    'Software engineer who loves cooking',
    '{"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"}',
    '{"coding", "cooking", "gaming"}',
    'male',
    TRUE,
    FALSE,
    'mike@example.com'
),
(
    'Emma Davis', 
    26, 
    'Artist and nature lover',
    '{"https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"}',
    '{"art", "nature", "photography"}',
    'female',
    FALSE,
    FALSE,
    'emma@example.com'
);

-- Insert sample order for revenue demonstration
INSERT INTO public.orders (
    user_id, amount, status, paypal_order_id, paypal_transaction_id
) VALUES (
    2, 10.00, 'paid', 'PAYPAL_ORDER_123', 'TXN_123456'
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_date_posts_updated_at ON date_posts;
CREATE TRIGGER update_date_posts_updated_at 
    BEFORE UPDATE ON date_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (but allow all operations for development)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on date_posts" ON date_posts;
CREATE POLICY "Allow all operations on date_posts" ON date_posts FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on matches" ON matches;
CREATE POLICY "Allow all operations on matches" ON matches FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on swipes" ON swipes;
CREATE POLICY "Allow all operations on swipes" ON swipes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);