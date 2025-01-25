import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bqdzcideuypyikneuudz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZHpjaWRldXlweWlrbmV1dWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzNzk1NzMsImV4cCI6MjA0OTk1NTU3M30.lpOoGa58cksBkq7_ylR1pzYMUgQe6rfkWIGAAHwVeXw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey)