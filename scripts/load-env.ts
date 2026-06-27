import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

/** Load env files for Bun scripts. Precedence (last wins): .env → .env.{DEPLOY_PROFILE} → .env.local → shell. */
export function loadEnvFile(): Record<string, string> {
  const root = process.cwd();
  const out: Record<string, string> = {};

  const profile = process.env.DEPLOY_PROFILE?.trim();
  const candidates = [".env"];
  if (profile) candidates.push(`.env.${profile}`);
  candidates.push(".env.local");

  for (const name of candidates) {
    const path = resolve(root, name);
    if (existsSync(path)) Object.assign(out, parseEnvFile(path));
  }

  for (const key of Object.keys(out)) {
    const fromShell = process.env[key];
    if (fromShell !== undefined && fromShell !== "") out[key] = fromShell;
  }
  for (const key of ["APP_ENV", "NODE_ENV", "DEPLOY_PROFILE"] as const) {
    const fromShell = process.env[key];
    if (fromShell) out[key] = fromShell;
  }

  if (!Object.keys(out).length) {
    const hint = profile
      ? `Copy deploy/env/${profile}.example.env → .env.${profile}`
      : "Copy .env.example → .env.local";
    console.error(`❌ No env file found. ${hint}`);
    process.exit(1);
  }

  return out;
}
