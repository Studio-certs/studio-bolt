import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ydvvokjdlqpgpasrnwtd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkdnZva2pkbHFwZ3Bhc3Jud3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3NDQ1MDYsImV4cCI6MjA1NDMyMDUwNn0._UqHW22Xo6PaOXNaS5aN3MdS091Qjz25f5mTgWbqjq0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
