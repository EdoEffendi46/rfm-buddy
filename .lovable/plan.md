## ChatCRM — Enterprise Permission System

Implements Salesforce-style 4-layer security + audit + export approval, layered on existing role gating.

### 1. Types & Data (`src/types/index.ts`, `src/data/agents.ts`)
- Extend `Role` to `'cs' | 'supervisor' | 'owner'`. Add agent **Pak Hartono** (owner).
- New interfaces: `ManualShare`, `AuditLogEntry`, `AuditAction`, `ExportRequest`, `FieldVisibilityRule`.
- `Customer` gains `manualShares: ManualShare[]`.

### 2. Permissions (`src/lib/permissions.ts`)
- `Permission` union (all 30 from spec) and `ROLE_PERMISSIONS` map.
- `hasPermission(role, perm)`, `canAccessCustomer(agent, customer)`, `canEditCustomer(agent, customer)` (checks `manualShares` with view/edit).

### 3. Field Visibility (`src/lib/fieldVisibility.ts`)
- `FieldVisibilityRule` list with default `phone` → CS masked.
- `getFieldDisplay()` — phone is fully wired; other rules are illustrative.

### 4. Store additions (`src/lib/store.tsx`)
- New state: `auditLog`, `exportRequests`, `fieldRules`.
- Actions: `logAudit()`, `createManualShare()`, `revokeManualShare()`, `createExportRequest()`, `approveExport()`, `denyExport()`, `addFieldRule()`, `deleteFieldRule()`.
- Wire `logAudit` calls into existing actions: login, customer edit/delete/reassign, role change, message delete, transfer, settings updates.
- Seed: ~20 audit entries (last 14 days), 1 ManualShare (Putri → Budi by Admin, 7 days), 3 ExportRequests (pending/approved/denied).

### 5. UI — Settings (`src/routes/settings.tsx`)
Restructure with role-gated nav. New sections:
- **Visibilitas Field** (owner) — rules table + add-rule modal (phone is the only fully-enforced rule).
- **Audit Log** (supervisor scoped, owner full) — filters (date range, actor, action type), expandable diff rows, CSV export for owner. Supervisor cannot see owner billing/export-approval entries.
- **Persetujuan Export** (owner) — pending/historical table with approve/deny dialogs.
- **Riwayat Perubahan Role** (owner) — filtered audit view.
- **Billing & Subscription** (owner) — placeholder.
- **Export Data** — supervisor opens reason modal → request; owner exports immediately + logs.
- CS-locked sections render lock empty-state.

### 6. UI — Customers (`src/routes/customers.tsx`)
- Filter list using `canAccessCustomer` (CS only sees assigned + unassigned + shared).
- Shared rows get `🔗 Dibagikan oleh [name]` badge.
- Customer detail modal: add **Akses & Berbagi** tab (supervisor/owner): show primary assignment, list active shares with revoke, "Bagikan ke CS lain" modal (agent, view/edit, reason, duration: permanent/24h/7d).

### 7. UI — Chat (`src/components/chat/ChatPage.tsx`)
- Apply `canAccessCustomer` to conversation list (CS filtering).
- Continue using existing `maskPhone` (driven by `getFieldDisplay`).

### 8. Audit instrumentation
- Hook `logAudit` into: `login`, `updateCustomer`, `assignCustomer` (reassign), `setConversationStatus` (transfer), `sendMessage` (n/a), customer delete, agent role change/create/delete, manual share create/revoke, export request/approve/deny/complete, settings_changed for template/tag/service updates, `phone_viewed_full` when supervisor/owner opens a customer detail.

### Verification
- 3 logins (Rina/Admin/Pak Hartono) walk through checklist 1–9 via preview.

### Technical notes
- All state in-memory; new data seeded in `src/data/auditLog.ts`, `src/data/exportRequests.ts`, `src/data/manualShares.ts` (or inline in customers.ts for the share).
- No regressions to chat metadata, cadence engine, phone masking.
- Owner inherits all supervisor permissions via spread in `ROLE_PERMISSIONS`.
