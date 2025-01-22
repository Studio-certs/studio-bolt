import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL||'https://ltwdzsxpbythemeogbtm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0d2R6c3hwYnl0aGVtZW9nYnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MzgyMjEsImV4cCI6MjA1MjMxNDIyMX0.7yKDzBV7PFIwnsgcahDhQEkWI9KbXUTgfeelwu_Tu_w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
