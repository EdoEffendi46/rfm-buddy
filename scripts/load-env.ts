import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Load .env for Bun scripts (not bundled to client). */
export function loadEnvFile(): Record<string, string> {
  const path = resolve(process.cwd(), ".env");
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
