/**
 * db:seed — upsert only, non-destructive.
 *
 *   bun db:seed
 *   bun db:seed --demo
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvFile } from "./load-env";
import { runBaseSeed, runDemoSeed } from "./seed-run";

export type SeedOptions = { withDemo?: boolean };

export async function runSeed(options: SeedOptions = {}) {
  const withDemo = options.withDemo ?? false;
  const env = loadEnvFile();
  const url = env.VITE_SUPABASE_URL;
  const secret = env.SUPABASE_SECRET_KEY;

  if (!url || !secret?.startsWith("sb_secret_")) {
    throw new Error("Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in .env");
  }

  const client = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`=== ChatCRM db:seed${withDemo ? " --demo" : ""} ===\n`);

  if (withDemo) {
    await runDemoSeed(client);
  } else {
    await runBaseSeed(client);
  }

  console.log("\n✓ Seed complete (upsert — tidak menghapus data lama)");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log("Usage: bun db:seed [--demo]");
    process.exit(0);
  }
  runSeed({ withDemo: argv.includes("--demo") }).catch((err) => {
    console.error("\n❌ Seed failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
