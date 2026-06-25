import { useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { getInstanceSetupStatusServerFn } from "@/lib/instance-setup.fn";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const SETUP_PATH = "/setup";

/** Auth email links must not be redirected to /setup (hash/query would be lost). */
const AUTH_CALLBACK_PATHS = ["/accept-invite", "/reset-password", "/forgot-password"];

export function InstanceSetupGate({ children }: { children: ReactNode }) {
  const usesAuth = isSupabaseConfigured();
  const { isAuthLoading } = useAuthContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [checking, setChecking] = useState(usesAuth);
  const [isComplete, setIsComplete] = useState(true);

  useEffect(() => {
    if (!usesAuth) {
      setChecking(false);
      return;
    }

    let mounted = true;
    getInstanceSetupStatusServerFn()
      .then((status) => {
        if (mounted) setIsComplete(status.isComplete);
      })
      .catch(() => {
        if (mounted) setIsComplete(true);
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });

    return () => {
      mounted = false;
    };
  }, [usesAuth]);

  useEffect(() => {
    if (!usesAuth || checking || isAuthLoading) return;

    if (!isComplete && pathname !== SETUP_PATH && !AUTH_CALLBACK_PATHS.includes(pathname)) {
      router.navigate({ to: SETUP_PATH, replace: true });
      return;
    }

    if (isComplete && pathname === SETUP_PATH) {
      router.navigate({ to: "/", replace: true });
    }
  }, [usesAuth, checking, isAuthLoading, isComplete, pathname, router]);

  if (usesAuth && (checking || isAuthLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#16A34A] border-t-transparent" />
          <p className="text-sm text-slate-600">Memeriksa instance…</p>
        </div>
      </div>
    );
  }

  return children;
}
