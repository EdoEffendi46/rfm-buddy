import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import {
  hasAuthCallbackInUrl,
  isInviteUser,
  waitForAuthCallbackReady,
} from "@/lib/supabase/auth-callback";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useAuthCallbackReady(options?: { inviteOnly?: boolean }) {
  const { isAuthLoading, user } = useAuthContext();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(() => hasAuthCallbackInUrl());

  useEffect(() => {
    if (user && (!options?.inviteOnly || isInviteUser(user))) {
      setReady(true);
      setChecking(false);
    }
  }, [user, options?.inviteOnly]);

  useEffect(() => {
    if (isAuthLoading) return;

    let cancelled = false;
    (async () => {
      const client = getSupabaseBrowserClient();
      if (!client) {
        if (!cancelled) setChecking(false);
        return;
      }

      const ok = await waitForAuthCallbackReady(client, options);
      if (!cancelled) {
        setReady((prev) => prev || ok);
        setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, options?.inviteOnly]);

  return {
    ready,
    checking: isAuthLoading || checking,
  };
}
