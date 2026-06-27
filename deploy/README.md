# Deploy boilerplate - ChatCRM beli putus

Dua jalur terpisah, env dan Supabase project **jangan dicampur**.

| Profile | Supabase project | App host | Env file |
| ------- | ---------------- | -------- | -------- |
| **Dev** | `chatcrm-dev` (local) | `localhost:8080` | `.env.local` |
| **Staging** | `chatcrm-staging` | Vercel preview URL | `.env.staging` |
| **Client** | 1 project per client | Vercel / domain client | `.env.client` |

Strategi bisnis: [.lovable/beli-putus-hosting.md](../.lovable/beli-putus-hosting.md)

---

## Quick start - staging (sekarang)

```bash
# 1. Supabase: buat project "chatcrm-staging" (Free tier)

# 2. Env staging
cp deploy/env/staging.example.env .env.staging
# isi keys dari Supabase Dashboard → Settings → API

# 3. DB
DEPLOY_PROFILE=staging bun db:migrate
DEPLOY_PROFILE=staging bun run deploy:check:staging

# 4. Vercel: import repo → Framework auto / TanStack Start
#    Set env vars (sama seperti .env.staging, tanpa DATABASE_URL kecuali CI)
#    Deploy → copy URL → update VITE_APP_URL + redeploy

# 5. Supabase Auth → URL Configuration (lihat output deploy:check)

# 6. Buka URL staging → /setup → owner test
```

Detail: [staging.md](./staging.md)

---

## Client baru (ulang tiap jual beli putus)

```bash
cp deploy/env/client.example.env .env.client
# isi project Supabase client + VITE_APP_URL domain mereka

DEPLOY_PROFILE=client bun db:migrate
DEPLOY_PROFILE=client bun run deploy:check:client

# Vercel: new project OR new env group per client
# Handover: URL + owner credentials setelah /setup
```

Detail: [client-onboard.md](./client-onboard.md)

---

## Build targets

| Host | Nitro preset | Cara trigger |
| ---- | ------------ | ------------ |
| **Vercel** | `vercel` | Otomatis (`VERCEL=1` saat build di Vercel) |
| **Lovable** | `cloudflare-module` | Forced di sandbox Lovable |
| **Local test Vercel output** | `vercel` | `bun run build:vercel` |

Config: `vite.config.ts` (jangan duplikasi plugin manual).

---

## Scripts

| Command | Fungsi |
| ------- | ------ |
| `bun run deploy:check` | Cek `.env.local` |
| `bun run deploy:check:staging` | Cek `.env.staging` |
| `bun run deploy:check:client` | Cek `.env.client` |
| `bun run build:vercel` | Build output `.vercel/output` lokal |
| `DEPLOY_PROFILE=staging bun db:migrate` | Migration ke DB staging |

---

## File env (gitignored)

| File | Dibuat dari |
| ---- | ----------- |
| `.env.local` | `.env.example` (dev) |
| `.env.staging` | `deploy/env/staging.example.env` |
| `.env.client` | `deploy/env/client.example.env` |

Jangan commit file berisi secret.

---

## Vercel checklist (staging & client)

1. Import Git repo
2. Install: `bun install` (auto via `vercel.json`)
3. Build: `bun run build` (Nitro Vercel preset via `VERCEL=1`)
4. Environment variables - **Production** (dan Preview untuk staging):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `VITE_APP_URL` = URL deploy final
   - `APP_ENV=production`
   - `SETUP_TOKEN` (client production)
   - `WHATSAPP_*` (optional)
5. Redeploy setelah ubah `VITE_*` (embedded saat build)

---

## Supabase checklist (setiap project)

1. SQL: `bun db:migrate` dengan `DEPLOY_PROFILE` yang benar
2. Authentication → URL Configuration (Site URL + redirects)
3. Email Templates → Invite user (`supabase/templates/invite.html`)
4. (Production client) Custom SMTP

---

## Related

- [staging.md](./staging.md) - first-time staging
- [client-onboard.md](./client-onboard.md) - repeat per client
- [vercel-env.md](./vercel-env.md) - copy-paste env groups
