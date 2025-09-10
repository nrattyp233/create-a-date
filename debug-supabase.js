// Simple test to check Supabase connection
import { supabase } from './services/supabaseClient.js';

async function testSupabase() {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if we can connect
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
        console.log('✅ Connected to Supabase');
        console.log('Users table count:', data);
        if (error) console.log('Error:', error);
    } catch (err) {
        console.log('❌ Failed to connect:', err.message);
    }
    
    // Test 2: Try to select all users
    try {
        const { data, error } = await supabase.from('users').select('*').limit(5);
        console.log('✅ Can read users table');
        console.log('Sample users:', data);
        if (error) console.log('Error:', error);
    } catch (err) {
        console.log('❌ Cannot read users table:', err.message);
    }
}

testSupabase();
