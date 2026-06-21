import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_ACCOUNTS } from "../src/lib/auth/demo-accounts";

/** Remove every auth.users row — only for db:reset-fresh. */
export async function deleteAllAuthUsers(client: SupabaseClient): Promise<number> {
  let page = 1;
  let deleted = 0;
  while (page <= 50) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    if (!data.users.length) break;
    for (const u of data.users) {
      const { error: delErr } = await client.auth.admin.deleteUser(u.id);
      if (delErr) console.warn(`  ⚠ delete user ${u.email}: ${delErr.message}`);
      else deleted++;
    }
    if (data.users.length < 100) break;
    page++;
  }
  return deleted;
}

async function findUserByEmail(client: SupabaseClient, email: string) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 100) break;
    page++;
  }
  return null;
}

/** Create or link demo auth accounts — does not delete existing auth users. */
export async function seedDemoAuthUsers(client: SupabaseClient): Promise<void> {
  const { error: schemaErr } = await client.from("agents").select("auth_user_id").limit(1);
  if (schemaErr?.code === "42703") {
    throw new Error("Kolom auth_user_id belum ada. Jalankan: bun run db:migrate");
  }

  for (const demo of DEMO_ACCOUNTS) {
    const { data: agentRow, error: agentErr } = await client
      .from("agents")
      .select("id, auth_user_id")
      .eq("id", demo.agentId)
      .maybeSingle();

    if (agentErr) {
      console.warn(`  ⚠ ${demo.agentId}: ${agentErr.message}`);
      continue;
    }

    if (!agentRow) {
      console.warn(`  ⚠ Agent ${demo.agentId} not found — seed demo agents first`);
      continue;
    }

    if (agentRow.auth_user_id) {
      console.log(`  ✓ ${demo.email} already linked (${demo.agentId})`);
      continue;
    }

    let userId: string | undefined;

    const { data: created, error: createErr } = await client.auth.admin.createUser({
      email: demo.email,
      password: demo.password,
      email_confirm: true,
      user_metadata: { agent_id: demo.agentId, name: demo.name },
    });

    if (createErr) {
      if (createErr.message.toLowerCase().includes("already")) {
        const existing = await findUserByEmail(client, demo.email);
        if (!existing) {
          console.warn(`  ⚠ ${demo.email}: ${createErr.message}`);
          continue;
        }
        userId = existing.id;
        await client.auth.admin.updateUserById(existing.id, {
          password: demo.password,
          user_metadata: { agent_id: demo.agentId, name: demo.name },
        });
      } else {
        console.warn(`  ⚠ ${demo.email}: ${createErr.message}`);
        continue;
      }
    } else {
      userId = created.user?.id;
    }

    if (!userId) continue;

    const { error: linkErr } = await client
      .from("agents")
      .update({
        email: demo.email,
        auth_user_id: userId,
        invitation_status: "active",
      })
      .eq("id", demo.agentId);

    if (linkErr) {
      console.warn(`  ⚠ Link ${demo.email}: ${linkErr.message}`);
    } else {
      console.log(`  ✓ ${demo.email} → ${demo.agentId} (${demo.role})`);
    }
  }

  console.log(`  Password demo: ${DEMO_ACCOUNTS[0].password}`);
}
