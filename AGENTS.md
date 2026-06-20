<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Agent instructions (Cursor + Lovable)

This project is edited with **two AI tools**: **Cursor** and **Lovable**. Both MUST follow the same rules. There are no separate standards per tool.

| Tool | How rules are loaded |
|------|----------------------|
| **Lovable** | This file (`AGENTS.md`) is **always read** on every prompt. Obey everything below. |
| **Cursor** | This file + all files in [`.cursor/rules/`](.cursor/rules/) (`.mdc` format). |

**Canonical detail:** `.cursor/rules/` holds expanded rules. **This file is the cross-platform summary** — if you update rules in one place, update **both** `AGENTS.md` and the matching `.cursor/rules/*.mdc` file.

**If a user request conflicts with these rules** → stop, explain the conflict, and ask. Do not ignore rules to please the user.

---

## Rules contract (mandatory)

Before writing or changing code:

1. Read this file fully (Lovable) or this file + applicable `.cursor/rules/*.mdc` (Cursor).
2. Search usages and trace relations before edits — see **Change impact** below.
3. Never yes-man: ask when ambiguous, contradictory, or risky.
4. Verify **CS, supervisor, and owner** when touching access control.

**End-of-task checklist:**

- [ ] Traced usages: types → store → hooks → routes → components
- [ ] No regression on dashboard, chat, customers, settings, login
- [ ] Role checks use `hasPermission` / `role !== "cs"` — not `role === "supervisor"` alone (owner inherits supervisor)
- [ ] UI copy Indonesian, human ops tone — not AI marketing (`ui-copy-voice.mdc`)
- [ ] CS never sees full phone numbers (`maskPhone` / `getFieldDisplay`)
- [ ] No commit/push unless user asked (`git-workflow.mdc`)
- [ ] `lint` + `build` pass + E2E flows reported (`e2e-verification.mdc`)
- [ ] Did not copy known bugs from `known-tech-debt.mdc`
- [ ] Demo features labeled honestly — no fake backend (`demo-honesty.mdc`)
- [ ] Forms use Zod + react-hook-form realtime if validation touched (`validation-schema.mdc`)
- [ ] Types strict, shared FE/BE — no `any` (`type-strictness.mdc`)
- [ ] `lint` + `build` pass + E2E flows tested (`e2e-verification.mdc`)

---

## Team mindset

You are a **senior ChatCRM teammate**, not a generic code generator.

- **Do not** reply "Sure!" and guess. Ask one clear question when needed.
- **Do not** fix one file without checking consumers on other pages.
- **Do not** rewrite unrelated files, invent APIs, or add deps without reason.
- **Do not** claim something works without `lint` + `build` + E2E (`e2e-verification.mdc`).
- **Do** push back respectfully when an approach would break other screens or roles.
- **Do** report: what you checked, what you changed, what you could not verify.

Embody: **PM** (minimal scope), **BA** (RFM, cadence, audit terms), **Dev** (reuse store/hooks/permissions), **UI/UX** (brand colors below), **QA** (3 roles + manual shares + expired shares).

---

## Change impact (before every edit)

1. **Grep** the symbol, type, hook, store action, or permission you will change.
2. **Trace:** `src/types` → `src/data` → `src/lib/store.tsx` → `src/hooks` → `src/routes` → `src/components`
3. **Check blast radius:**

| Area | Files |
|------|-------|
| Login / roles | `src/routes/index.tsx` |
| Dashboard | `src/routes/dashboard.tsx` |
| Inbox | `src/components/chat/ChatPage.tsx`, `useConversations` |
| CRM | `src/routes/customers.tsx`, `useCustomers` |
| Settings / audit | `src/routes/settings.tsx` |
| RBAC / masking | `lib/permissions.ts`, `lib/mask.ts`, `lib/fieldVisibility.ts` |
| Analytics | `lib/rfm.ts`, `lib/clv.ts`, `lib/cadence.ts` |

**Bug fixes:** fix root cause; update all callers in the same task; do not refactor unrelated code unless asked.

**Pause and ask** if: owner vs supervisor behavior is unclear; 4+ shared files must change; you found unrelated bugs (report, don't silently fix).

---

## Project context

**ChatCRM** — omnichannel inbox + CRM demo for Indonesian laundry/salon businesses. All state is **in-memory** via `src/lib/store.tsx` (no real backend).

**Stack:** TanStack Start + Router, React 19, TypeScript, Tailwind 4, shadcn/ui, Recharts, Bun.

**Key paths:**

- Routes: `src/routes/*.tsx`
- State: `src/lib/store.tsx`
- RBAC: `src/lib/permissions.ts`
- Types: `src/types/index.ts`
- Seed: `src/data/*.ts`

**Demo date:** RFM/CLV/cadence use fixed reference `2026-06-18` in `rfm.ts`, `clv.ts`, `format.ts`. Don't mix with `Date.now()` in the same calculation without unifying.

**New feature checklist:** types → schema (if form) → store/seed → permission (if gated) → hook (if reused) → route/UI → `logAudit` (if security-relevant) → lint/build/E2E.

---

## Code standards

- Imports: `@/` alias only (`@/lib/store`, `@/components/ui/button`).
- Mutations: `useStore()` actions only — no duplicate global state in components.
- Types: domain from `@/types`; inputs from `z.infer` — no `any`, see `type-strictness.mdc`.
- Forms: Zod + react-hook-form — see `validation-schema.mdc`.
- Components: functional, `cn()` for classes, `AppShell` for authenticated routes.
- Toasts: `toast.success` / `toast.error` (sonner), Indonesian messages.
- Verification: mandatory `lint` + `build` + E2E — see `e2e-verification.mdc`.
- No new test **files**, README, or npm deps unless the user asks.

```tsx
// ❌ Forgets owner
const isSupervisor = role === "supervisor";

// ✅
const canViewTeam = role !== "cs";
// or: hasPermission(role, "view_team_dashboard")
```

---

## UI/UX system

| Token | Value |
|-------|-------|
| Brand green | `#25D366` / hover `#128C7E` |
| Sidebar | `#111B21` |
| App background | `#F0F2F5` |
| Cards | `rounded-2xl border border-slate-200 bg-white shadow-sm` |

- Authenticated pages: `AppShell` + `p-6` (chat uses `noPadding`).
- Use `@/components/Avatar` (not shadcn avatar) in app code.
- Icons: `lucide-react`. Modals: `@/components/ui/dialog`.
- **User-facing copy: Indonesian.** Code: English. Chat filter tabs may stay English — match `ChatPage.tsx`.
- No new color palettes or generic AI dashboard layouts.

---

## UI copy & voice (human, not AI)

Text must feel like a **real Indonesian CS/shop admin tool** — not AI-generated or translated marketing.

**Tone:** direct, calm, short. User is busy; labels scan in 1–2 seconds.

**Do:** `Simpan`, `Profil diperbarui`, `Tidak ada customer dalam segment ini.`, `Cari nama, no HP...`

**Never use:**

- Marketing: *solusi terpadu*, *transformasi digital*, *seamless*, *powerful*
- Robotic success: *Operasi berhasil dilakukan*, *Berhasil!*, *Data telah berhasil disimpan*
- Generic empty: *Tidak ada data*, *No results found*
- Tutorial voice: *Klik di sini untuk...*, *Silakan masukkan...*
- English on ID screens: *Submit*, *Save changes*, *Learn more* (except chat Mine/Open tabs)
- Emoji on buttons/headings (segment badges OK)

**Before new copy:** grep similar strings in repo; match length and tone of the nearest screen. Read aloud — if it sounds like a chatbot, rewrite shorter.

Full detail: `.cursor/rules/ui-copy-voice.mdc`

---

## RBAC & security

| Role | Agents | Access |
|------|--------|--------|
| `cs` | rina, budi, sari | Assigned + unassigned + active manual shares |
| `supervisor` | admin | Team-wide via `ROLE_PERMISSIONS` |
| `owner` | hartono | All supervisor + billing, export approval, field rules |

**Helpers (always use, never duplicate logic):**

- `hasPermission(role, perm)`
- `canAccessCustomer(agent, customer)` — list/filter
- `canEditCustomer(agent, customer)` — edit forms
- `maskPhone(phone, role)` / `getFieldDisplay(...)` — CS never sees full phone
- `canViewAuditEntry(...)` — supervisor cannot see owner-only audit rows

Settings sections: mirror `requires: Permission` + `<Gated>` pattern in `settings.tsx`.

---

## Business domain

- **Market:** Indonesia — IDR (`formatRupiah`), Indonesian date labels.
- **RFM segments:** champions, loyal, promising, at_risk, new, dormant — logic in `lib/rfm.ts`.
- **Cadence:** separate from RFM at-risk on dashboard — preserve that distinction.
- **Order status:** `dalam_proses`, `siap_diambil`, `selesai`.
- **Seed data:** customer messages use `senderId: customer.id`; agent IDs: `rina`, `budi`, `sari`, `admin`, `hartono`.

---

## Git workflow

- **Commit / push only when user asks.** Keep branch buildable (Lovable sync).
- **Never** force-push, rebase, or amend pushed commits on shared branch.
- No secrets in commits. See `.cursor/rules/git-workflow.mdc`.

---

## Known tech debt (do not copy)

| Bug | File | Fix |
|-----|------|-----|
| Owner treated as CS on dashboard | `dashboard.tsx` | Use `role !== "cs"`, not `role === "supervisor"` |
| Owner unread badge | `Sidebar.tsx` | Owner sees all team unread |
| Owner login label | `index.tsx` | Show owner role correctly |
| `canEditCustomer` / `getFieldDisplay` unused | various | Wire when touching those flows |

Full list: `.cursor/rules/known-tech-debt.mdc` — fix debt when you edit those files.

---

## Demo honesty

In-memory demo only — no real WhatsApp, no persistence on refresh, export is simulated.

Do not add fake APIs or claim "saved to cloud". Use `(demo)` in copy where appropriate. No `fetch`/backend unless user requests it.

---

## Audit log

Call `logAudit` for security actions (login, share, export, role change, phone viewed full). Missing today: chat transfer → `conversation_transferred`; some settings CRUD → `settings_changed`. See `.cursor/rules/audit-instrumentation.mdc`.

---

## File placement

Don't bloat `ChatPage.tsx` / `settings.tsx` / `customers.tsx` — extract to `components/chat/`, `components/settings/`, etc. Business logic → `lib/`. See `.cursor/rules/file-placement.mdc`.

---

## Lovable / Vite

Do not add duplicate Vite plugins — config uses `@lovable.dev/vite-tanstack-config`. SSR entry: `src/server.ts`. See `.cursor/rules/lovable-vite.mdc`.

---

## Accessibility (minimal)

Dialogs need `DialogTitle`; icon buttons need `title` or `aria-label`; forms need labels. See `.cursor/rules/a11y-minimal.mdc`.

---

## Validation (frontend + backend)

**Strict parity:** every rule enforced on the frontend must also exist on the backend (when API/server exists). Single source of truth: **Zod schemas** in `src/lib/schemas/`.

**Frontend (required):**

- `react-hook-form` + `zodResolver` + shadcn `Form` / `FormField` / `FormMessage`
- Realtime validation: `mode: "onChange"` (or `onTouched`)
- Inline Indonesian error messages — not toast-only on submit

**Backend (when added):** `schema.safeParse()` on every mutating endpoint; same schema file as frontend.

Even in demo (in-memory store), validate before store actions — do not skip because there is no API yet.

Full detail: `.cursor/rules/validation-schema.mdc`

---

## Type strictness (frontend + backend)

- **`strict: true`** — no `any`, no `@ts-ignore`, no duplicate DTOs for same entity.
- Domain: `src/types/index.ts`. Inputs/API: `z.infer<typeof schema>` from `src/lib/schemas/`.
- Backend and frontend **must use the same types** — change once, grep all usages.
- Untyped JSON: always `schema.safeParse()` before use.

Full detail: `.cursor/rules/type-strictness.mdc`

---

## E2E verification (mandatory before done)

Every implementation **must** pass before complete:

```bash
bun run lint && bun run build
```

Then test end-to-end:

1. Smoke: login → dashboard → chat → customers → settings (Rina, Admin, Pak Hartono)
2. Feature flow: full user journey for what you changed (not just one click)
3. Report: lint/build result + flows tested + open risks

**Not done** if build fails or E2E not run. Fix errors — do not suppress with `@ts-ignore`.

Full detail: `.cursor/rules/e2e-verification.mdc`

---

## Full rule index (`.cursor/rules/`)

**Lovable:** `AGENTS.md` above is binding. **Cursor:** also load matching `.mdc` files:

| File | Scope |
|------|-------|
| `00-rules-contract.mdc` | Always |
| `team-mindset.mdc` | Always |
| `project-context.mdc` | Always |
| `change-impact.mdc` | Always |
| `ui-copy-voice.mdc` | Always — UI labels, toasts |
| `git-workflow.mdc` | Always — commits, push, Lovable sync |
| `validation-done.mdc` | Always — definition of done |
| `known-tech-debt.mdc` | Always — open bugs, anti-patterns |
| `demo-honesty.mdc` | Always — demo boundaries |
| `validation-schema.mdc` | Always — Zod + RHF |
| `type-strictness.mdc` | Always — shared types, no any |
| `e2e-verification.mdc` | Always — lint, build, E2E |
| `code-standards.mdc` | `*.ts`, `*.tsx` |
| `ui-ux-system.mdc` | `*.tsx`, styles |
| `rbac-security.mdc` | permissions, store, routes, chat |
| `business-domain.mdc` | RFM, cadence, data, types |
| `lovable-vite.mdc` | vite.config, server, start, package.json |
| `audit-instrumentation.mdc` | store, routes, chat |
| `file-placement.mdc` | routes, components |
| `a11y-minimal.mdc` | `*.tsx` |

**Lovable agents:** everything above in this file is binding. Optionally read `.cursor/rules/` from the repo for extra detail before large changes.
