/**
 * Seed Supabase Auth demo users — run: bun run db:seed-auth
 * Requires migration 002_auth.sql applied first.
 */
import { createClient } from "@supabase/supabase-js";
import { DEMO_ACCOUNTS } from "../src/lib/auth/demo-accounts";
import { loadEnvFile } from "./load-env";

const env = loadEnvFile();
const url = env.VITE_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY;

if (!url || !secret?.startsWith("sb_secret_")) {
  console.error("❌ Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY (sb_secret_...) in .env");
  process.exit(1);
}

const client = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("=== ChatCRM Auth seed ===\n");

const { error: schemaErr } = await client.from("agents").select("auth_user_id").limit(1);
if (schemaErr?.code === "42703") {
  console.error("❌ Kolom auth_user_id belum ada. Jalankan supabase/migrations/002_auth.sql di SQL Editor.");
  process.exit(1);
}

async function findUserByEmail(email: string) {
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
    console.warn(`  ⚠ Agent ${demo.agentId} not found — run db:seed first`);
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
      const existing = await findUserByEmail(demo.email);
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
    .update({ email: demo.email, auth_user_id: userId })
    .eq("id", demo.agentId);

  if (linkErr) {
    console.warn(`  ⚠ Link ${demo.email}: ${linkErr.message}`);
  } else {
    console.log(`  ✓ ${demo.email} → ${demo.agentId} (${demo.role})`);
  }
}

console.log("\n✓ Auth seed complete");
console.log(`  Password demo: ${DEMO_ACCOUNTS[0].password}`);
