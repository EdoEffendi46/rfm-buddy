/** @deprecated Use `bun db:seed --demo` */
import { createClient } from "@supabase/supabase-js";
import { loadEnvFile } from "./load-env";
import { seedDemoAuthUsers } from "./supabase-auth-admin";

const env = loadEnvFile();
const url = env.VITE_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY;

if (!url || !secret?.startsWith("sb_secret_")) {
  console.error("❌ Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in .env");
  process.exit(1);
}

const client = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("=== ChatCRM seed (demo auth only) ===\n");
await seedDemoAuthUsers(client);
console.log("\n✓ Done");
