/**
 * db:migrate:fresh — drop schema, re-run migrations, optional seed.
 *
 *   bun db:migrate:fresh
 *   bun db:migrate:fresh --seed
 *   bun db:migrate:fresh --seed --demo
 */
import { createClient } from "@supabase/supabase-js";
import { runMigrate } from "./migrate-supabase";
import { isProductionEnv, productionGuardMessage } from "./env-detect";
import { loadEnvFile } from "./load-env";
import { runBaseSeed, runDemoSeed } from "./seed-run";
import { createPostgresClient, dropAppSchema, applySupabaseApiGrants } from "./supabase-postgres";
import { deleteAllAuthUsers } from "./supabase-auth-admin";

export type MigrateFreshOptions = {
  withSeed?: boolean;
  withDemo?: boolean;
  force?: boolean;
};

export async function runMigrateFresh(options: MigrateFreshOptions = {}) {
  const withSeed = options.withSeed ?? false;
  const withDemo = options.withDemo ?? false;
  const force = options.force ?? false;

  const env = loadEnvFile();
  const url = env.VITE_SUPABASE_URL;
  const secret = env.SUPABASE_SECRET_KEY;
  const production = isProductionEnv(env);

  if (!url || !secret?.startsWith("sb_secret_")) {
    throw new Error("Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in .env");
  }

  if (production && withDemo) {
    console.error(productionGuardMessage("db:migrate:fresh --demo"));
    console.error("  ❌ --demo is not allowed when APP_ENV=production.");
    process.exit(1);
  }

  if (production && !force) {
    console.error(productionGuardMessage("db:migrate:fresh"));
    process.exit(1);
  }

  if (production && force) {
    console.warn(productionGuardMessage("db:migrate:fresh --force"));
    console.warn("  ▶ Continuing in 3 seconds… (Ctrl+C to abort)\n");
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log("=== ChatCRM db:migrate:fresh ===\n");
  if (production) {
    console.warn("  ⚠ Running with --force on PRODUCTION\n");
  }

  const sql = createPostgresClient(env);

  try {
    console.log("  ▶ Dropping public schema…");
    await dropAppSchema(sql);
    console.log("  ✓ Schema dropped");

    console.log("\n  ▶ Re-running migrations…\n");
    await runMigrate({ sql, env, quiet: true });

    console.log("  ▶ Applying API grants (anon / authenticated)…");
    await applySupabaseApiGrants(sql);
    console.log("  ✓ API grants restored");

    const admin = createClient(url, secret, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log("\n  ▶ Clearing auth users…");
    const removed = await deleteAllAuthUsers(admin);
    console.log(`  ✓ Auth users removed (${removed})`);

    if (withSeed) {
      console.log("\n--- Base seed ---");
      await runBaseSeed(admin);
    }

    if (withDemo) {
      console.log("\n--- Demo seed ---");
      await runDemoSeed(admin);
    }

    console.log("\n✓ db:migrate:fresh complete");
    if (withDemo) {
      console.log("  Mode: demo — login hartono@chatcrm.demo / Demo1234!");
    } else if (withSeed) {
      console.log("  Mode: seeded — buka /setup untuk buat owner");
    } else {
      console.log("  Mode: empty — buka /setup untuk buat owner");
    }
  } finally {
    await sql.end();
  }
}

function flagsFromArgv(argv: string[]): MigrateFreshOptions {
  return {
    withSeed: argv.includes("--seed") || argv.includes("--demo"),
    withDemo: argv.includes("--demo"),
    force: argv.includes("--force"),
  };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log("Usage: bun db:migrate:fresh [--seed] [--demo] [--force]");
    process.exit(0);
  }
  runMigrateFresh(flagsFromArgv(argv)).catch((err) => {
    console.error("\n❌ db:migrate:fresh failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
