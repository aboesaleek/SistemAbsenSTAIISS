import { createClient } from '@supabase/supabase-js';

// Kredensial Supabase Anda telah ditambahkan di sini.
const supabaseUrl = 'https://rwiakfuzhtnjmnqxpzpl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aWFrZnV6aHRuam1ucXhwenBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDk0MjYsImV4cCI6MjA3NTEyNTQyNn0.gGH89tQtFykzt_geFx8cDihVLpGU39FtO-Xus9hEGXE';

// Buat dan ekspor satu instance klien Supabase untuk digunakan di seluruh aplikasi.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
