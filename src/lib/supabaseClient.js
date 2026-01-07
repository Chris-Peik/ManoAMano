import { createClient } from '@supabase/supabase-js';

// En Vite usamos import.meta.env en lugar de process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Faltan variables de entorno de Supabase. Verifica tu archivo .env");
}

// Inicializa el cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
