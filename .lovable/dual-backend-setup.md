# Dual backend — Local (Opsi B) + Lovable (Opsi A)

Satu codebase, **dua Supabase project**, dipilih lewat **environment variables** — bukan dua client terpisah.

| | **Local (Cursor)** | **Lovable Preview** |
|---|-------------------|---------------------|
| Backend | Supabase **pribadi** (`btdoqpowkfbssfdyygpm`) | **Lovable Cloud** (project terpisah) |
| Env file | `.env.local` (gitignored) | **Cloud → Secrets** (auto dari connector) |
| Migration | `bun db:migrate` / SQL Editor pribadi | Lovable Cloud tools / port SQL dari repo |
| Auth URLs | `localhost:8080` di dashboard **pribadi** | `*.lovable.app` di **Cloud** (Lovable atur) |
| Secret key | `SUPABASE_SECRET_KEY` di `.env.local` | `SUPABASE_SECRET_KEY` di Cloud Secrets |

Kode app (`src/lib/supabase/*`) **sama** — hanya baca `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.

---

## Setup local (Opsi B) — sudah benar

1. Copy template ke `.env.local` (sudah gitignored):

```bash
cp .env.example .env.local
# isi dengan key project pribadi + pooler URL
```

2. Jalankan:

```bash
bun dev                    # Vite baca .env.local otomatis
bun db:migrate
bun db:demo
```

3. **Supabase pribadi** → Authentication → URL Configuration:
   - Site URL: `http://localhost:8080`
   - Redirect: `/accept-invite`, `/reset-password`

**Jangan commit** `.env.local`, `SUPABASE_SECRET_KEY`, atau password DB.

---

## Setup Lovable (Opsi A)

1. **Settings → Connectors → Supabase** — pakai **Lovable Cloud**, bukan project pribadi.

2. **Cloud → Secrets** — connector biasanya auto-inject:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY` (untuk invite server fn)

   Nilainya **beda** dari `.env.local` — itu normal.

3. **Rebuild preview** setelah ubah secrets (`VITE_*` di-embed saat build).

4. **Auth / redirect** — konfigurasi di **Lovable Cloud backend**, bukan dashboard Supabase pribadi.

5. **Migration & seed** — minta Lovable port SQL dari `supabase/migrations/` ke Cloud, atau paste manual setelah Anda migrate di local.

---

## Sync schema: local → Lovable Cloud

Alur disarankan:

```
1. Tulis migration di supabase/migrations/00X_*.sql
2. Local: bun run db:migrate          → DB pribadi
3. Test di localhost:8080
4. Push git → Lovable sync kode
5. Lovable chat / Cloud: "Apply migration 00X to Cloud backend"
   (atau paste isi SQL)
6. Rebuild preview + seed auth di Cloud jika perlu
```

Repo migration = **source of truth**; Cloud DB mengikuti via port manual (sampai CI/Lovable auto-migrate).

---

## Kenapa tidak perlu `supabase-self/client.ts`?

Opsi B dengan **bypass Cloud** butuh client terpisah hanya kalau **kode Lovable** harus tetap pakai Cloud sementara local pakai pribadi **dalam satu build**.

Yang Anda mau: **build berbeda per environment** (local vs Lovable host) dengan **nama env sama** → cukup `.env.local` vs Cloud Secrets.

---

## Troubleshooting

| Gejala | Perbaikan |
|--------|-----------|
| Local OK, Lovable demo picker | Cloud belum inject `VITE_*` → Secrets + rebuild |
| Lovable OK, local demo picker | Buat/isi `.env.local`, restart `bun dev` |
| Login OK, invite gagal | `SUPABASE_SECRET_KEY` belum di env target tersebut |
| Email invite redirect error | Redirect URL salah project (local vs Cloud beda dashboard) |
| Email invite masih default English | Template belum di Dashboard → Authentication → Email Templates → **Invite user** (project yang sama dengan `VITE_SUPABASE_URL`) |

Detail preview: [lovable-preview-setup.md](./lovable-preview-setup.md)
