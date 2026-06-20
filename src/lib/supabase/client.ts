import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { authStorage } from "@/lib/auth/storage";
import { getPublishableKey, getSupabaseUrl, isSupabaseConfigured } from "./env";

let browserClient: SupabaseClient | null = null;

export function resetSupabaseBrowserClient() {
  browserClient = null;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient(getSupabaseUrl()!, getPublishableKey()!, {
      auth: {
        storage: authStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
