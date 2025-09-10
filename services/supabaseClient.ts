import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://urnhaulacnhwpoclbqst.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybmhhdWxhY25od3BvY2xicXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMTgwOTQsImV4cCI6MjA3MjY5NDA5NH0.7kLPJ8ephzl_3SC-xRhSIdBC67cmr-cKC-UY399YypI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
