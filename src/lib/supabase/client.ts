import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublishableKey, getSupabaseUrl, isSupabaseConfigured } from "./env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient(getSupabaseUrl()!, getPublishableKey()!);
  }
  return browserClient;
}
