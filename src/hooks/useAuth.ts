import { useStore } from "@/lib/store";
import { useAuthContext } from "@/lib/auth/AuthProvider";

export function useAuth() {
  const { currentAgent, login } = useStore();
  const { signOut, isAuthLoading, usesAuth } = useAuthContext();

  return {
    agent: currentAgent,
    role: currentAgent?.role ?? "cs",
    isAuthLoading,
    usesAuth,
    login,
    logout: signOut,
  };
}
