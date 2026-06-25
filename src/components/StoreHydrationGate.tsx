import type { ReactNode } from "react";
import { useStore } from "@/lib/store";

/** Blocks app until Supabase snapshot is loaded (when configured). */
export function StoreHydrationGate({ children }: { children: ReactNode }) {
  const { isLoading, usesSupabase } = useStore();
  if (!usesSupabase || !isLoading) return children;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#16A34A] border-t-transparent" />
        <p className="text-sm text-slate-600">Memuat data dari Supabase…</p>
      </div>
    </div>
  );
}
