import type { SupabaseClient, User } from "@supabase/supabase-js";

/** URL still contains Supabase auth callback params (hash or query). */
export function hasAuthCallbackInUrl(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  const search = window.location.search;
  return (
    hash.includes("access_token") ||
    hash.includes("type=invite") ||
    hash.includes("type=recovery") ||
    hash.includes("type=signup") ||
    search.includes("code=") ||
    search.includes("token_hash=")
  );
}

export function isInviteUser(user: User | null | undefined): boolean {
  if (!user) return false;
  const meta = user.user_metadata ?? {};
  return !!(meta.agent_id || meta.invited);
}

/** Parse ?code= or ?token_hash= from Supabase email links (PKCE / OTP). */
export async function establishSessionFromUrl(client: SupabaseClient): Promise<void> {
  const search = new URLSearchParams(window.location.search);
  const code = search.get("code");
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const tokenHash = search.get("token_hash");
  const type = search.get("type");
  if (tokenHash && type) {
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "invite" | "recovery" | "signup" | "email",
    });
    if (error) throw error;
    return;
  }

  // Implicit flow (#access_token=…) — client parses on getSession()
  await client.auth.getSession();
}

/** Wait until invite/recovery session is ready (URL may clear before React renders). */
export async function waitForAuthCallbackReady(
  client: SupabaseClient,
  options: { inviteOnly?: boolean } = {},
): Promise<boolean> {
  if (hasAuthCallbackInUrl()) {
    try {
      await establishSessionFromUrl(client);
    } catch {
      /* polling below */
    }
  }

  for (let i = 0; i < 40; i++) {
    const {
      data: { session },
    } = await client.auth.getSession();

    if (session?.user) {
      if (options.inviteOnly) return isInviteUser(session.user);
      return true;
    }

    if (hasAuthCallbackInUrl()) return true;

    await new Promise((r) => setTimeout(r, 100));
  }

  return false;
}
