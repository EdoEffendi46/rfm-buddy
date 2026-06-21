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

/** Load .env + .env.local for Bun scripts (.env.local wins). */
export function loadEnvFile(): Record<string, string> {
  const root = process.cwd();
  const out: Record<string, string> = {};

  const envPath = resolve(root, ".env");
  if (existsSync(envPath)) Object.assign(out, parseEnvFile(envPath));

  const localPath = resolve(root, ".env.local");
  if (existsSync(localPath)) Object.assign(out, parseEnvFile(localPath));

  // Shell / CI overrides file (e.g. APP_ENV=production)
  for (const key of Object.keys(out)) {
    const fromShell = process.env[key];
    if (fromShell !== undefined && fromShell !== "") out[key] = fromShell;
  }
  for (const key of ["APP_ENV", "NODE_ENV"] as const) {
    const fromShell = process.env[key];
    if (fromShell) out[key] = fromShell;
  }

  if (!Object.keys(out).length) {
    console.error("❌ No .env or .env.local found");
    process.exit(1);
  }

  return out;
}
