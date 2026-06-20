/** Supabase API Keys 2026 — publishable (client) + secret (server/scripts). */

export function getSupabaseUrl(): string | undefined {
  return import.meta.env.VITE_SUPABASE_URL ?? undefined;
}

export function getPublishableKey(): string | undefined {
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? undefined;
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getPublishableKey();
  return Boolean(url && key && key.startsWith("sb_publishable_"));
}
