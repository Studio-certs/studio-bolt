import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL||'https://alnfcdynlmiefgpulkjt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbmZjZHlubG1pZWZncHVsa2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NDY3MDMsImV4cCI6MjA1MzEyMjcwM30.ygpmbXWHEuZk0JvSQPrgX296HJn_jhGNodf175iG9D4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
