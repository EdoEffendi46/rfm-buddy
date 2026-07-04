import { useEffect, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { isTeamView } from "@/lib/permissions";
import { BranchSwitcher } from "./BranchSwitcher";

export function AppShell({
  children,
  supervisorOnly,
  noPadding,
}: {
  children: ReactNode;
  supervisorOnly?: boolean;
  noPadding?: boolean;
}) {
  const { agent, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!agent) {
      router.navigate({ to: "/" });
    } else if (supervisorOnly && !isTeamView(role)) {
      router.navigate({ to: "/dashboard" });
    }
  }, [agent, role, supervisorOnly, router]);

  if (!agent) return null;

  return (
    <div className="flex h-screen w-full bg-[var(--app-bg)]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-11 shrink-0 items-center justify-end gap-2 border-b border-slate-200 bg-white px-4">
          <BranchSwitcher />
        </div>
        <main
          key={router.state.location.pathname}
          className={
            (noPadding ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto") + " animate-page-in"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
