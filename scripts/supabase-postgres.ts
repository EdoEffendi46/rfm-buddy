import postgres from "postgres";
import { loadEnvFile } from "./load-env";

export function getPostgresUrl(env = loadEnvFile()): string {
  const dbUrl = env.SUPABASE_POOLER_URL || env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ Set SUPABASE_POOLER_URL (or DATABASE_URL) in .env");
    console.error("   Copy from Supabase Dashboard → Connect → Transaction pooler");
    process.exit(1);
  }
  return dbUrl;
}

export function createPostgresClient(env = loadEnvFile()) {
  return postgres(getPostgresUrl(env), { max: 1, connect_timeout: 15 });
}

/** Drop app schema + migration history (Laravel migrate:fresh equivalent). */
export async function dropAppSchema(sql: postgres.Sql) {
  await sql.unsafe(`
    drop schema if exists supabase_migrations cascade;
    drop schema public cascade;
    create schema public;
    grant usage on schema public to postgres, anon, authenticated, service_role;
    grant all on schema public to postgres, service_role;
    grant all on all tables in schema public to postgres, service_role;
    grant all on all sequences in schema public to postgres, service_role;
    grant all on all routines in schema public to postgres, service_role;
    alter default privileges in schema public grant all on tables to postgres, service_role;
    alter default privileges in schema public grant all on sequences to postgres, service_role;
    alter default privileges in schema public grant all on routines to postgres, service_role;
    alter default privileges in schema public
      grant select, insert, update, delete on tables to anon, authenticated;
    alter default privileges in schema public
      grant usage, select on sequences to anon, authenticated;
    create extension if not exists pgcrypto;
  `);
}

/** Supabase PostgREST roles need table grants (RLS alone is not enough). */
export async function applySupabaseApiGrants(sql: postgres.Sql) {
  await sql.unsafe(`
    grant usage on schema public to postgres, anon, authenticated, service_role;

    grant all on all tables in schema public to postgres, service_role;
    grant all on all sequences in schema public to postgres, service_role;
    grant all on all routines in schema public to postgres, service_role;

    grant select, insert, update, delete on all tables in schema public to anon, authenticated;
    grant usage, select on all sequences in schema public to anon, authenticated;

    alter default privileges in schema public grant all on tables to postgres, service_role;
    alter default privileges in schema public grant all on sequences to postgres, service_role;
    alter default privileges in schema public grant all on routines to postgres, service_role;

    alter default privileges in schema public
      grant select, insert, update, delete on tables to anon, authenticated;
    alter default privileges in schema public
      grant usage, select on sequences to anon, authenticated;
  `);
}
