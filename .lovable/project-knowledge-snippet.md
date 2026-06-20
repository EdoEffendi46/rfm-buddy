# Lovable project knowledge (optional paste)

Paste into **Lovable → Project → Knowledge** (max 10,000 chars). Same policy as root `AGENTS.md`.

---

**Mandatory:** Follow `AGENTS.md` on every edit. Cursor + Lovable share one rule set.

**Mindset:** Ask if unclear — never yes-man. Grep usages before edits. Trace types → store → hooks → routes. Fix root cause; don't break dashboard, chat, customers, settings.

**Roles:** CS / supervisor / owner — use `hasPermission`, `canAccessCustomer`, `maskPhone`. Owner inherits supervisor; never `role === "supervisor"` alone (known bug in dashboard/Sidebar/login).

**Git:** Commit/push ONLY when user asks. No force-push. Branch must stay buildable (Lovable sync).

**Done means:** lint/build if possible + test Rina, Admin, Pak Hartono on touched pages.

**Demo:** WhatsApp inbox simulated. Supabase auth+DB real when configured. Export simulated unless implemented.

**MVP 1 (beli putus):** NO public register. Owner invites via Settings → email → accept-invite set password. Single tenant — not SaaS yet. See `.cursor/rules/mvp1-product.mdc`.

**Validation:** Zod schemas in `src/lib/schemas/` — shared frontend + backend. Forms: react-hook-form + zodResolver, realtime `onChange`, inline errors.

**Types:** Strict — no `any`. Domain in `src/types`, inputs via `z.infer`. FE/BE must match.

**Before done:** `bun run lint && bun run build` MUST pass. E2E test: login 3 roles → all routes → full flow for changed feature.

**UI:** Brand `#25D366`, sidebar `#111B21`. Indonesian copy — short ops tone, not AI marketing.

**Vite:** Don't add duplicate plugins — uses `@lovable.dev/vite-tanstack-config`.

Full rules: `AGENTS.md` + `.cursor/rules/` in repo.
