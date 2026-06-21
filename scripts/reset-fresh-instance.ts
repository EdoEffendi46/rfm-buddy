/**
 * Reset Supabase to fresh deploy state (no demo data, /setup wizard).
 * Run: bun run db:reset-fresh
 *
 * Requires --yes (safety). Does NOT drop schema — only wipes data + auth users.
 */
import { createClient } from "@supabase/supabase-js";
import { seedAppSnapshot } from "../src/lib/supabase/repository";
import { loadEnvFile } from "./load-env";

const env = loadEnvFile();
const url = env.VITE_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY;

if (!process.argv.includes("--yes")) {
  console.error("❌ Destructive reset. Re-run with: bun run db:reset-fresh -- --yes");
  process.exit(1);
}

if (!url || !secret?.startsWith("sb_secret_")) {
  console.error("❌ Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const client = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("=== ChatCRM reset → fresh instance (setup wizard) ===\n");

async function deleteAllAuthUsers() {
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
  console.log(`  ✓ Auth users removed (${deleted})`);
}

await deleteAllAuthUsers();

await seedAppSnapshot(client, {
  agents: [],
  customers: [],
  messages: [],
  services: [],
  templates: [],
  tags: [],
  auditLog: [],
  exportRequests: [],
  fieldRules: [],
});

const { error: settingsErr } = await client.from("instance_settings").upsert({
  id: 1,
  business_name: "",
  setup_completed_at: null,
});

if (settingsErr) {
  if (settingsErr.code === "42P01") {
    console.error("\n❌ Tabel instance_settings belum ada. Jalankan: bun run db:migrate");
    process.exit(1);
  }
  throw settingsErr;
}

console.log("  ✓ App tables cleared");
console.log("  ✓ instance_settings reset (setup belum selesai)");

console.log("\n✓ Fresh instance ready");
console.log("  1. Restart dev server if running");
console.log("  2. Buka http://localhost:8080 (incognito / logout dulu)");
console.log("  3. Harus redirect ke /setup");
