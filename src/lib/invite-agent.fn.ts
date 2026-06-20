import { createServerFn } from "@tanstack/react-start";
import { inviteAgentSchema } from "@/lib/schemas/invite";
import { agentToRow } from "@/lib/supabase/mappers";
import type { Role } from "@/types";

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

export const inviteAgentServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inviteAgentSchema.parse(data))
  .handler(async ({ data }) => {
    const { getAgentForAccessToken, getSupabaseAdminClient } = await import(
      "@/lib/supabase/admin.server"
    );

    const inviter = await getAgentForAccessToken(data.accessToken);
    if (!inviter || inviter.role !== "owner") {
      throw new Error("Hanya owner yang dapat mengundang anggota tim");
    }

    const admin = getSupabaseAdminClient();

    const { data: existingEmail } = await admin
      .from("agents")
      .select("id")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();

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
      email: data.email.toLowerCase(),
      invitationStatus: "pending",
    });

    const { error: insertErr } = await admin.from("agents").insert(agentRow);
    if (insertErr) throw insertErr;

    const redirectTo = `${data.appOrigin.replace(/\/$/, "")}/accept-invite`;

    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo,
      data: {
        agent_id: agentId,
        name: data.name.trim(),
        role: data.role,
        color: data.color,
        invited: true,
      },
    });

    if (inviteErr) {
      await admin.from("agents").delete().eq("id", agentId);
      throw inviteErr;
    }

    return {
      agentId,
      email: data.email.toLowerCase(),
      name: data.name.trim(),
      role: data.role,
      invitationStatus: "pending" as const,
    };
  });
