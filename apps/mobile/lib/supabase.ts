import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://qxuhlufuworhbcrmnrlu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4dWhsdWZ1d29yaGJjcm1ucmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzEyOTMsImV4cCI6MjA5NDIwNzI5M30.-9DCjwCyOChExsW7G5T4K01XxFOOwMK6Frqks_FnNNE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
