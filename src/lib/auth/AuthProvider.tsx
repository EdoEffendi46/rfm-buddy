import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  authErrorMessage,
  resolveAgentForUser,
  sendPasswordResetEmail,
  signInWithEmail,
  signOutAuth,
  updatePassword,
} from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useStore } from "@/lib/store";

interface AuthContextValue {
  isAuthLoading: boolean;
  session: Session | null;
  user: User | null;
  usesAuth: boolean;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setNewPassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const usesAuth = isSupabaseConfigured();
  const { setAgentSession, clearAgentSession, logAuthLogin } = useStore();
  const [isAuthLoading, setIsAuthLoading] = useState(usesAuth);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const bindAgent = useCallback(
    async (nextUser: User | null, auditLogin = false) => {
      if (!nextUser) {
        clearAgentSession();
        return;
      }
      const agent = await resolveAgentForUser(nextUser);
      if (!agent) {
        clearAgentSession();
        return;
      }
      if (agent.invitationStatus === "pending") {
        clearAgentSession();
        return;
      }
      setAgentSession(agent.id);
      if (auditLogin) logAuthLogin(agent);
    },
    [clearAgentSession, logAuthLogin, setAgentSession],
  );

  useEffect(() => {
    if (!usesAuth) {
      setIsAuthLoading(false);
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setIsAuthLoading(false);
      return;
    }

    let mounted = true;

    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      bindAgent(data.session?.user ?? null).finally(() => {
        if (mounted) setIsAuthLoading(false);
      });
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event: AuthChangeEvent, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      bindAgent(nextSession?.user ?? null, event === "SIGNED_IN");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [usesAuth, bindAgent]);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      if (!usesAuth) throw new Error("Autentikasi belum dikonfigurasi");
      const { session: nextSession, user: nextUser } = await signInWithEmail(
        email,
        password,
        rememberMe,
      );
      if (!nextSession || !nextUser) throw new Error("Login gagal");
      const agent = await resolveAgentForUser(nextUser);
      if (!agent) {
        await signOutAuth();
        throw new Error("Profil agent tidak ditemukan. Hubungi owner bisnis.");
      }
      if (agent.invitationStatus === "pending") {
        await signOutAuth();
        throw new Error("Undangan belum diselesaikan. Buka link di email untuk mengatur profil dan password.");
      }
      setSession(nextSession);
      setUser(nextUser);
      setAgentSession(agent.id);
    },
    [usesAuth, setAgentSession],
  );

  const signOut = useCallback(async () => {
    if (usesAuth) await signOutAuth();
    setSession(null);
    setUser(null);
    clearAgentSession();
  }, [usesAuth, clearAgentSession]);

  const resetPassword = useCallback(
    async (email: string) => {
      if (!usesAuth) throw new Error("Autentikasi belum dikonfigurasi");
      await sendPasswordResetEmail(email);
    },
    [usesAuth],
  );

  const setNewPassword = useCallback(
    async (password: string) => {
      if (!usesAuth) throw new Error("Autentikasi belum dikonfigurasi");
      await updatePassword(password);
    },
    [usesAuth],
  );

  const value = useMemo(
    () => ({
      isAuthLoading,
      session,
      user,
      usesAuth,
      signIn,
      signOut,
      resetPassword,
      setNewPassword,
    }),
    [isAuthLoading, session, user, usesAuth, signIn, signOut, resetPassword, setNewPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

export { authErrorMessage };
