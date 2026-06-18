import { useStore } from "@/lib/store";

export function useAuth() {
  const { currentAgent, login, logout } = useStore();
  return { agent: currentAgent, role: currentAgent?.role ?? "cs", login, logout };
}