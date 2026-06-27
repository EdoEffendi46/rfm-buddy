/**
 * Pre-deploy env check.
 *
 *   bun run deploy:check              # uses .env.local (dev)
 *   bun run deploy:check:staging      # .env.staging
 *   bun run deploy:check:client       # .env.client
 */
import { loadEnvFile } from "./load-env";

type Profile = "local" | "staging" | "client";

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return (
    value.includes("YOUR_") ||
    value.includes("paste_here") ||
    value.includes("CLIENT_REF") ||
    value.includes("your_staging") ||
    value.includes("...")
  );
}

function req(label: string, value: string | undefined, errors: string[]) {
  if (isPlaceholder(value)) errors.push(`${label} belum diisi`);
}

function warn(label: string, value: string | undefined, warnings: string[]) {
  if (isPlaceholder(value)) warnings.push(`${label} belum diisi (opsional)`);
}

function parseProfile(): Profile {
  const arg = process.argv.find((a) => a === "--staging" || a === "--client");
  if (arg === "--staging") return "staging";
  if (arg === "--client") return "client";
  const fromEnv = process.env.DEPLOY_PROFILE;
  if (fromEnv === "staging" || fromEnv === "client") return fromEnv;
  return "local";
}

const profile = parseProfile();
if (profile !== "local") {
  process.env.DEPLOY_PROFILE = profile;
}

const env = loadEnvFile();
const errors: string[] = [];
const warnings: string[] = [];

req("VITE_SUPABASE_URL", env.VITE_SUPABASE_URL, errors);
req("VITE_SUPABASE_PUBLISHABLE_KEY", env.VITE_SUPABASE_PUBLISHABLE_KEY, errors);
req("SUPABASE_SECRET_KEY", env.SUPABASE_SECRET_KEY, errors);
req("VITE_APP_URL", env.VITE_APP_URL, errors);

if (env.VITE_APP_URL?.includes("localhost") && profile !== "local") {
  warnings.push("VITE_APP_URL masih localhost - ganti dengan URL Vercel/domain deploy");
}

if (profile === "client" && isPlaceholder(env.SETUP_TOKEN)) {
  warnings.push("SETUP_TOKEN kosong - disarankan untuk deploy client production");
}

warn("WHATSAPP_PHONE_NUMBER_ID", env.WHATSAPP_PHONE_NUMBER_ID, warnings);
warn("WHATSAPP_ACCESS_TOKEN", env.WHATSAPP_ACCESS_TOKEN, warnings);
warn("WHATSAPP_VERIFY_TOKEN", env.WHATSAPP_VERIFY_TOKEN, warnings);

const appUrl = env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
const webhookUrl = appUrl ? `${appUrl}/api/webhooks/whatsapp` : "";

console.log(`\n=== Deploy check (${profile}) ===\n`);

if (errors.length) {
  for (const e of errors) console.error(`❌ ${e}`);
} else {
  console.log("✓ Env wajib OK");
}

for (const w of warnings) console.warn(`⚠ ${w}`);

if (appUrl) {
  console.log(`\nApp URL: ${appUrl}`);
  console.log(`Webhook WA: ${webhookUrl}`);
}

console.log("\n--- Supabase Auth redirects (paste di Dashboard) ---");
if (appUrl) {
  console.log(`Site URL: ${appUrl}`);
  console.log(`${appUrl}/accept-invite`);
  console.log(`${appUrl}/reset-password`);
}

console.log("\n--- Vercel env (Production + Preview) ---");
console.log("VITE_SUPABASE_URL");
console.log("VITE_SUPABASE_PUBLISHABLE_KEY");
console.log("SUPABASE_SECRET_KEY");
console.log("VITE_APP_URL");
console.log("APP_ENV=production");
if (env.SETUP_TOKEN && !isPlaceholder(env.SETUP_TOKEN)) console.log("SETUP_TOKEN");

if (errors.length) {
  console.error("\nGagal. Perbaiki env lalu jalankan lagi.\n");
  process.exit(1);
}

console.log("\nSiap deploy.\n");
