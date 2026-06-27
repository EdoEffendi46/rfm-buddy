# ChatCRM

An omnichannel inbox and CRM **flexible for any business** — laundry, salon, retail, F&B, clinic, and more. Owner configures services, categories, and workflow. ChatCRM combines a WhatsApp-style conversation workspace with customer segmentation (RFM), order cadence predictions, and a Salesforce-inspired permission model in a single web app.

Built with **TanStack Start**, **React 19**, and **TypeScript**. Data is stored in-memory for demo purposes; no external database is required.

---

## Features

### Inbox & CRM

- **Unified chat inbox** with conversation filters (mine, unassigned, open, resolved, snoozed)
- **Customer directory** with table/card views, search, and RFM segment filters
- **Customer detail** with purchase history, notes, tags, cadence override, and manual record sharing
- **Quick-reply templates**, conversation tags, snooze, and transfer workflows

### Analytics

- **RFM segmentation** — Champions, Loyal, Promising, At Risk, New, Dormant
- **CLV estimation** — 12-month projected customer lifetime value
- **Order cadence engine** — predicts next order date from purchase patterns (with manual override)
- **Supervisor dashboard** — segment distribution charts, monthly spending trends, follow-up queues, team performance

### Security & Governance

- **Role-based access control** — CS, Supervisor, and Owner roles with 30 granular permissions
- **Record-level sharing** — manual share with view/edit permission and optional expiry
- **Field visibility rules** — phone number masking for CS agents
- **Audit log** — filterable activity trail with role-scoped visibility
- **Export approval workflow** — supervisors request exports; owners approve or deny

---

## Demo Accounts

Sign in from the home page by selecting a demo agent. Each role exposes different UI and permissions.

| Agent            | Role       | Access                                                                                  |
| ---------------- | ---------- | --------------------------------------------------------------------------------------- |
| Rina, Budi, Sari | CS         | Assigned customers, masked phone numbers, own conversations                             |
| Admin            | Supervisor | Full team view, customer management, export requests, audit log                         |
| Pak Hartono      | Owner      | All supervisor capabilities + billing, export approval, field rules, permission history |

---

## Tech Stack

| Layer     | Technology                                                                                    |
| --------- | --------------------------------------------------------------------------------------------- |
| Framework | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) |
| UI        | React 19, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com) (Radix UI)                       |
| Charts    | Recharts                                                                                      |
| State     | React Context (`src/lib/store.tsx`) with seeded in-memory data                                |
| Build     | Vite 8, Nitro                                                                                 |
| Language  | TypeScript 5                                                                                  |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended — project uses `bun.lock`) or Node.js 20+

### Install

```bash
git clone <repository-url>
cd rfm-buddy
bun install
```

### Development

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with any demo account.

### Build & Preview

```bash
bun run build
bun run preview
```

### Lint & Format

```bash
bun run lint
bun run format
```

---

## Project Structure

```
src/
├── routes/              # File-based routes (TanStack Router)
│   ├── index.tsx        # Login / role picker
│   ├── dashboard.tsx    # KPIs, charts, follow-up queues
│   ├── chat.tsx         # Chat inbox
│   ├── chat.$customerId.tsx
│   ├── customers.tsx    # Customer list & detail modal
│   └── settings.tsx     # Profile, team, audit, export, billing
├── components/
│   ├── chat/            # ChatPage (main inbox UI)
│   ├── layout/          # AppShell, Sidebar
│   └── ui/              # shadcn/ui primitives
├── hooks/               # useAuth, useCustomers, useConversations
├── lib/
│   ├── store.tsx        # Global in-memory state & actions
│   ├── permissions.ts   # RBAC helpers
│   ├── rfm.ts           # RFM scoring & segmentation
│   ├── clv.ts           # Customer lifetime value
│   ├── cadence.ts       # Order frequency & prediction
│   ├── mask.ts          # Phone number masking
│   └── fieldVisibility.ts
├── data/                # Seed data (agents, customers, messages, audit log)
└── types/               # Shared TypeScript interfaces
```

---

## Routes

| Path                | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| `/`                 | Demo login — pick an agent to explore role-based access         |
| `/dashboard`        | Overview KPIs, RFM charts, cadence follow-up (supervisor/owner) |
| `/chat`             | Omnichannel inbox                                               |
| `/chat/:customerId` | Inbox with a conversation pre-selected                          |
| `/customers`        | Customer CRM with filters, detail modal, and sharing            |
| `/settings`         | Profile, team, templates, audit log, export, and billing        |

---

## Business Logic

### RFM Segmentation

Customers are scored on **Recency**, **Frequency**, and **Monetary** value (1–5 each), then mapped to one of six segments. Scoring thresholds and segment rules live in `src/lib/rfm.ts`.

### Order Cadence

Purchase history is analyzed to compute average days between orders, a human-readable cadence label (daily, weekly, bi-weekly, monthly, irregular), and a predicted next order date. CS agents and supervisors can set a manual cadence override per customer.

### Permissions

Permissions are declared in `src/lib/permissions.ts`. Key helpers:

- `hasPermission(role, permission)` — check a single permission
- `canAccessCustomer(agent, customer)` — CS sees assigned, unassigned, and shared records
- `canEditCustomer(agent, customer)` — respects manual share edit grants
- `canViewAuditEntry(viewerRole, …)` — supervisors cannot see owner-only audit entries

---

## Demo Mode Notes

This is a **frontend demo** with seeded data:

- All state resets on page refresh (in-memory store, no persistence)
- Reference date for RFM/CLV calculations is fixed at **2026-06-18** for consistent demo output
- WhatsApp integration is simulated — messages are mock data, not live API calls
- Billing and some workflow settings are UI placeholders

---

## Production deploy (beli putus)

**Strategi hosting lengkap:** [.lovable/beli-putus-hosting.md](.lovable/beli-putus-hosting.md) (Free tier pilot, upgrade path, ownership akun client).

**Boilerplate deploy (staging + client):** [deploy/README.md](deploy/README.md)

1. Create Supabase project for the client.
2. Set env vars (`VITE_SUPABASE_*`, `SUPABASE_SECRET_KEY`, `APP_ENV=production`; optional `SETUP_TOKEN`).
3. Run migrations: `bun db:migrate`
4. Deploy the app (Lovable / your host).
5. Client opens the URL → redirected to **`/setup`** → fills business name + owner account.
6. Owner invites CS/supervisor from Settings.

**Dev / demo** (optional): `bun db:demo`

### Local: test both modes

| Mode                   | Command                       | Browser                              |
| ---------------------- | ----------------------------- | ------------------------------------ |
| **Pending migrations** | `bun db:migrate`              | —                                    |
| **Fresh empty**        | `bun db:migrate:fresh`        | Incognito → `/setup`                 |
| **Fresh + defaults**   | `bun db:migrate:fresh --seed` | `/setup` (catalogs pre-filled)       |
| **Fresh + demo**       | `bun db:demo`                 | `hartono@chatcrm.demo` / `Demo1234!` |

**Non-destructive upsert:**

| Command              | Effect                  |
| -------------------- | ----------------------- |
| `bun db:seed`        | Upsert catalogs         |
| `bun db:seed --demo` | Upsert demo data + auth |

Flags langsung setelah command — **tanpa** `--` pemisah: `bun db:migrate:fresh --seed --demo`

---

## Scripts

| Command                              | Description                                      |
| ------------------------------------ | ------------------------------------------------ |
| `bun run dev`                        | Start development server                         |
| `bun run build`                      | Production build                                 |
| `bun run build:dev`                  | Development-mode build                           |
| `bun run preview`                    | Preview production build locally                 |
| `bun run lint`                       | Run ESLint                                       |
| `bun db:migrate`                     | Apply pending SQL migrations                     |
| `bun db:migrate:fresh`               | Drop schema + re-run all migrations + clear auth |
| `bun db:migrate:fresh --seed`        | Fresh + base catalogs → `/setup`                 |
| `bun db:migrate:fresh --seed --demo` | Fresh + full demo (local dev only)               |
| `bun db:seed --demo`                 | Upsert demo data + auth (non-destructive)        |

**Production guard:** set `APP_ENV=production` on client deploys. `db:migrate:fresh` is blocked unless `--force` is passed; `--demo` is never allowed in production.

---

## Related

- [Lovable](https://lovable.dev) — project editor and deployment platform
- [TanStack Start docs](https://tanstack.com/start/latest/docs/framework/react/overview)
