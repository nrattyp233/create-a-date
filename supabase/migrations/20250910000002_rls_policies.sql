-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- ================================================
-- USERS TABLE POLICIES
-- ================================================

-- Users can view all other users (for browsing/swiping)
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can create their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Admins can update any user (for admin features)
CREATE POLICY "Admins can update any user" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND is_admin = true
        )
    );

-- ================================================
-- DATES TABLE POLICIES
-- ================================================

-- Everyone can view all date posts
CREATE POLICY "Anyone can view date posts" ON dates
    FOR SELECT USING (true);

-- Users can create their own date posts
CREATE POLICY "Users can create their own dates" ON dates
    FOR INSERT WITH CHECK (auth.uid()::text = creator_id::text);

-- Users can update their own date posts
CREATE POLICY "Users can update their own dates" ON dates
    FOR UPDATE USING (auth.uid()::text = creator_id::text);

-- Users can delete their own date posts
CREATE POLICY "Users can delete their own dates" ON dates
    FOR DELETE USING (auth.uid()::text = creator_id::text);

-- ================================================
-- MATCHES TABLE POLICIES
-- ================================================

-- Users can view matches they're involved in
CREATE POLICY "Users can view their matches" ON matches
    FOR SELECT USING (
        auth.uid()::text = user1_id::text OR 
        auth.uid()::text = user2_id::text
    );

-- Users can create matches where they're one of the participants
CREATE POLICY "Users can create matches they're in" ON matches
    FOR INSERT WITH CHECK (
        auth.uid()::text = user1_id::text OR 
        auth.uid()::text = user2_id::text
    );

-- Users can update matches they're involved in
CREATE POLICY "Users can update their matches" ON matches
    FOR UPDATE USING (
        auth.uid()::text = user1_id::text OR 
        auth.uid()::text = user2_id::text
    );

-- ================================================
-- MESSAGES TABLE POLICIES
-- ================================================

-- Users can view messages in matches they're part of
CREATE POLICY "Users can view messages in their matches" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = messages.match_id 
            AND (
                matches.user1_id::text = auth.uid()::text OR 
                matches.user2_id::text = auth.uid()::text
            )
        )
    );

-- Users can send messages in matches they're part of
CREATE POLICY "Users can send messages in their matches" ON messages
    FOR INSERT WITH CHECK (
        auth.uid()::text = sender_id::text AND
        EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = messages.match_id 
            AND (
                matches.user1_id::text = auth.uid()::text OR 
                matches.user2_id::text = auth.uid()::text
            )
        )
    );

-- ================================================
-- SWIPES TABLE POLICIES
-- ================================================

-- Users can view their own swipes
CREATE POLICY "Users can view their own swipes" ON swipes
    FOR SELECT USING (auth.uid()::text = swiper_id::text);

-- Users can create their own swipes
CREATE POLICY "Users can create their own swipes" ON swipes
    FOR INSERT WITH CHECK (auth.uid()::text = swiper_id::text);

-- Users can update their own swipes
CREATE POLICY "Users can update their own swipes" ON swipes
    FOR UPDATE USING (auth.uid()::text = swiper_id::text);


CREATE POLICY "Users can view their own subscription" ON premium_subscriptions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own subscription" ON premium_subscriptions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own subscription" ON premium_subscriptions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all subscriptions" ON premium_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND is_admin = true
        )
    );

CREATE POLICY "Admins can update any subscription" ON premium_subscriptions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND is_admin = true
        )
    );

-- ================================================
-- PREMIUM-ONLY FEATURE POLICIES
-- ================================================

-- Example: Only premium users can access premium_subscriptions table
CREATE POLICY "Only premium users can access premium features" ON premium_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND is_premium = true
        )
    );
-- ================================================
-- FUNCTION TO SET CURRENT USER
-- ================================================

-- Create a function to simulate authentication for development
-- This allows the app to work without real Supabase Auth
CREATE OR REPLACE FUNCTION set_current_user(user_id_param INTEGER)
RETURNS void AS $$
BEGIN
    -- Set a custom setting that we can use in policies
    PERFORM set_config('app.current_user_id', user_id_param::text, true);
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- ALTERNATIVE POLICIES FOR DEVELOPMENT (if auth issues persist)
-- ================================================

-- If the auth.uid() approach doesn't work, we can use these simpler policies
-- Uncomment these if you're having auth issues:

/*
-- Simple policies that allow access based on app.current_user_id setting

DROP POLICY IF EXISTS "Users can view all profiles" ON users;
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (
        current_setting('app.current_user_id', true)::integer = id OR
        true -- Allow all updates for development
    );

-- Apply similar pattern to other tables...
*/

-- ================================================
-- GRANT PERMISSIONS
-- ================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
