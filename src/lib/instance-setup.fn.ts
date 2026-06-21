import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { completeSetupSchema } from "@/lib/schemas/setup";
import { DEFAULT_FIELD_RULES } from "@/lib/fieldVisibility";
import { DEFAULT_TAGS, DEFAULT_TEMPLATES } from "@/data/services";
import { agentToRow, fieldRuleToRow, tagToRow, templateToRow } from "@/lib/supabase/mappers";

const OWNER_COLOR = "#DC2626";

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

async function assertSetupNotComplete(admin: SupabaseClient) {
  const { data: settings, error: settingsErr } = await admin
    .from("instance_settings")
    .select("setup_completed_at")
    .eq("id", 1)
    .maybeSingle();

  if (settingsErr) {
    if (settingsErr.code === "42P01") {
      throw new Error("Migration 005 belum dijalankan. Jalankan bun run db:migrate.");
    }
    throw settingsErr;
  }

  if (settings?.setup_completed_at) {
    throw new Error("Setup sudah selesai. Silakan masuk.");
  }

  const { data: existingOwner } = await admin
    .from("agents")
    .select("id")
    .eq("role", "owner")
    .not("auth_user_id", "is", null)
    .maybeSingle();

  if (existingOwner) {
    throw new Error("Owner sudah terdaftar. Silakan masuk.");
  }
}

async function seedWorkspaceDefaults(admin: SupabaseClient) {
  const { count: templateCount } = await admin.from("templates").select("id", { count: "exact", head: true });
  if (!templateCount) {
    const { error } = await admin.from("templates").insert(DEFAULT_TEMPLATES.map(templateToRow));
    if (error) throw error;
  }

  const { count: tagCount } = await admin.from("tags").select("id", { count: "exact", head: true });
  if (!tagCount) {
    const { error } = await admin.from("tags").insert(DEFAULT_TAGS.map(tagToRow));
    if (error) throw error;
  }

  const { count: ruleCount } = await admin
    .from("field_visibility_rules")
    .select("id", { count: "exact", head: true });
  if (!ruleCount) {
    const { error } = await admin
      .from("field_visibility_rules")
      .insert(DEFAULT_FIELD_RULES.map(fieldRuleToRow));
    if (error) throw error;
  }
}

export const getInstanceSetupStatusServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getSupabaseAdminClient } = await import("@/lib/supabase/admin.server");
  const admin = getSupabaseAdminClient();

  const { data, error } = await admin
    .from("instance_settings")
    .select("business_name, setup_completed_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      const { data: owner } = await admin
        .from("agents")
        .select("id")
        .eq("role", "owner")
        .not("auth_user_id", "is", null)
        .maybeSingle();
      return {
        isComplete: !!owner,
        businessName: null as string | null,
        requiresSetupToken: !!process.env.SETUP_TOKEN,
      };
    }
    throw error;
  }

  const ownerFallback =
    !data?.setup_completed_at &&
    (await admin
      .from("agents")
      .select("id")
      .eq("role", "owner")
      .not("auth_user_id", "is", null)
      .maybeSingle()).data;

  return {
    isComplete: !!data?.setup_completed_at || !!ownerFallback,
    businessName: data?.business_name || null,
    requiresSetupToken: !!process.env.SETUP_TOKEN,
  };
});

export const completeInstanceSetupServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => completeSetupSchema.parse(data))
  .handler(async ({ data }) => {
    const { getSupabaseAdminClient } = await import("@/lib/supabase/admin.server");
    const admin = getSupabaseAdminClient();

    await assertSetupNotComplete(admin);

    const setupToken = process.env.SETUP_TOKEN;
    if (setupToken && data.setupToken !== setupToken) {
      throw new Error("Token setup tidak valid");
    }

    const email = data.email.toLowerCase();

    const { data: existingEmail } = await admin.from("agents").select("id").eq("email", email).maybeSingle();
    if (existingEmail) {
      throw new Error("Email sudah terdaftar");
    }

    const agentId = genAgentId();
    const ownerName = data.ownerName.trim();
    const businessName = data.businessName.trim();

    const agentRow = agentToRow({
      id: agentId,
      name: ownerName,
      role: "owner",
      initials: initialsFromName(ownerName),
      color: OWNER_COLOR,
      isOnline: true,
      email,
      invitationStatus: "active",
    });

    const { error: insertErr } = await admin.from("agents").insert(agentRow);
    if (insertErr) throw insertErr;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        agent_id: agentId,
        name: ownerName,
        role: "owner",
      },
    });

    if (createErr) {
      await admin.from("agents").delete().eq("id", agentId);
      throw createErr;
    }

    const userId = created.user?.id;
    if (userId) {
      const { error: linkErr } = await admin
        .from("agents")
        .update({ auth_user_id: userId, email, invitation_status: "active" })
        .eq("id", agentId);
      if (linkErr) throw linkErr;
    }

    await seedWorkspaceDefaults(admin);

    const { error: settingsErr } = await admin
      .from("instance_settings")
      .upsert({
        id: 1,
        business_name: businessName,
        setup_completed_at: new Date().toISOString(),
      });
    if (settingsErr) throw settingsErr;

    const auditId = `al-setup-${Date.now()}`;
    await admin.from("audit_log").insert({
      id: auditId,
      logged_at: new Date().toISOString(),
      actor_id: agentId,
      actor_name: ownerName,
      actor_role: "owner",
      action: "login",
      target_type: "system",
      target_id: "setup",
      target_label: businessName,
      details: "Setup awal instance selesai",
    });

    return {
      agentId,
      email,
      businessName,
      ownerName,
    };
  });
