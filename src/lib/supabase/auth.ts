import type { User } from "@supabase/supabase-js";
import { setRememberMe } from "@/lib/auth/storage";
import { getSupabaseBrowserClient, resetSupabaseBrowserClient } from "./client";
import { fetchAgentByAuthUserId } from "./repository";
import type { Agent } from "@/types";

export function authErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login credentials")) {
      return "Email atau password salah.";
    }
    if (msg.includes("email not confirmed")) {
      return "Email belum diverifikasi. Cek inbox Anda.";
    }
    if (msg.includes("user already registered")) {
      return "Email sudah terdaftar. Silakan masuk.";
    }
    return error.message;
  }
  return "Terjadi kesalahan. Coba lagi.";
}

export async function resolveAgentForUser(user: User): Promise<Agent | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  let agent = await fetchAgentByAuthUserId(client, user.id);
  if (agent) return agent;

  // Trigger may still be running — brief retry for new registrations
  await new Promise((r) => setTimeout(r, 400));
  agent = await fetchAgentByAuthUserId(client, user.id);
  return agent;
}

export async function signInWithEmail(
  email: string,
  password: string,
  rememberMe: boolean,
) {
  setRememberMe(rememberMe);
  resetSupabaseBrowserClient();
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase belum dikonfigurasi");

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOutAuth() {
  const client = getSupabaseBrowserClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function sendPasswordResetEmail(email: string) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase belum dikonfigurasi");

  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;

  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase belum dikonfigurasi");

  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export function isPasswordSetupSession(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  return (
    hash.includes("type=recovery") ||
    hash.includes("type=invite") ||
    hash.includes("type=signup")
  );
}
