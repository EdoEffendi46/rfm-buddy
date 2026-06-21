/** Laravel-style APP_ENV check for destructive CLI guards. */
export function isProductionEnv(env: Record<string, string>): boolean {
  const appEnv = (env.APP_ENV ?? env.NODE_ENV ?? "local").toLowerCase();
  return appEnv === "production" || appEnv === "prod";
}

export function productionGuardMessage(command: string): string {
  return [
    "",
    "╔══════════════════════════════════════════════════════════════╗",
    "║  ⚠  PRODUCTION ENVIRONMENT DETECTED (APP_ENV=production)      ║",
    "╠══════════════════════════════════════════════════════════════╣",
    `║  ${command.padEnd(60)}║`,
    "║  This will DROP ALL TABLES and DELETE ALL AUTH USERS.        ║",
    "║  All client data will be permanently lost.                   ║",
    "╚══════════════════════════════════════════════════════════════╝",
    "",
    "  To proceed, pass --force:",
    `    bun db:migrate:fresh --force`,
    "",
    "  Set APP_ENV=local in .env.local for local dev (default-safe).",
    "",
  ].join("\n");
}
