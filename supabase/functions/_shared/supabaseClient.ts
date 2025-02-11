import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('VITE_SUPABASE_ANON_KEY') || '';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
