import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Sans configuration, le jeu fonctionne en mode invité uniquement.
export const supabase = url && anonKey
  ? createClient(url, anonKey, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } })
  : null;

// Adresse de retour des liens de connexion (tient compte du sous-chemin GitHub Pages).
export const appUrl = () => new URL(import.meta.env.BASE_URL, window.location.origin).toString();
