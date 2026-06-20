/**
 * Seed Supabase from src/data/*.ts — run: bun run scripts/seed-supabase.ts
 */
import { createClient } from "@supabase/supabase-js";
import { AGENTS } from "../src/data/agents";
import { CUSTOMERS } from "../src/data/customers";
import { INITIAL_MESSAGES } from "../src/data/conversations";
import { DEFAULT_TAGS, DEFAULT_TEMPLATES, SERVICES } from "../src/data/services";
import { INITIAL_AUDIT_LOG } from "../src/data/auditLog";
import { INITIAL_EXPORT_REQUESTS } from "../src/data/exportRequests";
import { DEFAULT_FIELD_RULES } from "../src/lib/fieldVisibility";
import { seedAppSnapshot } from "../src/lib/supabase/repository";
import { loadEnvFile } from "./load-env";

const env = loadEnvFile();
const url = env.VITE_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY;

if (!url || !secret?.startsWith("sb_secret_")) {
  console.error("❌ Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY (sb_secret_...) in .env");
  process.exit(1);
}

const client = createClient(url, secret);

console.log("=== ChatCRM Supabase seed ===\n");

await seedAppSnapshot(client, {
  agents: AGENTS,
  customers: CUSTOMERS.map((c) => ({
    ...c,
    purchases: c.purchases.map((p) => ({ ...p, id: `${c.id}-${p.id}` })),
  })),
  messages: INITIAL_MESSAGES,
  services: SERVICES,
  templates: DEFAULT_TEMPLATES,
  tags: DEFAULT_TAGS,
  auditLog: INITIAL_AUDIT_LOG,
  exportRequests: INITIAL_EXPORT_REQUESTS,
  fieldRules: DEFAULT_FIELD_RULES,
});

const { count } = await client.from("customers").select("*", { count: "exact", head: true });
console.log(`✓ Seed complete — ${count ?? 0} customers in database`);
