/**
 * Connectivity check — run: bun run scripts/test-supabase-connection.ts
 * Uses Supabase API Keys 2026: publishable (client) + secret (server).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(): Record<string, string> {
  const path = resolve(process.cwd(), ".env");
  const out: Record<string, string> = {};
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  } catch {
    console.error("❌ .env not found");
    process.exit(1);
  }
  return out;
}

function maskKey(key: string): string {
  if (key.length < 16) return "…";
  return `${key.slice(0, 14)}…${key.slice(-4)}`;
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return value.includes("paste_here") || value.includes("YOUR_") || value.includes("...");
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const secretKey = env.SUPABASE_SECRET_KEY;

console.log("=== Supabase connection test (API Keys 2026) ===\n");

if (!url) {
  console.error("❌ VITE_SUPABASE_URL missing in .env");
  process.exit(1);
}
console.log(`✓ URL set (${url.replace(/https:\/\/([^.]+).*/, "https://$1.***.supabase.co")})`);

if (isPlaceholder(publishableKey) || !publishableKey?.startsWith("sb_publishable_")) {
  console.error("❌ VITE_SUPABASE_PUBLISHABLE_KEY must be sb_publishable_... from Settings → API Keys");
  process.exit(1);
}
console.log(`✓ Publishable key set (${maskKey(publishableKey)})`);

const hasSecret = !isPlaceholder(secretKey) && secretKey!.startsWith("sb_secret_");
if (!hasSecret) {
  console.warn("⚠ SUPABASE_SECRET_KEY not set — paste sb_secret_... from Settings → API Keys → Secret keys");
}

const client = createClient(url, publishableKey);

async function probeTable(table: string) {
  const { error, data } = await client.from(table).select("id").limit(1);
  if (error) {
    if (
      error.code === "PGRST116" ||
      error.code === "PGRST205" ||
      error.message.includes("does not exist") ||
      error.message.includes("schema cache")
    ) {
      return { table, status: "missing" as const };
    }
    return { table, status: "error" as const, detail: `${error.code ?? "?"}: ${error.message}` };
  }
  return { table, status: "ok" as const, rows: data?.length ?? 0 };
}

async function main() {
  const { error: probeErr } = await client.from("_probe").select("*").limit(1);
  if (probeErr?.message.includes("Invalid API key") || probeErr?.status === 401) {
    console.error("\n❌ Publishable key rejected — check Settings → API Keys");
    process.exit(1);
  }
  console.log("\n✓ REST API reachable (publishable key accepted)");

  if (hasSecret) {
    const admin = createClient(url, secretKey!);
    const { error: adminErr } = await admin.from("agents").select("id").limit(1);
    if (adminErr?.message.includes("Invalid API key")) {
      console.error("❌ Secret key rejected — check SUPABASE_SECRET_KEY");
      process.exit(1);
    }
    if (!adminErr || adminErr.code === "PGRST205" || adminErr.message.includes("schema cache")) {
      console.log(`✓ Secret key accepted (${maskKey(secretKey!)})`);
    } else if (adminErr) {
      console.warn(`⚠ Secret key probe: ${adminErr.message}`);
    }
  }

  const tables = ["agents", "customers", "messages", "services", "templates", "tags", "audit_log"];
  console.log("\n--- Tables ---");
  let anyOk = false;
  for (const t of tables) {
    const r = await probeTable(t);
    if (r.status === "ok") {
      console.log(`✓ ${t} — exists`);
      anyOk = true;
    } else if (r.status === "missing") {
      console.log(`○ ${t} — belum ada (run supabase/migrations/001_initial_schema.sql)`);
    } else {
      console.log(`✗ ${t} — ${r.detail}`);
    }
  }

  console.log("\n--- Summary ---");
  if (!anyOk) {
    console.log("Koneksi OK. Schema belum di-run di Supabase SQL Editor.");
    process.exit(0);
  }
  console.log("Koneksi + schema OK.");
}

main().catch((e) => {
  console.error("\n❌ Unexpected error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
