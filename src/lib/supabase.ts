import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Public Supabase config. The anon key is safe to ship to the browser — every
 * write goes through SECURITY DEFINER functions that verify the player token.
 * Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in the hosting env, or paste
 * the values below.
 */
const FALLBACK_URL = "";
const FALLBACK_ANON_KEY = "";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_URL;
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || FALLBACK_ANON_KEY;

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (typeof window === "undefined" || !url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const supabaseConfigured = Boolean(url && key);
