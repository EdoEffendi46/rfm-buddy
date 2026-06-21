import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENTS } from "../src/data/agents";
import { CUSTOMERS } from "../src/data/customers";
import { INITIAL_MESSAGES } from "../src/data/conversations";
import { DEFAULT_TAGS, DEFAULT_TEMPLATES, SERVICES } from "../src/data/services";
import { INITIAL_AUDIT_LOG } from "../src/data/auditLog";
import { INITIAL_EXPORT_REQUESTS } from "../src/data/exportRequests";
import { DEFAULT_FIELD_RULES } from "../src/lib/fieldVisibility";
import { seedAppSnapshot } from "../src/lib/supabase/repository";
import { seedDemoAuthUsers } from "./supabase-auth-admin";

/** Default catalogs — no users/customers. Ready for /setup wizard. */
export async function runBaseSeed(client: SupabaseClient) {
  await seedAppSnapshot(client, {
    agents: [],
    customers: [],
    messages: [],
    services: SERVICES,
    templates: DEFAULT_TEMPLATES,
    tags: DEFAULT_TAGS,
    auditLog: [],
    exportRequests: [],
    fieldRules: DEFAULT_FIELD_RULES,
  });

  const { error } = await client.from("instance_settings").upsert({
    id: 1,
    business_name: "",
    setup_completed_at: null,
  });

  if (error && error.code !== "42P01") {
    throw new Error(`instance_settings: ${error.message}`);
  }

  console.log("  ✓ Base seed — services, templates, tags, field rules");
  console.log("  ✓ instance_settings → /setup wizard");
}

/** Demo agents, customers, inbox + login accounts. */
export async function runDemoSeed(client: SupabaseClient) {
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

  const { error } = await client.from("instance_settings").upsert({
    id: 1,
    business_name: "ChatCRM Demo",
    setup_completed_at: new Date().toISOString(),
  });

  if (error && error.code !== "42P01") {
    throw new Error(`instance_settings: ${error.message}`);
  }

  const { count } = await client.from("customers").select("*", { count: "exact", head: true });
  console.log(`  ✓ Demo data — ${count ?? 0} customers`);

  console.log("\n--- Demo auth ---");
  await seedDemoAuthUsers(client);
  console.log("\n  Login: hartono@chatcrm.demo / Demo1234!");
}
