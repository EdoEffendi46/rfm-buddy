# ChatCRM — Supabase backend migration

> **Supabase connector sudah connected di Lovable.** File ini + SQL migration di `supabase/migrations/` adalah blueprint migrasi dari in-memory `store.tsx` ke PostgreSQL.

## ⚠️ Push git ≠ tabel otomatis di Supabase

| Aksi | Yang terjadi |
|------|----------------|
| `git push` dari Cursor | Kode + file migration **sync ke GitHub → Lovable** |
| Supabase tables | **Tidak otomatis** kecuali SQL dijalankan (lihat bawah) |
| Lovable Preview | Baru pakai DB setelah **schema ada** + **kode app** panggil Supabase |

**Setelah push**, pilih salah satu untuk buat tabel:

1. **Supabase Dashboard → SQL Editor** → paste & run isi `supabase/migrations/001_initial_schema.sql`
2. **Atau** paste prompt di bawah ke **chat Lovable** → Lovable jalankan SQL ke project Supabase yang sudah connected
3. **Atau** Supabase CLI: `supabase db push` (kalau project di-link ke CLI)
4. **Otomatis (disarankan)** — GitHub Actions `.github/workflows/supabase-migrate.yml` jalankan `supabase db push` setiap push ke `main` yang mengubah `supabase/migrations/`

Tanpa langkah di atas, push hanya mengirim **file**, bukan mengeksekusi migration.

---

## Auto migration on push (GitHub Actions)

Workflow sudah ada di `.github/workflows/supabase-migrate.yml`. Setelah secrets diisi, setiap push ke `main` yang mengubah file migration akan menjalankan `supabase db push` ke project Supabase Anda.

### Setup sekali (GitHub repo)

1. **Supabase Access Token** — [Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens) → buat token baru
2. **Project ref** — URL project: `https://supabase.com/dashboard/project/<PROJECT_REF>` → copy `<PROJECT_REF>`
3. **Database password** — Project → Settings → Database → password yang dibuat saat project dibuat (reset jika lupa)

4. **GitHub** → repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Isi |
|--------|-----|
| `SUPABASE_ACCESS_TOKEN` | Personal access token |
| `SUPABASE_PROJECT_ID` | Project ref (contoh: `btdoqpowkfbssfdyygpm`) |
| `SUPABASE_DB_PASSWORD` | Password database Postgres |

5. Push ke `main` — cek tab **Actions** di GitHub; job **Supabase Migrations** harus hijau.

### Lokal (manual)

```bash
# Sekali: link project (butuh Supabase CLI — brew install supabase/tap/supabase)
export SUPABASE_ACCESS_TOKEN=...
supabase link --project-ref YOUR_PROJECT_REF

# Setiap ada migration baru
bun run db:push
```

### Schema sudah pernah di-run manual?

Kalau `001_initial_schema.sql` sudah dijalankan lewat SQL Editor **sebelum** CI pertama kali, `db push` bisa gagal karena tabel sudah ada. Baseline history:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase migration repair --status applied 001_initial_schema
supabase migration repair --status applied 002_auth   # jika sudah di-run
supabase db push
```

Atau jalankan repair lewat satu kali di SQL Editor + insert ke `supabase_migrations.schema_migrations` — lihat [Supabase docs: managing environments](https://supabase.com/docs/guides/deployment/managing-environments).

**Catatan:** Push ke GitHub/Lovable **tidak** menjalankan migration sendiri — hanya GitHub Action (atau CLI manual) yang mengeksekusi SQL ke database.

---

## Prompt untuk Lovable chat (copy-paste)

```
Supabase sudah connected via Settings → Connectors.

Migrate ChatCRM dari in-memory React Context (src/lib/store.tsx) ke Supabase PostgreSQL.

CONSTRAINTS (wajib):
- Stack: TanStack Start — semua akses DB via createServerFn(), JANGAN import @supabase/supabase-js di client components/routes.
- Reuse src/lib/permissions.ts, src/lib/schemas/, src/types/index.ts — jangan duplikasi RBAC.
- Validasi input pakai Zod schemas yang sama di server function handler.
- Auth login demo (agent picker di routes/index.tsx) boleh tetap; session = currentAgentId di cookie/localStorage, bukan Supabase Auth dulu.
- Seed data dari src/data/*.ts setelah schema dibuat.

SCHEMA:
- Jalankan migration dari repo: supabase/migrations/001_initial_schema.sql
- Atau generate equivalent tables: agents, customers, purchases, messages, services, templates, tags, manual_shares, audit_log, export_requests, field_visibility_rules

IMPLEMENTASI:
1. Install @supabase/supabase-js
2. src/lib/supabase/server.ts — createClient server-only (env: VITE_SUPABASE_URL + SUPABASE_SECRET_KEY sb_secret_...)
3. Server functions per domain: customers, messages, agents, audit, settings
4. Refactor store.tsx: baca/tulis via server functions; keep same hook API (useStore, useCustomers, useConversations) supaya routes tidak break
5. Tambah .env.example; jangan commit secrets

VERIFY:
- Preview: tambah customer → row muncul di Supabase Table Editor
- Refresh preview → data masih ada (persistent)
- CS role: phone masked via getFieldDisplay + RLS/policy jika perlu

Commit perubahan dan sync ke GitHub.
```

---

## Prompt alternatif (incremental — lebih aman)

Kalau full migrate terlalu besar, minta Lovable fase demi fase:

**Fase A — schema + seed saja**
```
Run supabase/migrations/001_initial_schema.sql on connected Supabase. Seed agents and customers from src/data/*.ts. No app code changes yet.
```

**Fase B — customers CRUD**
```
Wire addCustomer and updateCustomer in store.tsx to Supabase via createServerFn. Keep rest in-memory for now.
```

**Fase C — messages + chat**
```
Wire sendMessage, markRead, conversations list to Supabase.
```

**Fase D — audit, export, settings**
```
Migrate audit_log, export_requests, field_rules, templates, services, tags.
```

---

## Env vars (dev lokal di Cursor)

Copy `.env.example` → `.env` (jangan commit `.env`).

Ambil dari **Supabase Dashboard → Settings → API**:
- `VITE_SUPABASE_URL` — Project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — `sb_publishable_...` (client)
- `SUPABASE_SECRET_KEY` — `sb_secret_...` (server only, Settings → API Keys → Secret keys)

Lovable connected project biasanya inject env otomatis di Preview; lokal harus isi manual.

---

## Checklist setelah migrasi

- [ ] SQL migration di-run di Supabase (Table Editor terlihat tabel)
- [ ] Seed data ada (12 customers, 5 agents, messages)
- [ ] `git pull` di Cursor dapat kode terbaru dari Lovable (kalau Lovable yang implement)
- [ ] `.env` lokal terisi
- [ ] `bun run build` lulus
- [ ] Preview: refresh tidak reset data
