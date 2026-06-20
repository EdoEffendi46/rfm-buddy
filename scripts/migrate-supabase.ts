/**
 * Apply SQL migrations via direct Postgres connection.
 * Run: bun run db:migrate
 *
 * Requires SUPABASE_POOLER_URL in .env (Dashboard → Connect → Transaction pooler → URI).
 * Direct db.*.supabase.co often fails on IPv6-only networks.
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import { loadEnvFile } from "./load-env";

const env = loadEnvFile();
const dbUrl = env.SUPABASE_POOLER_URL || env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ Set SUPABASE_POOLER_URL (or DATABASE_URL) in .env");
  console.error("   Copy from Supabase Dashboard → Connect → Transaction pooler");
  process.exit(1);
}

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

console.log("=== ChatCRM migrate ===\n");
console.log(`Found ${files.length} migration file(s)\n`);

const sql = postgres(dbUrl, { max: 1, connect_timeout: 15 });

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
    (await sql<{ version: string }[]>`select version from supabase_migrations.schema_migrations`).map(
      (r) => r.version,
    ),
  );

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (applied.has(version)) {
      console.log(`  ⏭ ${file} (already applied)`);
      continue;
    }

    const body = readFileSync(resolve(migrationsDir, file), "utf8");
    console.log(`  ▶ Applying ${file}…`);

    await sql.unsafe(body);

    await sql`
      insert into supabase_migrations.schema_migrations (version, name)
      values (${version}, ${file})
    `;

    console.log(`  ✓ ${file}`);
  }

  console.log("\n✓ Migrate complete");
} catch (err) {
  console.error("\n❌ Migrate failed:", err instanceof Error ? err.message : err);
  console.error("\nTip: use Transaction pooler URI (port 6543) in SUPABASE_POOLER_URL");
  process.exit(1);
} finally {
  await sql.end();
}
