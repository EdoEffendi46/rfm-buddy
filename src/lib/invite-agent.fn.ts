import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { inviteActionSchema, inviteAgentSchema } from "@/lib/schemas/invite";
import { completeInviteSchema } from "@/lib/schemas/accept-invite";
import { agentToRow } from "@/lib/supabase/mappers";
import type { Role } from "@/types";

const RESEND_COOLDOWN_MS = 60_000;

function genAgentId() {
  return `ag-${Math.random().toString(36).slice(2, 10)}`;
}

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function assertOwner(accessToken: string) {
  const { getAgentForAccessToken } = await import("@/lib/supabase/admin.server");
  const inviter = await getAgentForAccessToken(accessToken);
  if (!inviter || inviter.role !== "owner") {
    throw new Error("Hanya owner yang dapat mengelola undangan");
  }
  return inviter;
}

async function findAuthUserIdByEmail(admin: SupabaseClient, email: string) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 100) break;
    page++;
  }
  return null;
}

async function deleteAuthUserIfExists(admin: SupabaseClient, authUserId: string | null, email: string) {
  const userId = authUserId ?? (await findAuthUserIdByEmail(admin, email));
  if (!userId) return;
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
}

async function sendInviteEmail(
  admin: SupabaseClient,
  opts: {
    email: string;
    agentId: string;
    name: string;
    role: string;
    color: string;
    appOrigin: string;
  },
) {
  const redirectTo = `${opts.appOrigin.replace(/\/$/, "")}/accept-invite`;
  const { error } = await admin.auth.admin.inviteUserByEmail(opts.email, {
    redirectTo,
    data: {
      agent_id: opts.agentId,
      name: opts.name.trim(),
      role: opts.role,
      color: opts.color,
      invited: true,
    },
  });
  if (error) throw error;
}

function assertResendAllowed(sentAt: string | null) {
  if (!sentAt) return;
  const elapsed = Date.now() - new Date(sentAt).getTime();
  if (elapsed < RESEND_COOLDOWN_MS) {
    const secondsLeft = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
    throw new Error(`Tunggu ${secondsLeft} detik sebelum kirim ulang`);
  }
}

export const inviteAgentServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inviteAgentSchema.parse(data))
  .handler(async ({ data }) => {
    await assertOwner(data.accessToken);
    const { getSupabaseAdminClient } = await import("@/lib/supabase/admin.server");
    const admin = getSupabaseAdminClient();
    const email = data.email.toLowerCase();
    const sentAt = new Date().toISOString();

    const { data: existingEmail } = await admin.from("agents").select("id").eq("email", email).maybeSingle();
    if (existingEmail) {
      throw new Error("Email sudah terdaftar di workspace ini");
    }

    const agentId = genAgentId();
    const agentRow = agentToRow({
      id: agentId,
      name: data.name.trim(),
      role: data.role as Role,
      initials: initialsFromName(data.name),
      color: data.color,
      isOnline: false,
      email,
      invitationStatus: "pending",
      invitationSentAt: sentAt,
    });

    const { error: insertErr } = await admin.from("agents").insert(agentRow);
    if (insertErr) throw insertErr;

    try {
      // Orphan auth user (cancelled invite, failed rollback) — not removed by db:seed
      await deleteAuthUserIfExists(admin, null, email);
      await sendInviteEmail(admin, {
        email,
        agentId,
        name: data.name.trim(),
        role: data.role,
        color: data.color,
        appOrigin: data.appOrigin,
      });
    } catch (inviteErr) {
      await admin.from("agents").delete().eq("id", agentId);
      throw inviteErr;
    }

    return {
      agentId,
      email,
      name: data.name.trim(),
      role: data.role,
      invitationStatus: "pending" as const,
      invitationSentAt: sentAt,
    };
  });

export const resendInviteServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inviteActionSchema.parse(data))
  .handler(async ({ data }) => {
    await assertOwner(data.accessToken);
    const { getSupabaseAdminClient } = await import("@/lib/supabase/admin.server");
    const admin = getSupabaseAdminClient();

    const { data: agent, error } = await admin
      .from("agents")
      .select("*")
      .eq("id", data.agentId)
      .maybeSingle();
    if (error) throw error;
    if (!agent) throw new Error("Agent tidak ditemukan");
    if (agent.invitation_status !== "pending") {
      throw new Error("Undangan sudah diterima");
    }
    if (!agent.email) throw new Error("Email agent tidak valid");

    assertResendAllowed(agent.invitation_sent_at);

    await deleteAuthUserIfExists(admin, agent.auth_user_id, agent.email);

    await admin.from("agents").update({ auth_user_id: null }).eq("id", agent.id);

    await sendInviteEmail(admin, {
      email: agent.email,
      agentId: agent.id,
      name: agent.name,
      role: agent.role,
      color: agent.color,
      appOrigin: data.appOrigin,
    });

    const sentAt = new Date().toISOString();
    await admin.from("agents").update({ invitation_sent_at: sentAt }).eq("id", agent.id);

    return { agentId: agent.id, invitationSentAt: sentAt };
  });

export const cancelInviteServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inviteActionSchema.parse(data))
  .handler(async ({ data }) => {
    await assertOwner(data.accessToken);
    const { getSupabaseAdminClient } = await import("@/lib/supabase/admin.server");
    const admin = getSupabaseAdminClient();

    const { data: agent, error } = await admin
      .from("agents")
      .select("*")
      .eq("id", data.agentId)
      .maybeSingle();
    if (error) throw error;
    if (!agent) throw new Error("Agent tidak ditemukan");
    if (agent.invitation_status !== "pending") {
      throw new Error("Hanya undangan yang belum diterima bisa dibatalkan");
    }
    if (agent.role === "owner") {
      throw new Error("Tidak dapat membatalkan undangan owner");
    }

    if (agent.email) {
      await deleteAuthUserIfExists(admin, agent.auth_user_id, agent.email);
    }

    const { error: delErr } = await admin.from("agents").delete().eq("id", agent.id);
    if (delErr) throw delErr;

    return { agentId: agent.id };
  });

export const completeInviteServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => completeInviteSchema.parse(data))
  .handler(async ({ data }) => {
    const { getSupabaseAdminClient } = await import("@/lib/supabase/admin.server");
    const { createClient } = await import("@supabase/supabase-js");

    const admin = getSupabaseAdminClient();
    const url = process.env.VITE_SUPABASE_URL;
    const publishable = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishable) throw new Error("Supabase env tidak lengkap");

    const client = createClient(url, publishable, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userErr } = await client.auth.getUser();
    if (userErr || !userData.user) throw new Error("Sesi undangan tidak valid");

    const { data: agent, error: agentErr } = await admin
      .from("agents")
      .select("*")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();
    if (agentErr) throw agentErr;
    if (!agent) throw new Error("Profil agent tidak ditemukan");

    const name = data.name.trim();
    const initials = initialsFromName(name);

    const { error: updateErr } = await admin
      .from("agents")
      .update({
        name,
        initials,
        invitation_status: "active",
      })
      .eq("id", agent.id);
    if (updateErr) throw updateErr;

    await admin.auth.admin.updateUserById(userData.user.id, {
      user_metadata: {
        ...userData.user.user_metadata,
        name,
        agent_id: agent.id,
      },
    });

    return { agentId: agent.id, name };
  });
