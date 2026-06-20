import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/** Server-only Supabase client (service role). Never import from client routes/components. */
export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret?.startsWith("sb_secret_")) {
    throw new Error("SUPABASE_SECRET_KEY belum dikonfigurasi di server");
  }
  if (!adminClient) {
    adminClient = createClient(url, secret, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

export async function getAgentForAccessToken(accessToken: string) {
  const url = process.env.VITE_SUPABASE_URL;
  const publishable = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishable) throw new Error("Supabase env tidak lengkap");

  const client = createClient(url, publishable, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData.user) throw new Error("Sesi tidak valid");

  const admin = getSupabaseAdminClient();
  const { data: agent, error: agentErr } = await admin
    .from("agents")
    .select("*")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (agentErr) throw agentErr;
  return agent;
}
