import type { ReactNode } from "react";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { useStore } from "@/lib/store";

/** Blocks app until Supabase auth session is resolved (when configured). */
export function AuthHydrationGate({ children }: { children: ReactNode }) {
  const { isAuthLoading, usesAuth } = useAuthContext();
  const { isLoading: isStoreLoading, usesSupabase } = useStore();

  if (usesAuth && isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#25D366] border-t-transparent" />
          <p className="text-sm text-slate-600">Memeriksa sesi…</p>
        </div>
      </div>
    );
  }

  if (usesSupabase && isStoreLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#25D366] border-t-transparent" />
          <p className="text-sm text-slate-600">Memuat data dari Supabase…</p>
        </div>
      </div>
    );
  }

  return children;
}
