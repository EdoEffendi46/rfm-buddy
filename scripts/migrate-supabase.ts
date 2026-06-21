/**
 * Apply SQL migrations via direct Postgres connection.
 * Run: bun run db:migrate
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type postgres from "postgres";
import { loadEnvFile } from "./load-env";
import { createPostgresClient } from "./supabase-postgres";

export async function runMigrate(options?: {
  sql?: postgres.Sql;
  env?: Record<string, string>;
  quiet?: boolean;
}) {
  const env = options?.env ?? loadEnvFile();
  const log = options?.quiet ? () => {} : console.log.bind(console);
  const ownClient = !options?.sql;
  const sql = options?.sql ?? createPostgresClient(env);

  const migrationsDir = resolve(process.cwd(), "supabase/migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  log("=== ChatCRM db:migrate ===\n");
  log(`Found ${files.length} migration file(s)\n`);

  try {
    await sql.unsafe(`
      create schema if not exists supabase_migrations;
      create table if not exists supabase_migrations.schema_migrations (
        version text primary key,
        statements text[],
        name text,
        applied_at timestamptz not null default now()
      );
    `);

    const applied = new Set(
      (
        await sql<{ version: string }[]>`select version from supabase_migrations.schema_migrations`
      ).map((r) => r.version),
    );

    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      if (applied.has(version)) {
        log(`  ⏭ ${file} (already applied)`);
        continue;
      }

      const body = readFileSync(resolve(migrationsDir, file), "utf8");
      log(`  ▶ Applying ${file}…`);

      await sql.unsafe(body);

      await sql`
        insert into supabase_migrations.schema_migrations (version, name)
        values (${version}, ${file})
      `;

      log(`  ✓ ${file}`);
    }

    log("\n✓ Migrate complete");
  } catch (err) {
    console.error("\n❌ Migrate failed:", err instanceof Error ? err.message : err);
    console.error("\nTip: use Transaction pooler URI (port 6543) in SUPABASE_POOLER_URL");
    throw err;
  } finally {
    if (ownClient) await sql.end();
  }
}

if (import.meta.main) {
  runMigrate().catch(() => process.exit(1));
}
