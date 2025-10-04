import { createClient } from '@supabase/supabase-js';

// Kredensial Supabase Anda telah ditambahkan di sini.
const supabaseUrl = 'https://hzfzmoddonrwdlqxdwxs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6Znptb2Rkb25yd2RscXhkd3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Njc0NTUsImV4cCI6MjA3NTE0MzQ1NX0.YxGSjqUlbbM--5k_DCEP-wJxfaDm6sD1W-KJuZt6f7I';

// Buat dan ekspor satu instance klien Supabase untuk digunakan di seluruh aplikasi.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);