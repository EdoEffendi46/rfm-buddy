import { useEffect, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";

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
    } else if (supervisorOnly && role !== "supervisor") {
      router.navigate({ to: "/home" });
    }
  }, [agent, role, supervisorOnly, router]);

  if (!agent) return null;

  return (
    <div className="flex h-screen w-full bg-[#F0F2F5]">
      <Sidebar />
      <main className={noPadding ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto"}>
        {children}
      </main>
    </div>
  );
}