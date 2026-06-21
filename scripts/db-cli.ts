/**
 * ChatCRM database CLI (Laravel-style).
 *
 *   bun db migrate
 *   bun db migrate:fresh --seed --demo
 *   bun db seed --demo
 *
 * Shorthand (same thing):
 *   bun db:migrate
 *   bun db:migrate:fresh --seed --demo
 */
import { runMigrate } from "./migrate-supabase";
import { runMigrateFresh } from "./migrate-fresh";
import { runSeed } from "./seed-cli";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h") || args.length === 0) {
  console.log(`
ChatCRM database commands

  bun db migrate                    Apply pending migrations
  bun db migrate:fresh              Drop schema + re-run migrations
  bun db migrate:fresh --seed       Fresh + default catalogs → /setup
  bun db migrate:fresh --seed --demo   Fresh + demo data + login accounts
  bun db seed                       Upsert catalogs (non-destructive)
  bun db seed --demo                Upsert demo data + auth

Shortcuts (npm script names):
  bun db:migrate
  bun db:migrate:fresh --seed --demo
  bun db:demo                       (= migrate:fresh --seed --demo)

Flags for migrate:fresh in production (APP_ENV=production):
  --force   required to proceed; --demo is never allowed

No "--" separator needed — pass flags directly after the command.
`);
  process.exit(args.length === 0 ? 1 : 0);
}

const command = args.find((a) => !a.startsWith("-")) ?? "";
const flags = args.filter((a) => a.startsWith("--"));

try {
  switch (command) {
    case "migrate":
      await runMigrate();
      break;
    case "migrate:fresh":
      await runMigrateFresh({
        withSeed: flags.includes("--seed") || flags.includes("--demo"),
        withDemo: flags.includes("--demo"),
        force: flags.includes("--force"),
      });
      break;
    case "seed":
      await runSeed({ withDemo: flags.includes("--demo") });
      break;
    default:
      console.error(`❌ Unknown command: ${command || "(empty)"}`);
      console.error("   Run: bun db --help");
      process.exit(1);
  }
} catch {
  process.exit(1);
}
